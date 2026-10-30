import Link from "next/link";
import { redirect } from "next/navigation";
import { createDraft } from "../../actions";
import { getCurrentMembership } from "@/lib/suite/data";

export default async function NewBlogPostPage({
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
      <h1 className="mt-6 text-4xl font-black tracking-tight text-white">New blog post</h1>
      <p className="mt-2 text-sm text-slate-400">Saved as a draft. Nothing is published until it is approved.</p>

      <form action={createDraft} className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <input type="hidden" name="org_id" value={membership.org_id} />

        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-200">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        <div>
          <label htmlFor="slug" className="mb-2 block text-sm font-medium text-slate-200">
            URL slug
          </label>
          <input
            id="slug"
            name="slug"
            maxLength={120}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
            placeholder="Created from the title if left blank"
          />
        </div>

        <div>
          <label htmlFor="body" className="mb-2 block text-sm font-medium text-slate-200">
            Body
          </label>
          <p className="mb-2 text-xs text-slate-500">Separate paragraphs with a blank line.</p>
          <textarea
            id="body"
            name="body"
            rows={18}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 leading-7 text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Save draft
        </button>
      </form>
    </div>
  );
}
