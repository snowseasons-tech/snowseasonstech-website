import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentMembership } from "@/lib/suite/data";
import { suiteAppUrl } from "@/lib/social/config";
import { buildLinkedInAuthUrl, buildMetaAuthUrl, createOAuthState } from "@/lib/social/oauth";

const stateCookieMaxAge = 600;

// Starts the OAuth flow for a platform. Only owners and admins may connect accounts.
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const membership = await getCurrentMembership();

  if (!membership?.organizations) {
    return NextResponse.redirect(new URL("/suite", request.url));
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    return NextResponse.redirect(
      new URL(`/suite/accounts?error=${encodeURIComponent("Only owners and admins can connect accounts.")}`, request.url),
    );
  }

  let authUrl: string;
  try {
    const state = createOAuthState(membership.org_id);
    const redirectUri = `${suiteAppUrl()}/suite/connect/${provider}/callback`;

    if (provider === "linkedin") {
      authUrl = buildLinkedInAuthUrl({
        clientId: requireEnv("LINKEDIN_CLIENT_ID"),
        redirectUri,
        state,
      });
    } else if (provider === "meta") {
      authUrl = buildMetaAuthUrl({
        appId: requireEnv("META_APP_ID"),
        redirectUri,
        state,
      });
    } else {
      return new NextResponse("Unknown provider", { status: 404 });
    }

    (await cookies()).set(`social_oauth_${provider}`, state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/suite/connect",
      maxAge: stateCookieMaxAge,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection is not configured.";
    return NextResponse.redirect(new URL(`/suite/accounts?error=${encodeURIComponent(message)}`, request.url));
  }

  return NextResponse.redirect(authUrl);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set on the server.`);
  }
  return value;
}
