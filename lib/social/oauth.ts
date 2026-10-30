import { randomBytes } from "node:crypto";
import { graphApiVersion } from "./config";

// OAuth helpers for connecting LinkedIn and Meta (Facebook Pages and Instagram).
// Each function takes its fetch implementation so tests can stub the network.

export class OAuthError extends Error {}

export type FetchLike = typeof fetch;

export const linkedinScopes = ["openid", "profile", "w_member_social"];
export const metaScopes = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
];

// State binds the callback to this browser and this organization. The same value
// goes into an HTTP-only cookie and back on the redirect, and the callback rejects
// any mismatch.
export function createOAuthState(orgId: string): string {
  return `${randomBytes(24).toString("base64url")}.${orgId}`;
}

export function statesMatch(cookieValue: string | undefined, queryValue: string | null): boolean {
  if (!cookieValue || !queryValue) {
    return false;
  }
  return cookieValue === queryValue;
}

export function buildLinkedInAuthUrl(params: { clientId: string; redirectUri: string; state: string }): string {
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("scope", linkedinScopes.join(" "));
  return url.toString();
}

export function buildMetaAuthUrl(params: { appId: string; redirectUri: string; state: string }): string {
  const url = new URL(`https://www.facebook.com/${graphApiVersion}/dialog/oauth`);
  url.searchParams.set("client_id", params.appId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", metaScopes.join(","));
  return url.toString();
}

async function readJson(response: Response) {
  const body = await response.json().catch(() => null);
  return body as Record<string, unknown> | null;
}

// LinkedIn returns the token and its lifetime (about 60 days).
export async function exchangeLinkedInCode(
  params: { code: string; redirectUri: string; clientId: string; clientSecret: string },
  fetchImpl: FetchLike = fetch,
): Promise<{ accessToken: string; expiresAt: Date | null }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });

  const response = await fetchImpl("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await readJson(response);
  if (!response.ok || typeof json?.access_token !== "string") {
    throw new OAuthError(`LinkedIn did not issue a token (HTTP ${response.status}).`);
  }

  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : null;
  return {
    accessToken: json.access_token,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
  };
}

// The OpenID userinfo endpoint returns the member id (sub) and display name.
export async function fetchLinkedInIdentity(
  accessToken: string,
  fetchImpl: FetchLike = fetch,
): Promise<{ memberId: string; name: string }> {
  const response = await fetchImpl("https://api.linkedin.com/v2/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const json = await readJson(response);
  if (!response.ok || typeof json?.sub !== "string") {
    throw new OAuthError(`LinkedIn profile lookup failed (HTTP ${response.status}).`);
  }

  const name = typeof json.name === "string" && json.name.trim() ? json.name.trim() : "LinkedIn member";
  return { memberId: json.sub, name };
}

// Exchanges the code for a short-lived user token, then for a long-lived one.
export async function exchangeMetaCode(
  params: { code: string; redirectUri: string; appId: string; appSecret: string },
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const shortUrl = new URL(`https://graph.facebook.com/${graphApiVersion}/oauth/access_token`);
  shortUrl.searchParams.set("client_id", params.appId);
  shortUrl.searchParams.set("client_secret", params.appSecret);
  shortUrl.searchParams.set("redirect_uri", params.redirectUri);
  shortUrl.searchParams.set("code", params.code);

  const shortResponse = await fetchImpl(shortUrl);
  const shortJson = await readJson(shortResponse);
  if (!shortResponse.ok || typeof shortJson?.access_token !== "string") {
    throw new OAuthError(`Meta did not issue a token (HTTP ${shortResponse.status}).`);
  }

  const longUrl = new URL(`https://graph.facebook.com/${graphApiVersion}/oauth/access_token`);
  longUrl.searchParams.set("grant_type", "fb_exchange_token");
  longUrl.searchParams.set("client_id", params.appId);
  longUrl.searchParams.set("client_secret", params.appSecret);
  longUrl.searchParams.set("fb_exchange_token", shortJson.access_token);

  const longResponse = await fetchImpl(longUrl);
  const longJson = await readJson(longResponse);
  if (!longResponse.ok || typeof longJson?.access_token !== "string") {
    throw new OAuthError(`Meta did not issue a long-lived token (HTTP ${longResponse.status}).`);
  }
  return longJson.access_token;
}

export type MetaPage = {
  id: string;
  name: string;
  accessToken: string;
  instagramAccountId: string | null;
  instagramUsername: string | null;
};

// Lists the Pages the user manages, each with its own page token, and any linked Instagram account.
export async function fetchMetaPages(userToken: string, fetchImpl: FetchLike = fetch): Promise<MetaPage[]> {
  const url = new URL(`https://graph.facebook.com/${graphApiVersion}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username}");

  // Send the token in a header so it stays out of URLs and access logs.
  const response = await fetchImpl(url, { headers: { authorization: `Bearer ${userToken}` } });
  const json = await readJson(response);
  if (!response.ok || !Array.isArray(json?.data)) {
    throw new OAuthError(`Could not list Facebook Pages (HTTP ${response.status}).`);
  }

  return (json.data as Array<Record<string, unknown>>).map((page) => {
    const ig = page.instagram_business_account as { id?: string; username?: string } | undefined;
    return {
      id: String(page.id),
      name: String(page.name ?? "Facebook Page"),
      accessToken: String(page.access_token),
      instagramAccountId: ig?.id ?? null,
      instagramUsername: ig?.username ?? null,
    };
  });
}
