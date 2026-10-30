import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabasePublicClient } from "@/lib/supabase/public";

type PublicPostRow = {
  org_name: string;
  title: string;
  slug: string;
  body: string;
  published_at: string | null;
};

export const revalidate = 300;

async function loadPost(org: string, slug: string) {
  const supabase = createSupabasePublicClient();
  if (!supabase) {
    return { post: null, configured: false };
  }

  const { data, error } = await supabase.rpc("public_blog_post", { p_org_slug: org, p_slug: slug });
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PublicPostRow[];
  return { post: rows[0] ?? null, configured: true };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ org: string; slug: string }>;
}): Promise<Metadata> {
  const { org, slug } = await params;
  const { post } = await loadPost(org, slug);
  return post ? { title: post.title, description: post.body.slice(0, 160) } : { title: "Post not found" };
}

export default async function PublicBlogPostPage({
  params,
}: {
  params: Promise<{ org: string; slug: string }>;
}) {
  const { org, slug } = await params;
  const { post, configured } = await loadPost(org, slug);

  if (!configured) {
    return <p className="text-slate-400">The blog is not configured yet.</p>;
  }
  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl">
      <Link href={`/blog/${org}`} className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
        ← All posts from {post.org_name}
      </Link>
      <h1 className="mt-6 text-4xl font-black tracking-tight text-white">{post.title}</h1>
      {post.published_at ? (
        <p className="mt-3 text-sm text-slate-500">{new Date(post.published_at).toLocaleDateString()}</p>
      ) : null}

      <div className="mt-10">
        {post.body.split(/\n\s*\n/).map((paragraph, index) => (
          <p key={index} className="mb-6 whitespace-pre-line text-lg leading-8 text-slate-200">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
