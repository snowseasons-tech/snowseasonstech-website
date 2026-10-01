import Link from "next/link";

const milestones = [
  { title: "Discovery & scope", status: "Complete", percentage: "100%" },
  { title: "Design & architecture", status: "In progress", percentage: "72%" },
  { title: "Build & QA", status: "Pending", percentage: "18%" },
  { title: "Launch prep", status: "Pending", percentage: "0%" },
];

export default function PortalMilestonesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Milestones</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Project progression</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/portal" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
              Overview
            </Link>
            <Link href="/portal/support" className="text-sm font-medium text-slate-300 hover:text-white">
              Support
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="grid gap-4">
            {milestones.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{item.percentage} complete</p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    {item.status}
                  </span>
                </div>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: item.percentage }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
