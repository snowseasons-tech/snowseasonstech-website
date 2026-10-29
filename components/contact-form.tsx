"use client";

import { FormEvent, useState } from "react";

const initial = { name: "", email: "", company: "", service: "", message: "", website: "" };

export function ContactForm() {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("sending"); setError("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send your message.");
      setStatus("success"); setForm(initial);
    } catch (err) { setStatus("error"); setError(err instanceof Error ? err.message : "Unable to send your message."); }
  }

  const field = "w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10";
  return <form onSubmit={submit} className="space-y-5">
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm text-slate-300">Name<input required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`mt-2 ${field}`} placeholder="Your name" /></label>
      <label className="text-sm text-slate-300">Email<input required type="email" maxLength={200} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={`mt-2 ${field}`} placeholder="you@company.com" /></label>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm text-slate-300">Company <span className="text-slate-600">optional</span><input maxLength={120} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={`mt-2 ${field}`} placeholder="Company name" /></label>
      <label className="text-sm text-slate-300">What do you need?<select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} className={`mt-2 ${field}`}><option value="">Select a service</option><option>AI Infrastructure</option><option>Software Engineering</option><option>Security Engineering</option><option>DevOps & Automation</option><option>Data Engineering</option><option>Architecture & Consulting</option></select></label>
    </div>
    <label className="text-sm text-slate-300">Project details<textarea required minLength={20} maxLength={5000} rows={7} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={`mt-2 resize-y ${field}`} placeholder="Tell us what you're building, where it hurts today, and what success looks like." /></label>
    <input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="hidden" aria-hidden="true" />
    {status === "error" && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200">{error}</p>}
    {status === "success" && <p role="status" className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3 text-sm text-cyan-100">Message received. We&apos;ll get back to you shortly.</p>}
    <button disabled={status === "sending"} className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">{status === "sending" ? "Sending…" : "Send Project Brief"}</button>
    <p className="text-xs leading-5 text-slate-600">Your information is used only to respond to this inquiry. Never put passwords, API keys, or other secrets in this form.</p>
  </form>;
}
