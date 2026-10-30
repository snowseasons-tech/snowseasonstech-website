import type { Metadata } from "next";
import { signIn } from "../actions";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SuiteLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Social Suite</p>
      <h1 className="mt-4 text-3xl font-bold text-white">Sign in</h1>
      <p className="mt-2 text-sm text-slate-400">Access your review queue and blog drafts.</p>

      <form action={signIn} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
