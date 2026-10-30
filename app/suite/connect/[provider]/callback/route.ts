import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMembership } from "@/lib/suite/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/social/crypto";
import { suiteAppUrl } from "@/lib/social/config";
import {
  OAuthError,
  exchangeLinkedInCode,
  exchangeMetaCode,
  fetchLinkedInIdentity,
  fetchMetaPages,
  statesMatch,
} from "@/lib/social/oauth";

type SaveAccount = {
  provider: "linkedin" | "facebook" | "instagram";
  externalId: string;
  displayName: string;
  token: string;
  expiresAt: Date | null;
};

// Finishes the OAuth flow. The state cookie must match the state on the redirect,
// and the state must belong to the organization this user is acting for.
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== "linkedin" && provider !== "meta") {
    return new NextResponse("Unknown provider", { status: 404 });
  }

  const url = new URL(request.url);
  const back = (path: string, message: string, key: "notice" | "error") =>
    NextResponse.redirect(new URL(`/suite${path}?${key}=${encodeURIComponent(message)}`, request.url));

  const jar = await cookies();
  const cookieName = `social_oauth_${provider}`;
  const cookieState = jar.get(cookieName)?.value;
  jar.delete(cookieName);

  const membership = await getCurrentMembership();
  if (!membership?.organizations) {
    return back("", "Sign in to connect accounts.", "error");
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    return back("/accounts", "Only owners and admins can connect accounts.", "error");
  }

  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (providerError) {
    return back("/accounts", `Connection was not completed: ${providerError}`, "error");
  }

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!statesMatch(cookieState, state) || !code) {
    return back("/accounts", "The connection request expired or did not match. Try again.", "error");
  }
  if (!state?.endsWith(`.${membership.org_id}`)) {
    return back("/accounts", "This connection was started for a different organization.", "error");
  }

  const redirectUri = `${suiteAppUrl()}/suite/connect/${provider}/callback`;

  let accounts: SaveAccount[];
  try {
    accounts = provider === "linkedin" ? await linkedinAccounts(code, redirectUri) : await metaAccounts(code, redirectUri);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed.";
    return back("/accounts", message, "error");
  }

  const supabase = await createSupabaseServerClient();
  for (const account of accounts) {
    const { error } = await supabase.rpc("save_social_account", {
      p_org_id: membership.org_id,
      p_provider: account.provider,
      p_external_id: account.externalId,
      p_display_name: account.displayName,
      p_token_ciphertext: encryptToken(account.token),
      p_expires_at: account.expiresAt?.toISOString() ?? null,
    });
    if (error) {
      return back("/accounts", error.message.replace(/^ERROR:\s*/, ""), "error");
    }
  }

  const count = accounts.length;
  return back("/accounts", `Connected ${count} account${count === 1 ? "" : "s"}.`, "notice");
}

async function linkedinAccounts(code: string, redirectUri: string): Promise<SaveAccount[]> {
  const token = await exchangeLinkedInCode({
    code,
    redirectUri,
    clientId: requireEnv("LINKEDIN_CLIENT_ID"),
    clientSecret: requireEnv("LINKEDIN_CLIENT_SECRET"),
  });
  const identity = await fetchLinkedInIdentity(token.accessToken);

  return [
    {
      provider: "linkedin",
      externalId: identity.memberId,
      displayName: identity.name,
      token: token.accessToken,
      expiresAt: token.expiresAt,
    },
  ];
}

// One Facebook Page per managed page, plus its Instagram account when linked.
// Page tokens come from the long-lived user token and are stored per page.
async function metaAccounts(code: string, redirectUri: string): Promise<SaveAccount[]> {
  const userToken = await exchangeMetaCode({
    code,
    redirectUri,
    appId: requireEnv("META_APP_ID"),
    appSecret: requireEnv("META_APP_SECRET"),
  });
  const pages = await fetchMetaPages(userToken);

  if (pages.length === 0) {
    throw new OAuthError("No Facebook Pages were found for this account. Make sure you manage at least one Page.");
  }

  return pages.flatMap((page) => {
    const accounts: SaveAccount[] = [
      { provider: "facebook", externalId: page.id, displayName: page.name, token: page.accessToken, expiresAt: null },
    ];
    if (page.instagramAccountId) {
      accounts.push({
        provider: "instagram",
        externalId: page.instagramAccountId,
        displayName: page.instagramUsername ? `@${page.instagramUsername}` : `Instagram for ${page.name}`,
        token: page.accessToken,
        expiresAt: null,
      });
    }
    return accounts;
  });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new OAuthError(`${name} is not set on the server.`);
  }
  return value;
}
