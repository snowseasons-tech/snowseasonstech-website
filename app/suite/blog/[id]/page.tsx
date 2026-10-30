import Link from "next/link";
import { notFound } from "next/navigation";
import { moveBlogPost, saveDraft } from "../../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { statusLabels, type BlogPost, type BlogStatus } from "@/lib/suite/types";

type Role = "owner" | "admin" | "member";

type Transition = {
  to: BlogStatus;
  label: string;
  adminOnly: boolean;
};

// Which moves a post can make from each status. The database enforces the same rules.
const transitionsFrom: Record<BlogStatus, Transition[]> = {
  draft: [{ to: "in_review", label: "Submit for review", adminOnly: false }],
  rejected: [{ to: "in_review", label: "Resubmit for review", adminOnly: false }],
  in_review: [
    { to: "approved", label: "Approve", adminOnly: true },
    { to: "rejected", label: "Reject", adminOnly: true },
  ],
  approved: [{ to: "published", label: "Publish", adminOnly: true }],
  published: [{ to: "draft", label: "Unpublish to draft", adminOnly: true }],
};

export default async function BlogPostEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*, organizations ( slug )")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const post = data as BlogPost & { organizations: { slug: string } | null };

  // RLS already limits this to members. The role decides which buttons appear.
  const { data: roleData } = await supabase.rpc("current_org_role", { p_org_id: post.org_id });
  const role = (roleData as Role | null) ?? "member";
  const isAdmin = role === "owner" || role === "admin";
  const editable = post.status === "draft" || post.status === "rejected";
  const available = transitionsFrom[post.status].filter((t) => isAdmin || !t.adminOnly);
  const publicUrl = post.status === "published" && post.organizations
    ? `/blog/${post.organizations.slug}/${post.slug}`
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/suite" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
        ← Back to review queue
      </Link>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Blog post</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">{post.title}</h1>
        </div>
        <span className="inline-flex w-fit items-center rounded-md bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-300">
          {statusLabels[post.status]}
        </span>
      </div>

      {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
      {saved ? <p className="mt-6 text-sm text-green-400">Draft saved.</p> : null}

      {post.source === "ai" ? (
        <p className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-slate-300">
          AI draft{post.ai_model ? ` from ${post.ai_model}` : ""}. Check every claim, and resolve any [VERIFY] markers
          before you submit it for review.
        </p>
      ) : null}

      {publicUrl ? (
        <p className="mt-6 text-sm text-slate-400">
          Live at{" "}
          <Link href={publicUrl} className="text-cyan-300 hover:text-cyan-200">
            {publicUrl}
          </Link>
        </p>
      ) : null}

      {available.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {available.map((transition) => (
            <form key={transition.to} action={moveBlogPost}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="to" value={transition.to} />
              <button
                type="submit"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                {transition.label}
              </button>
            </form>
          ))}
        </div>
      ) : null}

      {editable ? (
        <form action={saveDraft} className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <input type="hidden" name="post_id" value={post.id} />

          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-200">
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              maxLength={200}
              defaultValue={post.title}
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
              required
              maxLength={120}
              defaultValue={post.slug}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          <div>
            <label htmlFor="body" className="mb-2 block text-sm font-medium text-slate-200">
              Body
            </label>
            <textarea
              id="body"
              name="body"
              rows={18}
              defaultValue={post.body}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 leading-7 text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Save draft
          </button>
        </form>
      ) : (
        <article className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          {post.body.split(/\n\s*\n/).map((paragraph, index) => (
            <p key={index} className="mb-4 whitespace-pre-line leading-7 text-slate-200 last:mb-0">
              {paragraph}
            </p>
          ))}
        </article>
      )}
    </div>
  );
}
