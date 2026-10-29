import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { services, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Developer",
  description: `${site.person}, ${site.role} at ${site.name}.`,
};

export default function DeveloperPage() {
  return (
    <div className="pt-[74px]">
      <section className="border-b border-white/8 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Developer</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl">{site.person}</h1>
          <p className="mt-4 text-xl text-cyan-300">{site.role}</p>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">{site.description}</p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Focus areas</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">What I build</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div key={service.slug} className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
                <p className="font-mono text-xs text-cyan-300">{service.number}</p>
                <h3 className="mt-4 font-semibold text-white">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{service.short}</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-400">
                  {service.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-5 text-center">
          <h2 className="text-3xl font-bold text-white">Working on a system that needs to be built correctly?</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
              Talk to {site.person.split(" ")[0]} <ArrowIcon />
            </Link>
            <Link href="/about" className="inline-flex items-center justify-center rounded-xl border border-white/12 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/5">
              About SnowSeasonsTech
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
