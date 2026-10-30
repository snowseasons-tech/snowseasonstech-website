// Pinned platform API versions. Check these against the providers' changelogs
// when you upgrade. LinkedIn sunsets each version about a year after release,
// and Graph API versions also retire on a published schedule.
export const linkedinApiVersion = "202610";
export const graphApiVersion = "v26.0";

// Public origin of the suite, used to build OAuth redirect URIs. Must match the
// redirect URIs registered in the LinkedIn and Meta developer apps.
export function suiteAppUrl(): string {
  const url = process.env.SOCIAL_APP_URL;
  if (!url) {
    throw new Error("SOCIAL_APP_URL is not set. Use the public https origin of this site.");
  }
  return url.replace(/\/$/, "");
}
