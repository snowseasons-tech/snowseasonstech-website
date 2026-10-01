import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Client Portal",
  description: "Secure client portal and project status dashboard.",
};

const metrics = [
  { label: "Hours logged", value: "42.5 hrs" },
  { label: "Budget used", value: "$3,420" },
  { label: "Milestones", value: "3 / 5" },
];

const highlights = [
  {
    title: "Status",
    value: "In progress",
    text: "The build is active and moving through architecture, implementation, and QA refinement.",
  },
  {
    title: "Next review",
    value: "Oct 4",
    text: "Planned checkpoint for design signoff, rollout readiness, and alignment on next steps.",
  },
  {
    title: "Delivery lead",
    value: "Eric Brooks",
    text: "Technical lead overseeing architecture, delivery, and the client experience throughout the project.",
  },
];

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_25%),linear-gradient(135deg,#0f172a_0%,#020817_45%,#06131d_100%)] p-8 shadow-[0_0_90px_rgba(34,211,238,0.14)] md:p-12">
          <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Client portal</p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white md:text-6xl">
                North Ridge Build
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                A clear, high-trust view of delivery status, priorities, and the work in motion.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/portal/milestones"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                View milestones
              </Link>
              <Link
                href="/portal/support"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10"
              >
                Support
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {metrics.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-300/30 hover:bg-white/[0.05]">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">{item.title}</p>
              <h2 className="mt-4 text-2xl font-bold text-white">{item.value}</h2>
              <p className="mt-3 text-slate-400">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
