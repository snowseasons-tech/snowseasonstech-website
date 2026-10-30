import Link from "next/link";
import { redirect } from "next/navigation";
import { createSocialPost } from "../../actions";
import { getCurrentMembership } from "@/lib/suite/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PendingSubmitButton } from "@/components/suite/pending-submit-button";

type AccountOption = { id: string; provider: string; display_name: string };

const providerLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook Page",
  instagram: "Instagram",
};

export default async function NewSocialPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const membership = await getCurrentMembership();

  if (!membership?.organizations) {
    redirect("/suite");
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("social_accounts")
    .select("id, provider, display_name")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: true });
  const accounts = (data ?? []) as AccountOption[];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/suite/social" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
        ← Back to social posts
      </Link>
      <h1 className="mt-6 text-4xl font-black tracking-tight text-white">New social post</h1>
      <p className="mt-2 text-sm text-slate-400">Saved as a draft. It publishes only after an admin approves it.</p>

      {accounts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-300">Connect an account before writing a post.</p>
          <Link href="/suite/accounts" className="mt-4 inline-block text-sm text-cyan-300 hover:text-cyan-200">
            Go to social accounts
          </Link>
        </div>
      ) : (
        <form action={createSocialPost} className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <input type="hidden" name="org_id" value={membership.org_id} />

          <div>
            <label htmlFor="account_id" className="mb-2 block text-sm font-medium text-slate-200">
              Post to
            </label>
            <select
              id="account_id"
              name="account_id"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.display_name} ({providerLabels[account.provider] ?? account.provider})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="body" className="mb-2 block text-sm font-medium text-slate-200">
              Post text
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={8}
              maxLength={3000}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 leading-7 text-white outline-none transition focus:border-cyan-400"
            />
            <p className="mt-2 text-xs text-slate-500">Up to 3000 characters.</p>
          </div>

          <div>
            <label htmlFor="image_url" className="mb-2 block text-sm font-medium text-slate-200">
              Image URL <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="image_url"
              name="image_url"
              type="url"
              placeholder="https://example.com/photo.jpg"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
            />
            <p className="mt-2 text-xs text-slate-500">
              Required for Instagram: a public HTTPS JPEG. Used for Facebook photo posts. LinkedIn posts are text-only.
            </p>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <PendingSubmitButton idleLabel="Save draft" pendingLabel="Saving…" />
        </form>
      )}
    </div>
  );
}
