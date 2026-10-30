import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Social Suite",
  robots: { index: false, follow: false },
};

// Everything under /suite depends on the visitor's session, so never prerender it.
export const dynamic = "force-dynamic";

export default async function SuiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-16 pt-28 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <Link href="/suite" className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Social Suite
            </Link>
            {user ? (
              <>
                <Link href="/suite/blog/new" className="text-sm font-medium text-slate-300 hover:text-white">
                  New blog post
                </Link>
                <Link href="/suite/blog/generate" className="text-sm font-medium text-slate-300 hover:text-white">
                  Generate draft
                </Link>
                <Link href="/suite/social" className="text-sm font-medium text-slate-300 hover:text-white">
                  Social
                </Link>
                <Link href="/suite/accounts" className="text-sm font-medium text-slate-300 hover:text-white">
                  Accounts
                </Link>
              </>
            ) : null}
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">{user.email}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  );
}
