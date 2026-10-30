import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/suite/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PostRow = {
  id: string;
  body: string;
  status: string;
  updated_at: string;
  social_accounts: { display_name: string; provider: string } | null;
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  publishing: "Publishing",
  published: "Published",
  failed: "Failed",
};

export default async function SocialPostsPage() {
  const membership = await getCurrentMembership();

  if (!membership?.organizations) {
    redirect("/suite");
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("social_posts")
    .select("id, body, status, updated_at, social_accounts ( display_name, provider )")
    .eq("org_id", membership.org_id)
    .order("updated_at", { ascending: false });

  const posts = (data ?? []) as unknown as PostRow[];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">{membership.organizations.name}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Social posts</h1>
        </div>
        <Link
          href="/suite/social/new"
          className="rounded-xl bg-cyan-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          New social post
        </Link>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        {posts.length === 0 ? (
          <p className="text-sm text-slate-400">No social posts yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/suite/social/${post.id}`} className="flex flex-col gap-2 py-4 hover:text-cyan-300 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{post.body}</p>
                    <p className="text-xs text-slate-500">{post.social_accounts?.display_name ?? "Unknown account"}</p>
                  </div>
                  <span className="inline-flex w-fit shrink-0 items-center rounded-md bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
                    {statusLabels[post.status] ?? post.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
