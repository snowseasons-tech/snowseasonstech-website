export function AnimatedGrid() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
    <div className="absolute left-1/2 top-[35%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/8 blur-[100px] animate-pulse" />
    <div className="scan-line absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
  </div>;
}
