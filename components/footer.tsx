import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return <footer className="border-t border-white/8 bg-[#02070d]">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
      <div><Logo /><p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">Secure AI infrastructure and software engineering for systems that need to work the first time — and keep working.</p></div>
      <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Explore</p><div className="mt-4 flex flex-col gap-3 text-sm text-slate-400"><Link href="/services">Services</Link><Link href="/#approach">Our Approach</Link><Link href="/about">About Eric</Link><Link href="/contact">Contact</Link></div></div>
      <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Engineering</p><p className="mt-4 text-sm leading-7 text-slate-500">Security / Software Engineer<br />Eric Brooks<br />SnowSeasonsTech</p></div>
    </div>
    <div className="border-t border-white/6"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© {new Date().getFullYear()} SnowSeasonsTech. All rights reserved.</span><span>Do it right the first time.</span></div></div>
  </footer>;
}
