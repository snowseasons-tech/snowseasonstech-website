import { graphApiVersion, linkedinApiVersion } from "./config";
import type { FetchLike } from "./oauth";

// Platform publishers. Each takes one connected account and one approved post,
// returns the platform's id for the new post, and throws SocialPublishError on
// failure. Messages never include the access token.

export type Provider = "linkedin" | "facebook" | "instagram";

export class SocialPublishError extends Error {}

export type PublishInput = {
  token: string;
  externalId: string;
  body: string;
  imageUrl: string | null;
};

export type PublishOptions = {
  fetchImpl?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
  statusPollAttempts?: number;
  statusPollDelayMs?: number;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function errorDetail(response: Response): Promise<string> {
  const json = (await response.json().catch(() => null)) as
    | { message?: string; error?: { message?: string } }
    | null;
  const message = json?.error?.message ?? json?.message ?? response.statusText ?? "";
  return message.slice(0, 300);
}

async function failIfNotOk(response: Response, platform: string) {
  if (response.ok) {
    return;
  }

  const detail = await errorDetail(response);
  if (response.status === 401 || response.status === 403) {
    throw new SocialPublishError(
      `${platform} rejected the connection (HTTP ${response.status}). Reconnect the account and try again.`,
    );
  }
  throw new SocialPublishError(`${platform} returned HTTP ${response.status}${detail ? `: ${detail}` : ""}.`);
}

// LinkedIn Posts API (text posts to the member's feed). Images are not sent in this version.
export async function publishToLinkedIn(input: PublishInput, options: PublishOptions = {}): Promise<string> {
  const fetchImpl = options.fetchImpl ?? fetch;

  const response = await fetchImpl("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.token}`,
      "content-type": "application/json",
      "linkedin-version": linkedinApiVersion,
      "x-restli-protocol-version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${input.externalId}`,
      commentary: input.body,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  await failIfNotOk(response, "LinkedIn");

  const postId = response.headers.get("x-restli-id");
  if (!postId) {
    throw new SocialPublishError("LinkedIn accepted the post but did not return its id.");
  }
  return postId;
}

// Facebook Page: text-only feed post, or a photo post when an image URL is given.
export async function publishToFacebookPage(input: PublishInput, options: PublishOptions = {}): Promise<string> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const path = input.imageUrl ? "photos" : "feed";
  const form = new URLSearchParams({ message: input.body });
  if (input.imageUrl) {
    form.set("url", input.imageUrl);
  }

  const response = await fetchImpl(`https://graph.facebook.com/${graphApiVersion}/${input.externalId}/${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${input.token}`, "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });

  await failIfNotOk(response, "Facebook");

  const json = (await response.json().catch(() => null)) as { id?: string; post_id?: string } | null;
  const postId = json?.post_id ?? json?.id;
  if (!postId) {
    throw new SocialPublishError("Facebook accepted the post but did not return its id.");
  }
  return postId;
}

// Instagram: create a media container from a public JPEG URL, wait until Meta
// reports it FINISHED, then publish it. Publishing before FINISHED fails.
export async function publishToInstagram(input: PublishInput, options: PublishOptions = {}): Promise<string> {
  if (!input.imageUrl) {
    throw new SocialPublishError("Instagram posts need an image URL.");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const attempts = options.statusPollAttempts ?? 6;
  const delayMs = options.statusPollDelayMs ?? 5000;
  const base = `https://graph.facebook.com/${graphApiVersion}/${input.externalId}`;
  const auth = { authorization: `Bearer ${input.token}` };

  const containerResponse = await fetchImpl(`${base}/media`, {
    method: "POST",
    headers: { ...auth, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ image_url: input.imageUrl, caption: input.body }),
  });
  await failIfNotOk(containerResponse, "Instagram");
  const container = (await containerResponse.json().catch(() => null)) as { id?: string } | null;
  if (!container?.id) {
    throw new SocialPublishError("Instagram did not create a media container.");
  }

  let ready = false;
  for (let attempt = 0; attempt < attempts && !ready; attempt += 1) {
    const statusResponse = await fetchImpl(
      `https://graph.facebook.com/${graphApiVersion}/${container.id}?fields=status_code`,
      { headers: auth },
    );
    await failIfNotOk(statusResponse, "Instagram");
    const status = ((await statusResponse.json().catch(() => null)) as { status_code?: string } | null)?.status_code;

    if (status === "FINISHED") {
      ready = true;
    } else if (status === "ERROR" || status === "EXPIRED") {
      throw new SocialPublishError(`Instagram could not process the image (status ${status}).`);
    } else if (attempt < attempts - 1) {
      await sleep(delayMs);
    }
  }
  if (!ready) {
    throw new SocialPublishError("Instagram is still processing the image. Try publishing again in a few minutes.");
  }

  const publishResponse = await fetchImpl(`${base}/media_publish`, {
    method: "POST",
    headers: { ...auth, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: container.id }),
  });
  await failIfNotOk(publishResponse, "Instagram");
  const published = (await publishResponse.json().catch(() => null)) as { id?: string } | null;
  if (!published?.id) {
    throw new SocialPublishError("Instagram accepted the post but did not return its id.");
  }
  return published.id;
}

export async function publishSocialPost(
  provider: Provider,
  input: PublishInput,
  options: PublishOptions = {},
): Promise<string> {
  switch (provider) {
    case "linkedin":
      return publishToLinkedIn(input, options);
    case "facebook":
      return publishToFacebookPage(input, options);
    case "instagram":
      return publishToInstagram(input, options);
  }
}
