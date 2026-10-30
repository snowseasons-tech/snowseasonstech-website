import Link from "next/link";
import { addMember, createOrganization } from "./actions";
import { getCurrentMembership } from "@/lib/suite/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { statusLabels, blogStatuses, type BlogStatus } from "@/lib/suite/types";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  updated_at: string;
};

export default async function SuitePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  const membership = await getCurrentMembership();

  if (!membership?.organizations) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-bold text-white">Set up your organization</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create the organization that owns your blog drafts and social accounts. You will be its owner.
        </p>

        <form action={createOrganization} className="mt-6 space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">
              Organization name
            </label>
            <input
              id="name"
              name="name"
              required
              minLength={2}
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
              pattern="[a-z0-9-]{3,40}"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="north-ridge"
            />
            <p className="mt-2 text-xs text-slate-500">Lowercase letters, numbers, and hyphens. Used in public blog URLs.</p>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Create organization
          </button>
        </form>
      </div>
    );
  }

  const org = membership.organizations;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id, title, slug, status, updated_at")
    .eq("org_id", org.id)
    .order("updated_at", { ascending: false });

  const posts = (data ?? []) as PostRow[];
  const counts = Object.fromEntries(blogStatuses.map((status) => [status, 0])) as Record<BlogStatus, number>;
  posts.forEach((post) => {
    counts[post.status] += 1;
  });

  const queue = posts.filter((post) => post.status === "in_review");

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">{org.name}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Review queue</h1>
        <p className="mt-2 text-sm text-slate-400">
          Your role: <span className="text-slate-200">{membership.role}</span>
        </p>
      </div>

      {error ? <p className="mb-6 text-sm text-red-400">{error}</p> : null}
      {notice ? <p className="mb-6 text-sm text-green-400">{notice}</p> : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {blogStatuses.map((status) => (
          <div key={status} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-400">{statusLabels[status]}</p>
            <p className="mt-2 text-2xl font-bold text-white">{counts[status]}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Waiting for approval</h2>
          <span className="text-sm text-slate-400">{queue.length} posts</span>
        </div>

        {queue.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing is waiting for review.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {queue.map((post) => (
              <li key={post.id}>
                <Link href={`/suite/blog/${post.id}`} className="flex items-center justify-between gap-4 py-4 hover:text-cyan-300">
                  <span className="font-medium text-white">{post.title}</span>
                  <span className="text-xs text-slate-500">{new Date(post.updated_at).toLocaleDateString()}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {membership.role === "owner" || membership.role === "admin" ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Add a team member</h2>
          <p className="mt-2 text-sm text-slate-400">
            The person needs an account first. Admins can approve and publish. Members can write and submit drafts.
          </p>
          <form action={addMember} className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
            <input type="hidden" name="org_id" value={org.id} />
            <div>
              <label htmlFor="member-email" className="mb-2 block text-sm font-medium text-slate-200">
                Email address
              </label>
              <input
                id="member-email"
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
              />
            </div>
            <div>
              <label htmlFor="member-role" className="mb-2 block text-sm font-medium text-slate-200">
                Role
              </label>
              <select
                id="member-role"
                name="role"
                defaultValue="member"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Add member
            </button>
          </form>
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">All posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-slate-400">
            No posts yet.{" "}
            <Link href="/suite/blog/new" className="text-cyan-300 hover:text-cyan-200">
              Write the first one.
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/suite/blog/${post.id}`} className="flex flex-col gap-2 py-4 hover:text-cyan-300 md:flex-row md:items-center md:justify-between">
                  <span className="font-medium text-white">{post.title}</span>
                  <span className="inline-flex w-fit items-center rounded-md bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
                    {statusLabels[post.status]}
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
