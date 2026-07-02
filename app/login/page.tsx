"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
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
    <div style={{ minHeight: "100vh", background: "#faf9f7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>

      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 32 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart3 size={18} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.02em" }}>Acquisition Exchange</span>
      </Link>

      {/* Card */}
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4, letterSpacing: "-0.02em" }}>Welcome back</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>Sign in to your Acquisition Exchange workspace</p>

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

        {/* Admin access is via a separate internal route — not public */}

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 24 }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Sign up free</Link>
        </p>
      </div>

      <p style={{ fontSize: 12, color: "#a8a29e", marginTop: 24, textAlign: "center", maxWidth: 320 }}>
        By signing in you agree to our{" "}
        <Link href="/terms" style={{ color: "var(--muted)", textDecoration: "underline" }}>Terms of Service</Link> and{" "}
        <Link href="/privacy" style={{ color: "var(--muted)", textDecoration: "underline" }}>Privacy Policy</Link>.
      </p>
    </div>
  );
}
