import Image from "next/image";
import Link from "next/link";
import { AnimatedGrid } from "@/components/animated-grid";
import { ArrowIcon, ShieldIcon, CpuIcon, TerminalIcon, DatabaseIcon } from "@/components/icons";
import { ServiceCard } from "@/components/service-card";
import { services } from "@/lib/site";

export default function Home() { 
  return (
    <>
      <section className="relative min-h-[760px] overflow-hidden border-b border-white/8 pt-[74px]">
        <AnimatedGrid />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_40%,rgba(14,165,233,.14),transparent_30%),linear-gradient(90deg,#030912_0%,rgba(3,9,18,.94)_40%,rgba(3,9,18,.3)_100%)]" />
        <div className="mx-auto grid min-h-[686px] max-w-7xl items-center gap-10 px-5 py-20 lg:grid-cols-[1.02fr_.98fr] lg:px-8">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300">
              <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" /> AI Infrastructure / Software / Security
            </div>
            <h1 className="max-w-4xl text-5xl font-black tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Build smarter.<br />Scale faster.<br /><span className="text-cyan-300">Do it right the first time.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
              SnowSeasonsTech builds secure infrastructure and software systems with engineering discipline from day one. Fewer patches. Fewer surprises. Better systems.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
                Start Your Project <ArrowIcon />
              </Link>
              <Link href="/services" className="inline-flex items-center justify-center rounded-xl border border-white/12 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/5">
                Explore Services
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-xs font-mono uppercase tracking-widest text-slate-600">
              <span>SECURITY-FIRST</span><span>TESTABLE</span><span>OBSERVABLE</span><span>MAINTAINABLE</span>
            </div>
          </div>
          
          <div className="relative hidden h-[500px] lg:block">
            <div className="absolute inset-10 rounded-full bg-cyan-500/10 blur-[90px]" />
            <div className="relative h-full overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#06111c] shadow-[0_0_80px_rgba(14,165,233,.12)]">
              <Image src="/hero-concept.png" alt="Abstract blue-lit server infrastructure" fill priority className="object-cover object-right opacity-65 mix-blend-screen" sizes="(max-width: 1024px) 0px, 50vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030912] via-transparent to-[#030912]/20" />
              <div className="absolute left-5 top-5 rounded-lg border border-cyan-300/15 bg-black/40 px-3 py-2 font-mono text-[10px] text-cyan-200 backdrop-blur">SYSTEM / ONLINE</div>
              <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-2">
                {["UPTIME","SECURITY","OBSERVABILITY"].map((x,i)=>(
                  <div key={x} className="rounded-xl border border-white/10 bg-black/45 p-3 backdrop-blur">
                    <div className="text-[9px] uppercase tracking-widest text-slate-500">{x}</div>
                    <div className="mt-1 font-mono text-xs text-cyan-200">{i===0?"99.99%":i===1?"ENFORCED":"LIVE"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/8 py-24" id="services">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">What we build</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">End-to-end engineering for systems that matter.</h2>
            </div>
            <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">All services <ArrowIcon size={16}/></Link>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service,i)=><ServiceCard key={service.slug} service={service} index={i}/>)}
          </div>
        </div>
      </section>

      <section id="approach" className="relative overflow-hidden border-b border-white/8 py-24">
        <AnimatedGrid/>
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">The snowSeasons standard</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Do it right.<br/><span className="text-cyan-300">The first time.</span></h2>
              <p className="mt-6 max-w-lg leading-8 text-slate-400">Good engineering is not about making something complicated. It is about making the right decisions early, documenting them, testing the assumptions, and leaving a system the next engineer can understand.</p>
              <Link href="/about" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-300/5">Meet Eric Brooks <ArrowIcon size={16}/></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Value icon={<ShieldIcon/>} title="Security by design" text="Threats and trust boundaries are architecture concerns, not a last-minute checklist."/>
              <Value icon={<CpuIcon/>} title="Engineering discipline" text="Clear interfaces, tests, observability, and documentation keep systems understandable."/>
              <Value icon={<TerminalIcon/>} title="Automation first" text="If a reliable process can be automated, it should not depend on someone remembering a runbook."/>
              <Value icon={<DatabaseIcon/>} title="Operational reality" text="Architecture has to survive production, incidents, maintenance, growth, and the next change."/>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/8 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">How we work</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">From unknowns to infrastructure.</h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-5">
            {[["01","Discover","Understand goals, constraints, risks, and the existing system."],["02","Design","Choose architecture and technology deliberately."],["03","Build","Implement, test, document, and review."],["04","Deploy","Ship with observability, rollback paths, and confidence."],["05","Improve","Measure, harden, automate, and evolve."]].map(([n,t,d])=>(
              <div key={n} className="relative text-center md:text-left">
                <div className="mx-auto grid size-12 place-items-center rounded-full border border-cyan-300/35 bg-cyan-300/5 font-mono text-xs text-cyan-300 md:mx-0">{n}</div>
                <h3 className="mt-5 font-semibold text-white">{t}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.13),transparent_45%)]"/>
        <div className="relative mx-auto max-w-5xl px-5 py-28 text-center lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Ready when you are</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">Your system deserves<br/><span className="text-cyan-300">a solid foundation.</span></h2>
          <p className="mx-auto mt-6 max-w-2xl text-slate-400">Tell us what you are building. We will help identify the architecture, security, and engineering work required to build it correctly.</p>
          <Link href="/contact" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-7 py-4 text-sm font-bold text-slate-950 hover:bg-cyan-300">Start a Conversation <ArrowIcon/></Link>
        </div>
      </section>
    </>
  );
}

function Value({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
      <div className="text-cyan-300">{icon}</div>
      <h3 className="mt-5 font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
