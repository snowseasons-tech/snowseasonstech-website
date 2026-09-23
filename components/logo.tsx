import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="SnowSeasonsTech home">
      <span className="relative grid size-10 place-items-center rounded-xl border border-cyan-400/40 bg-cyan-400/5 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
        <span className="absolute size-5 rotate-45 border border-cyan-300/80" />
        <span className="size-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-bold tracking-[0.18em] text-white">snow<span className="text-cyan-300">Seasons</span></span>
        <span className="mt-1 block text-[9px] font-medium tracking-[0.28em] text-slate-500">TECHNOLOGY / ENGINEERING</span>
      </span>
    </Link>
  );
}
