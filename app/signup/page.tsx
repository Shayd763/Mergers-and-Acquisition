"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";

const PLAN_LABELS: Record<string, { name: string; price: string }> = {
  searcher:    { name: "Active Searcher", price: "£49/mo" },
  broker:      { name: "Deal Broker",     price: "£149/mo" },
  institutional: { name: "Institutional", price: "Custom" },
};

function SignupForm() {
  const params = useSearchParams();
  const planKey = params.get("plan") ?? "";
  const plan = PLAN_LABELS[planKey] ?? null;
  const [loading, setLoading] = useState<"google" | "linkedin" | null>(null);

  const handleGoogle = async () => {
    setLoading("google");
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleLinkedIn = async () => {
    setLoading("linkedin");
    await signIn("linkedin", { callbackUrl: "/dashboard" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>

      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 32 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 17 }}>T</div>
        <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.02em" }}>Triage Finance</span>
      </Link>

      {/* Card */}
      <div className="card" style={{ width: "100%", maxWidth: 440, padding: 32 }}>
        {plan ? (
          <div style={{ marginBottom: 6, padding: "8px 14px", borderRadius: 10, background: "#f0f4ff", border: "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#4f46e5", fontWeight: 600 }}>Plan: {plan.name}</span>
            <span style={{ fontSize: 13, color: "#4f46e5", fontWeight: 800 }}>{plan.price}</span>
          </div>
        ) : (
          <div style={{ marginBottom: 6 }}>
            <span className="badge badge-success">Free during beta</span>
          </div>
        )}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4, marginTop: 12, letterSpacing: "-0.02em" }}>Create your account</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>
          {plan ? `Get started with ${plan.name} — no payment required until you're ready.` : "Start triaging UK SME deals in seconds. No credit card required."}
        </p>

        {/* OAuth */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          <button
            onClick={handleGoogle}
            disabled={loading !== null}
            className="btn-secondary"
            style={{ width: "100%", justifyContent: "center", padding: "10px 16px", opacity: loading && loading !== "google" ? 0.5 : 1 }}
          >
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-light)", border: "1px solid var(--accent-mid)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
              {loading === "google" ? "…" : "G"}
            </span>
            {loading === "google" ? "Connecting…" : "Continue with Google"}
          </button>
          <button
            onClick={handleLinkedIn}
            disabled={loading !== null}
            className="btn-secondary"
            style={{ width: "100%", justifyContent: "center", padding: "10px 16px", opacity: loading && loading !== "linkedin" ? 0.5 : 1 }}
          >
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-light)", border: "1px solid var(--accent-mid)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
              {loading === "linkedin" ? "…" : "in"}
            </span>
            {loading === "linkedin" ? "Connecting…" : "Continue with LinkedIn"}
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <hr className="divider" style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>or register with email</span>
          <hr className="divider" style={{ flex: 1 }} />
        </div>

        {/* Form */}
        <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-soft)" }}>First name</span>
              <input type="text" placeholder="James" className="input" />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-soft)" }}>Last name</span>
              <input type="text" placeholder="Smith" className="input" />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-soft)" }}>Work email</span>
            <input type="email" placeholder="james@searchfund.co.uk" className="input" />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-soft)" }}>Password</span>
            <input type="password" placeholder="8+ characters" className="input" />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-soft)" }}>Your role</span>
            <select className="input" style={{ cursor: "pointer" }}>
              <option value="">Select your role…</option>
              <option>ETA Buyer / Searcher</option>
              <option>Search Fund Principal</option>
              <option>Corporate Finance Advisor</option>
              <option>Business Broker</option>
              <option>Private Equity</option>
              <option>Other</option>
            </select>
          </label>

          <Link href="/dashboard" className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: 14, marginTop: 4 }}>
            Create free account →
          </Link>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 24 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
