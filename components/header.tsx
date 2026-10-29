"use client";

import Link from "next/link";
import { useState } from "react";
import { MenuIcon, XIcon } from "./icons";
import { Logo } from "./logo";

const links = [
  ["Services", "/services"],
  ["Approach", "/#approach"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/7 bg-[#030912]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map(([label, href]) => <Link key={href} href={href} className="text-sm text-slate-300 transition hover:text-cyan-300">{label}</Link>)}
          <Link href="/contact" className="rounded-full border border-cyan-400/60 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-400 hover:text-slate-950">Start a Project</Link>
        </nav>
        <button aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-lg border border-white/10 p-2 text-slate-200 md:hidden">
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </div>
      {open && <nav className="border-t border-white/7 bg-[#030912] px-5 py-5 md:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          {links.map(([label, href]) => <Link onClick={() => setOpen(false)} key={href} href={href} className="py-2 text-base text-slate-200">{label}</Link>)}
          <Link onClick={() => setOpen(false)} href="/contact" className="mt-2 rounded-xl bg-cyan-400 px-5 py-3 text-center font-semibold text-slate-950">Start a Project</Link>
        </div>
      </nav>}
    </header>
  );
}
