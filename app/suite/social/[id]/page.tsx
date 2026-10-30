import Link from "next/link";
import { notFound } from "next/navigation";
import { moveSocialPost, publishApprovedSocialPost, releaseStuckSocialPost, updateSocialPost } from "../../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PendingSubmitButton } from "@/components/suite/pending-submit-button";

type Role = "owner" | "admin" | "member";

type SocialPost = {
  id: string;
  org_id: string;
  body: string;
  image_url: string | null;
  status: string;
  error: string | null;
  platform_post_id: string | null;
  published_at: string | null;
  updated_at: string;
  social_accounts: { display_name: string; provider: string } | null;
};

// Matches the release rule in migration 20261030010000: a post counts as stuck after 10 minutes.
const stuckAfterMs = 10 * 60 * 1000;

function isStuck(updatedAt: string): boolean {
  return new Date(updatedAt).getTime() < Date.now() - stuckAfterMs;
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  publishing: "Publishing",
  published: "Published",
  failed: "Failed",
};

export default async function SocialPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, notice, saved } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("social_posts")
    .select("id, org_id, body, image_url, status, error, platform_post_id, published_at, updated_at, social_accounts ( display_name, provider )")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const post = data as unknown as SocialPost;
  const { data: roleData } = await supabase.rpc("current_org_role", { p_org_id: post.org_id });
  const role = (roleData as Role | null) ?? "member";
  const isAdmin = role === "owner" || role === "admin";
  const editable = post.status === "draft" || post.status === "failed";
  const account = post.social_accounts;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/suite/social" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
        ← Back to social posts
      </Link>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
            {account?.display_name ?? "Social post"}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Social post</h1>
        </div>
        <span className="inline-flex w-fit items-center rounded-md bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-300">
          {statusLabels[post.status] ?? post.status}
        </span>
      </div>

      {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
      {notice ? <p className="mt-6 text-sm text-green-400">{notice}</p> : null}
      {saved ? <p className="mt-6 text-sm text-green-400">Post saved.</p> : null}
      {post.status === "failed" && post.error ? (
        <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
          Last attempt failed: {post.error}
        </p>
      ) : null}
      {post.status === "published" ? (
        <p className="mt-6 text-sm text-slate-400">
          Published{post.published_at ? ` ${new Date(post.published_at).toLocaleString()}` : ""}
          {post.platform_post_id ? ` · platform id ${post.platform_post_id}` : ""}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {post.status === "draft" ? (
          <MoveButton postId={post.id} to="in_review" label="Submit for review" />
        ) : null}
        {post.status === "failed" ? <MoveButton postId={post.id} to="draft" label="Move back to draft" /> : null}
        {post.status === "in_review" && isAdmin ? (
          <>
            <MoveButton postId={post.id} to="approved" label="Approve" />
            <MoveButton postId={post.id} to="draft" label="Send back to draft" />
          </>
        ) : null}
        {post.status === "approved" && isAdmin ? (
          <form action={publishApprovedSocialPost}>
            <input type="hidden" name="post_id" value={post.id} />
            <PendingSubmitButton idleLabel="Publish now" pendingLabel="Publishing…" />
          </form>
        ) : null}
      </div>

      {post.status === "publishing" ? (
        <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-slate-300">
          {isStuck(post.updated_at) ? (
            <>
              <p>
                This post has been publishing for over 10 minutes. The connection may have dropped after the platform
                accepted it, so check the platform before doing anything else.
              </p>
              {isAdmin ? (
                <form action={releaseStuckSocialPost} className="mt-3">
                  <input type="hidden" name="post_id" value={post.id} />
                  <button
                    type="submit"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
                  >
                    Release post (marks it failed)
                  </button>
                </form>
              ) : null}
            </>
          ) : (
            <p>Publishing is in progress. If it does not finish within 10 minutes, an admin can release it.</p>
          )}
        </div>
      ) : null}

      {editable ? (
        <form action={updateSocialPost} className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <input type="hidden" name="post_id" value={post.id} />

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
              defaultValue={post.body}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 leading-7 text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          <div>
            <label htmlFor="image_url" className="mb-2 block text-sm font-medium text-slate-200">
              Image URL <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="image_url"
              name="image_url"
              type="url"
              defaultValue={post.image_url ?? ""}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          <PendingSubmitButton idleLabel="Save changes" pendingLabel="Saving…" />
        </form>
      ) : (
        <article className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="whitespace-pre-line leading-7 text-slate-200">{post.body}</p>
          {post.image_url ? (
            <p className="mt-4 break-all text-xs text-slate-500">Image: {post.image_url}</p>
          ) : null}
        </article>
      )}
    </div>
  );
}

function MoveButton({ postId, to, label }: { postId: string; to: string; label: string }) {
  return (
    <form action={moveSocialPost}>
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="to" value={to} />
      <button
        type="submit"
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
      >
        {label}
      </button>
    </form>
  );
}
