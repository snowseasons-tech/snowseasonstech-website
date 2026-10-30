import Link from "next/link";
import { redirect } from "next/navigation";
import { disconnectSocialAccount } from "../actions";
import { getCurrentMembership } from "@/lib/suite/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AccountRow = {
  id: string;
  provider: "linkedin" | "facebook" | "instagram";
  external_id: string;
  display_name: string;
  token_expires_at: string | null;
};

const providerLabels: Record<AccountRow["provider"], string> = {
  linkedin: "LinkedIn profile",
  facebook: "Facebook Page",
  instagram: "Instagram",
};

// The page renders per request, so the clock is read at request time, not at build.
function isExpired(expiresAt: string | null): boolean {
  return expiresAt !== null && new Date(expiresAt).getTime() < Date.now();
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  const membership = await getCurrentMembership();

  if (!membership?.organizations) {
    redirect("/suite");
  }

  const isAdmin = membership.role === "owner" || membership.role === "admin";
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("social_accounts")
    .select("id, provider, external_id, display_name, token_expires_at")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: true });

  const accounts = (data ?? []) as AccountRow[];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">{membership.organizations.name}</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Social accounts</h1>
      <p className="mt-2 text-sm text-slate-400">
        Accounts you connect here are used to publish approved posts. Tokens are encrypted on the server.
      </p>

      {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
      {notice ? <p className="mt-6 text-sm text-green-400">{notice}</p> : null}

      {isAdmin ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Connect an account</h2>
          <p className="mt-2 text-sm text-slate-400">
            You sign in with the platform and choose what to allow. Connecting a Facebook Page also connects its Instagram account if one is linked.
          </p>
          {/* These start OAuth in route handlers that redirect off-site, so they must be plain links, not client navigations. */}
          <div className="mt-6 flex flex-wrap gap-3">
            {/* eslint-disable @next/next/no-html-link-for-pages */}
            <a
              href="/suite/connect/linkedin"
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Connect LinkedIn
            </a>
            <a
              href="/suite/connect/meta"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Connect Facebook and Instagram
            </a>
            {/* eslint-enable @next/next/no-html-link-for-pages */}
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Connected</h2>
        {accounts.length === 0 ? (
          <p className="text-sm text-slate-400">No accounts connected yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {accounts.map((account) => {
              const expired = isExpired(account.token_expires_at);
              return (
                <li key={account.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-white">{account.display_name}</p>
                    <p className="text-xs text-slate-500">
                      {providerLabels[account.provider]}
                      {expired ? <span className="ml-2 text-red-400">Expired: reconnect this account</span> : null}
                    </p>
                  </div>
                  {isAdmin ? (
                    <form action={disconnectSocialAccount}>
                      <input type="hidden" name="account_id" value={account.id} />
                      <button type="submit" className="text-sm text-slate-400 hover:text-red-400">
                        Disconnect
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-8 text-sm text-slate-500">
        Ready to post?{" "}
        <Link href="/suite/social/new" className="text-cyan-300 hover:text-cyan-200">
          Write a social post
        </Link>
        .
      </p>
    </div>
  );
}
