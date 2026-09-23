import Link from "next/link";
import { ArrowIcon, CodeIcon, CloudIcon, CpuIcon, DatabaseIcon, ShieldIcon, TerminalIcon } from "./icons";

const icons = [CloudIcon, CodeIcon, ShieldIcon, TerminalIcon, DatabaseIcon, CpuIcon];

export function ServiceCard({ service, index }: { service: { slug: string; number: string; title: string; short: string }; index: number }) {
  const Icon = icons[index % icons.length];
  return <Link href={`/services/${service.slug}`} className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-cyan-300/[0.035]">
    <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl transition group-hover:bg-cyan-400/20" />
    <div className="flex items-start justify-between"><span className="text-xs font-mono text-slate-600">{service.number}</span><span className="text-cyan-300"><Icon size={28} /></span></div>
    <h3 className="mt-10 text-xl font-semibold text-white">{service.title}</h3>
    <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{service.short}</p>
    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">Explore <ArrowIcon size={15} /></span>
  </Link>;
}
