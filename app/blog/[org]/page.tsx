import type { Metadata } from "next";
import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/public";

type PublicPostRow = {
  org_name: string;
  title: string;
  slug: string;
  published_at: string | null;
};

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ org: string }> }): Promise<Metadata> {
  const { org } = await params;
  return { title: `Blog · ${org}` };
}

export default async function OrgBlogPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return <p className="text-slate-400">The blog is not configured yet.</p>;
  }

  const { data, error } = await supabase.rpc("public_blog_posts", { p_org_slug: org });
  if (error) {
    throw new Error(error.message);
  }

  const posts = (data ?? []) as PublicPostRow[];
  const orgName = posts[0]?.org_name ?? null;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">{orgName ?? "Blog"}</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Latest posts</h1>

      {posts.length === 0 ? (
        <p className="mt-8 text-slate-400">No published posts yet.</p>
      ) : (
        <ul className="mt-10 divide-y divide-white/10">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${org}/${post.slug}`} className="block py-6 transition hover:text-cyan-300">
                <h2 className="text-2xl font-semibold text-white">{post.title}</h2>
                {post.published_at ? (
                  <p className="mt-2 text-sm text-slate-500">{new Date(post.published_at).toLocaleDateString()}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
