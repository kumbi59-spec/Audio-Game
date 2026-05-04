"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export default function ContactUsPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ email: "", topic: "bug", message: "" });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Contact us</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Report bugs, ask for help, or send suggestions to improve EchoQuest.
        </p>

        <form
          className="mt-6 rounded-xl border p-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
        >
          <label className="block text-sm" style={{ color: "var(--text)" }}>Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }} />

          <label className="mt-3 block text-sm" style={{ color: "var(--text)" }}>Topic</label>
          <select value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
            <option value="bug">Bug report</option>
            <option value="problem">Having a problem</option>
            <option value="suggestion">Suggestion</option>
          </select>

          <label className="mt-3 block text-sm" style={{ color: "var(--text)" }}>Message</label>
          <textarea required value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className="mt-1 w-full rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", minHeight: 120 }} />

          <button type="submit" className="mt-3 rounded px-3 py-2 text-sm font-semibold" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>Send</button>
          {sent && <p className="mt-2 text-sm text-emerald-400">Thanks — we received your message.</p>}
        </form>
      </main>
    </div>
  );
}
