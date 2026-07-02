"use client";
import Link from "next/link";
import { CheckCircle, BarChart3 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function CheckoutSuccessPage() {
  const { update } = useSession();

  // Force session refresh so the DB-backed tier propagates to the client immediately
  useEffect(() => {
    update();
  }, [update]);

  return (
    <div style={{
      minHeight: "100vh", background: "#faf9f7",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 40 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart3 size={18} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 18, color: "#1c1917", letterSpacing: "-0.02em" }}>Acquisition Exchange</span>
      </Link>

      <div style={{
        background: "#fff", border: "1px solid #d6d3d1", borderRadius: 20,
        padding: "48px 40px", maxWidth: 460, width: "100%", textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg,#059669,#10b981)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <CheckCircle size={30} color="#fff" />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1c1917", margin: "0 0 10px", letterSpacing: "-0.03em" }}>
          You&apos;re live!
        </h1>
        <p style={{ fontSize: 14, color: "#78716c", margin: "0 0 32px", lineHeight: 1.65 }}>
          Your subscription is active. Head to your dashboard to access all your premium features — including unlimited deal workspaces, PDF parsing, and full credit memo exports.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none",
              cursor: "pointer", background: "linear-gradient(135deg,#166534,#14532d)",
              color: "#fff", fontSize: 14, fontWeight: 700,
            }}>
              Go to Dashboard →
            </button>
          </Link>
          <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%", padding: "12px", borderRadius: 12,
              border: "1px solid #d6d3d1", cursor: "pointer",
              background: "#faf9f7", color: "#475569", fontSize: 14, fontWeight: 600,
            }}>
              Start a new deal triage
            </button>
          </Link>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#a8a29e", marginTop: 24, textAlign: "center" }}>
        A receipt has been sent to your email. Questions?{" "}
        <a href="mailto:hello@acquisition.exchange" style={{ color: "#78716c" }}>hello@acquisition.exchange</a>
      </p>
    </div>
  );
}
