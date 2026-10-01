"use client";

import { useState } from "react";

export function PortalClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError("");
    setIsAuthenticated(true);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-5xl">
        {!isAuthenticated ? (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Client Portal</p>
            <h1 className="mt-4 text-3xl font-bold text-white">Secure Login</h1>
            <p className="mt-2 text-sm text-slate-400">Access your project dashboard and status updates.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none transition focus:border-cyan-400"
                  placeholder="Enter your password"
                />
              </div>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Sign In
              </button>
            </form>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20">
            <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Project Portal</p>
                <h1 className="mt-3 text-3xl font-bold text-white">North Ridge Build</h1>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthenticated(false)}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Sign Out
              </button>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-sm text-slate-400">Hours Logged</p>
                <p className="mt-3 text-3xl font-bold text-white">42.5</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-sm text-slate-400">Estimated Range</p>
                <p className="mt-3 text-3xl font-bold text-white">40 - 52 hrs</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <p className="text-sm text-slate-400">Current Invoiced</p>
                <p className="mt-3 text-3xl font-bold text-cyan-300">$3,420.00</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <h2 className="text-xl font-semibold text-white">Milestone Progress</h2>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Discovery & scope", status: "Complete", percent: "100%" },
                  { label: "Design & architecture", status: "In progress", percent: "72%" },
                  { label: "Build & QA", status: "Pending", percent: "18%" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-200">{item.label}</span>
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-300">
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: item.percent }}
                      />
                    </div>
                    <p className="mt-2 text-right text-xs text-slate-400">{item.percent}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
