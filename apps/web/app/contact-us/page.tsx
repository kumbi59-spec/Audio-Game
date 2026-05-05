"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-10" id="main-content">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Contact Us</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Report bugs, technical problems, or suggestions to improve EchoQuest.
        </p>
        <form
          className="mt-6 rounded-xl border p-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <label className="text-sm">Issue Type</label>
          <select className="mt-1 w-full rounded border px-3 py-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
            <option>Bug report</option><option>Having a problem</option><option>Suggestion</option>
          </select>
          <label className="mt-3 block text-sm">Message</label>
          <textarea required rows={5} className="mt-1 w-full rounded border px-3 py-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }} />
          <button className="mt-3 rounded px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }} type="submit">Send</button>
          {submitted && <p className="mt-3 text-sm text-green-400">Thanks — we received your message.</p>}
        </form>
      </main>
    </div>
  );
}
