"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState<"google" | "linkedin" | "credentials" | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setLoading("google");
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleLinkedIn = async () => {
    setLoading("linkedin");
    await signIn("linkedin", { callbackUrl: "/dashboard" });
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading("credentials");
    const result = await signIn("credentials", {
      username,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid username or password.");
      setLoading(null);
    } else if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>

      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 32 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart3 size={18} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.02em" }}>Triage Finance</span>
      </Link>

      {/* Card */}
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4, letterSpacing: "-0.02em" }}>Welcome back</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>Sign in to your Triage Finance workspace</p>

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
          <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>or sign in with username</span>
          <hr className="divider" style={{ flex: 1 }} />
        </div>

        {/* Credentials form */}
        <form onSubmit={handleCredentials} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-soft)" }}>Username</span>
            <input
              type="text"
              placeholder="username"
              className="input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-soft)" }}>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading !== null}
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: 14, marginTop: 4, opacity: loading === "credentials" ? 0.7 : 1 }}
          >
            {loading === "credentials" ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 24 }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Sign up free</Link>
        </p>
      </div>

      <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 24, textAlign: "center", maxWidth: 320 }}>
        By signing in you agree to our{" "}
        <a href="#" style={{ color: "var(--muted)", textDecoration: "underline" }}>Terms of Service</a> and{" "}
        <a href="#" style={{ color: "var(--muted)", textDecoration: "underline" }}>Privacy Policy</a>.
      </p>
    </div>
  );
}
