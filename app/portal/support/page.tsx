import Link from "next/link";

const supportItems = [
  {
    title: "Response time",
    value: "Within 1 business day",
    text: "Fast follow-up for delivery questions, blockers, or priority adjustments.",
  },
  {
    title: "Contact",
    value: "eric@snowseasonstech.com",
    text: "Direct communication for change requests, issue escalation, or planning input.",
  },
  {
    title: "Next step",
    value: "Review checkpoint",
    text: "Align on timeline, change scope, and milestones before the next delivery window.",
  },
];

export default function PortalSupportPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Support</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Direct access to the team</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/portal" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
              Overview
            </Link>
            <Link href="/portal/milestones" className="text-sm font-medium text-slate-300 hover:text-white">
              Milestones
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {supportItems.map((item) => (
            <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-300/30 hover:bg-white/[0.05]">
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
