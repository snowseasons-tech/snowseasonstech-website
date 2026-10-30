import Link from "next/link";
import { redirect } from "next/navigation";
import { generateBlogDraft } from "../../actions";
import { getCurrentMembership } from "@/lib/suite/data";
import { PendingSubmitButton } from "@/components/suite/pending-submit-button";

export default async function GenerateBlogDraftPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const membership = await getCurrentMembership();

  if (!membership?.organizations) {
    redirect("/suite");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/suite" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
        ← Back to review queue
      </Link>
      <h1 className="mt-6 text-4xl font-black tracking-tight text-white">Generate a draft</h1>
      <p className="mt-2 text-sm text-slate-400">
        The draft goes into the review queue as a draft. Nothing is published until someone approves it.
        Claims the writer cannot verify are marked [VERIFY], so check those before you submit.
      </p>

      <form action={generateBlogDraft} className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <input type="hidden" name="org_id" value={membership.org_id} />
        <input type="hidden" name="org_name" value={membership.organizations.name} />

        <div>
          <label htmlFor="topic" className="mb-2 block text-sm font-medium text-slate-200">
            Topic
          </label>
          <input
            id="topic"
            name="topic"
            required
            minLength={3}
            maxLength={300}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
            placeholder="How to prepare a storm-damaged roof for inspection"
          />
        </div>

        <div>
          <label htmlFor="key_points" className="mb-2 block text-sm font-medium text-slate-200">
            Key points <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <p className="mb-2 text-xs text-slate-500">
            Facts, angles, or things the post must mention. The writer uses only what you give it.
          </p>
          <textarea
            id="key_points"
            name="key_points"
            rows={6}
            maxLength={4000}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 leading-7 text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        <div>
          <label htmlFor="length" className="mb-2 block text-sm font-medium text-slate-200">
            Length
          </label>
          <select
            id="length"
            name="length"
            defaultValue="medium"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
          >
            <option value="short">Short (about 500 words)</option>
            <option value="medium">Medium (about 900 words)</option>
          </select>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <PendingSubmitButton idleLabel="Generate draft" pendingLabel="Writing draft, this can take a minute…" />
          <p className="text-xs text-slate-500">Each draft uses AI tokens on the company account.</p>
        </div>
      </form>
    </div>
  );
}
