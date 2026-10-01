"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

type TimeLog = {
  hours_logged: number | string | null;
};

type Milestone = {
  id: string;
  title: string;
  status: string;
  sort_order: number;
  description?: string | null;
};

type ProjectRecord = {
  id: string;
  title: string;
  status: string;
  hourly_rate: number | string;
  estimated_hours_min: number | string;
  estimated_hours_max: number | string;
  milestones: Milestone[];
  time_logs: TimeLog[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function PortalClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [project, setProject] = useState<ProjectRecord | null>(null);

  const loadProjectData = async (userId: string) => {
    if (!supabase) {
      setProject(null);
      return;
    }

    const { data, error: projectError } = await supabase
      .from("projects")
      .select(
        `
          id,
          title,
          status,
          hourly_rate,
          estimated_hours_min,
          estimated_hours_max,
          milestones ( id, title, status, sort_order, description ),
          time_logs ( hours_logged )
        `,
      )
      .eq("client_id", userId)
      .maybeSingle();

    if (projectError) {
      setError(projectError.message);
      return;
    }

    setProject(data as ProjectRecord | null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!supabase) {
        setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to continue.");
        setIsLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsAuthenticated(true);
        await loadProjectData(session.user.id);
      }

      setIsLoading(false);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase
      ? supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session) {
            setIsAuthenticated(true);
            await loadProjectData(session.user.id);
          } else {
            setIsAuthenticated(false);
            setProject(null);
          }
        })
      : { data: { subscription: null } };

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

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

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setIsAuthenticated(true);
    if (data.user) {
      await loadProjectData(data.user.id);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      setIsAuthenticated(false);
      setProject(null);
      return;
    }

    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setProject(null);
    setEmail("");
    setPassword("");
  };

  const totalHours = project?.time_logs
    ? project.time_logs.reduce((sum, log) => sum + Number(log.hours_logged ?? 0), 0)
    : 0;
  const totalBilled = Number(project?.hourly_rate ?? 0) * totalHours;
  const sortedMilestones = [...(project?.milestones ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
          Loading portal...
        </div>
      </main>
    );
  }

  if (!supabase) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-400/30 bg-amber-500/10 p-8 text-amber-100">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Portal configuration required</p>
          <h1 className="mt-4 text-3xl font-bold">Supabase credentials are missing</h1>
          <p className="mt-3 text-sm text-amber-100/80">
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment to enable the real client auth/dashboard flow.
          </p>
        </div>
      </main>
    );
  }

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
                <h1 className="mt-3 text-3xl font-bold text-white">{project?.title ?? "Project framework not found."}</h1>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Sign Out
              </button>
            </div>

            {!project ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-slate-300">
                No matching project was found for the authenticated client.
              </div>
            ) : (
              <>
                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                    <p className="text-sm text-slate-400">Hours Logged</p>
                    <p className="mt-3 text-3xl font-bold text-white">{totalHours.toFixed(1)} hrs</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                    <p className="text-sm text-slate-400">Estimated Range</p>
                    <p className="mt-3 text-3xl font-bold text-white">
                      {Number(project.estimated_hours_min)} - {Number(project.estimated_hours_max)} hrs
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                    <p className="text-sm text-slate-400">Current Invoiced</p>
                    <p className="mt-3 text-3xl font-bold text-cyan-300">
                      ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-white">Milestone Progress</h2>
                    <span className="inline-flex items-center rounded-md bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
                      {project.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {sortedMilestones.map((milestone) => {
                      const statusClass =
                        milestone.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : milestone.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 animate-pulse"
                            : "bg-gray-100 text-gray-800";

                      return (
                        <div
                          key={milestone.id}
                          className={`flex items-center justify-between rounded-r border-l-4 bg-slate-950/50 p-4 ${
                            milestone.status === "completed" ? "border-green-500" : "border-gray-300"
                          }`}
                        >
                          <div>
                            <h3 className="font-medium text-gray-100">{milestone.title}</h3>
                            <p className="text-xs text-gray-400">{milestone.description ?? ""}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${statusClass}`}>
                            {milestone.status.replace("_", " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
