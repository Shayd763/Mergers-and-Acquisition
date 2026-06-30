"use client";
import React, { useEffect, useRef, useState } from "react";
import { Lock, Zap, Star, Building2, X, CheckCircle, RefreshCw, ArrowRight, ArrowLeft } from "lucide-react";
import { useSubscription, type Tier } from "./SubscriptionContext";

// ─── Tier definitions ─────────────────────────────────────────────────────── //

interface TierDef {
  id: Tier;
  name: string;
  price: string;
  period: string;
  desc: string;
  icon: React.ReactNode;
  features: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
  accentColor: string;
  contact?: boolean;   // true = "Contact Us" flow
  free?: boolean;      // true = sign-up flow
}

const TIERS: TierDef[] = [
  {
    id: "explorer",
    name: "Explorer",
    price: "£0",
    period: "forever",
    desc: "Structure deals and run credit checks for free.",
    icon: <Star size={16} />,
    accentColor: "#78716c",
    cta: "Start Free",
    free: true,
    features: [
      "Dynamic deal structuring with live sliders",
      "DSCR, FCF & equity IRR modelling",
      "Proprietary credit score from live UK databases",
      "1 Credit Memo export per month",
    ],
  },
  {
    id: "searcher",
    name: "Active Searcher",
    price: "£49",
    period: "/mo",
    desc: "AI parsing, unlimited workspaces, full enrichment.",
    icon: <Zap size={16} />,
    accentColor: "#1c1917",
    highlight: true,
    badge: "Most Popular",
    cta: "Upgrade — £49/mo",
    features: [
      "AI extraction — paste a listing or upload a PDF",
      "Full credit score breakdown with risk flags",
      "FCA, VAT, PSC & director enrichment",
      "Unlimited Credit Memo PDF exports",
    ],
  },
  {
    id: "broker",
    name: "Deal Broker",
    price: "£149",
    period: "/mo",
    desc: "Your brand on every output, direct lender routing.",
    icon: <Building2 size={16} />,
    accentColor: "#a855f7",
    cta: "Upgrade — £149/mo",
    features: [
      "Everything in Active Searcher",
      "White-labelled Credit Memo — your logo",
      "Shared investor pipeline dashboards",
      "Priority routing to UK lender network",
    ],
  },
  {
    id: "institutional",
    name: "Institutional",
    price: "Custom",
    period: "",
    desc: "For search funds, family offices and teams.",
    icon: <Building2 size={16} />,
    accentColor: "#0891b2",
    cta: "Contact Us",
    contact: true,
    features: [
      "Everything in Deal Broker",
      "Bulk regional multiples API",
      "Multi-seat team access",
      "Dedicated account manager",
    ],
  },
];

// ─── Stripe checkout redirect ──────────────────────────────────────────────── //

function CheckoutPanel({ tier: td, onBack }: { tier: TierDef; onBack: () => void; onConfirm: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: td.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/login"; return; }
        throw new Error(data.error ?? "Checkout failed");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 20, fontWeight: 600 }}>
        <ArrowLeft size={13} /> Back to plans
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "14px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${td.accentColor}22`, border: `1px solid ${td.accentColor}44`, display: "flex", alignItems: "center", justifyContent: "center", color: td.accentColor }}>{td.icon}</div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{td.name}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{td.price}{td.period} · billed monthly · cancel anytime</p>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{td.price}</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>per month</p>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 20px", lineHeight: 1.6 }}>
        You&apos;ll be taken to Stripe&apos;s secure checkout. Card details are handled by Stripe — we never see your payment information.
      </p>

      {error && (
        <p style={{ fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px", margin: "0 0 14px" }}>
          {error}
        </p>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          width: "100%", padding: "13px 0",
          background: loading ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg,${td.accentColor},${td.highlight ? "#a855f7" : td.accentColor}cc)`,
          color: loading ? "rgba(255,255,255,0.3)" : "#fff",
          border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : `0 4px 20px ${td.accentColor}44`,
          transition: "all 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
        {loading ? (
          <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Redirecting to Stripe…</>
        ) : `Continue to checkout — ${td.price}${td.period} →`}
      </button>

      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", margin: "12px 0 0" }}>
        🔒 Powered by Stripe · Cancel anytime · No lock-in
      </p>
    </div>
  );
}

// ─── Contact panel ─────────────────────────────────────────────────────────── //

function ContactPanel({ onBack, onSent }: { onBack: () => void; onSent: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSent(true);
    setTimeout(onSent, 1600);
  };

  const ready = name.trim().length > 1 && email.includes("@") && msg.trim().length > 10;

  if (sent) {
    return (
      <div style={{ padding: "48px 32px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#0891b2,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle size={26} color="#fff" />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>Message sent!</h3>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>Our team will be in touch within 1 business day.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 20, fontWeight: 600 }}>
        <ArrowLeft size={13} /> Back to plans
      </button>

      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Get in touch</h3>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 22px" }}>Tell us about your team and we'll put together a custom package.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          ["Your name", name, setName, "text", "James Smith"],
          ["Work email", email, setEmail, "email", "james@searchfund.co.uk"],
          ["Organisation", org, setOrg, "text", "Smith Capital Partners (optional)"],
        ].map(([label, val, set, type, ph]) => (
          <label key={label as string} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label as string}</span>
            <input type={type as string} value={val as string} onChange={e => (set as (v: string) => void)(e.target.value)} placeholder={ph as string}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "#fff", outline: "none", fontFamily: "inherit" }} />
          </label>
        ))}
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Message</span>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} placeholder="Tell us about your deal volume, team size, and what you need..."
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "#fff", outline: "none", fontFamily: "inherit", resize: "vertical" }} />
        </label>

        <button onClick={handleSend} disabled={!ready}
          style={{
            marginTop: 4, width: "100%", padding: "13px 0",
            background: ready ? "linear-gradient(135deg,#0891b2,#06b6d4)" : "rgba(255,255,255,0.08)",
            color: ready ? "#fff" : "rgba(255,255,255,0.3)",
            border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: ready ? "pointer" : "not-allowed", transition: "all 0.2s",
          }}>
          Send message →
        </button>
      </div>
    </div>
  );
}

// ─── Tier card ────────────────────────────────────────────────────────────── //

function TierCard({ tier: td, current, onUpgrade, onContact, onFree }: {
  tier: TierDef; current: Tier;
  onUpgrade: (t: TierDef) => void;
  onContact: () => void;
  onFree: () => void;
}) {
  const isCurrent = td.id === current;

  const handleCTA = () => {
    if (isCurrent) return;
    if (td.contact) { onContact(); return; }
    if (td.free) { onFree(); return; }
    onUpgrade(td);
  };

  return (
    <div style={{
      position: "relative",
      background: td.highlight
        ? "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.12) 100%)"
        : "rgba(255,255,255,0.04)",
      border: `1px solid ${td.highlight ? "rgba(99,102,241,0.45)" : isCurrent ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 16,
      padding: "18px 16px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      flex: "1 1 180px",
      minWidth: 0,
      boxShadow: td.highlight ? "0 0 40px rgba(99,102,241,0.18)" : "none",
      transition: "transform 0.15s",
    }}>
      {td.badge && (
        <div style={{
          position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg,#292524,#1c1917)",
          color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
          padding: "3px 10px", borderRadius: 9999, whiteSpace: "nowrap",
        }}>
          {td.badge}
        </div>
      )}
      {isCurrent && (
        <div style={{
          position: "absolute", top: -10, right: 16,
          background: "rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
          padding: "3px 10px", borderRadius: 9999,
        }}>
          YOUR PLAN
        </div>
      )}

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ color: td.accentColor, opacity: 0.9 }}>{td.icon}</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em" }}>
            {td.name.toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>{td.price}</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{td.period}</span>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "4px 0 0", lineHeight: 1.5 }}>{td.desc}</p>
      </div>

      {/* Features */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        {td.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
            <CheckCircle size={10} style={{ color: td.accentColor, marginTop: 2, flexShrink: 0, opacity: 0.9 }} />
            <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.45 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleCTA}
        disabled={isCurrent}
        style={{
          width: "100%",
          padding: "10px 0",
          borderRadius: 9,
          border: isCurrent ? "1px solid rgba(255,255,255,0.12)" : "none",
          cursor: isCurrent ? "default" : "pointer",
          fontWeight: 700,
          fontSize: 12,
          color: isCurrent ? "rgba(255,255,255,0.35)" : "#fff",
          background: isCurrent
            ? "transparent"
            : td.highlight
            ? "linear-gradient(135deg,#292524,#1c1917)"
            : td.contact
            ? "linear-gradient(135deg,#0891b2,#06b6d4)"
            : `${td.accentColor}33`,
          boxShadow: (!isCurrent && td.highlight) ? "0 4px 20px rgba(99,102,241,0.35)" : "none",
          transition: "all 0.15s",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={e => {
          if (!isCurrent && !td.highlight && !td.contact) (e.currentTarget as HTMLElement).style.background = `${td.accentColor}55`;
        }}
        onMouseLeave={e => {
          if (!isCurrent && !td.highlight && !td.contact) (e.currentTarget as HTMLElement).style.background = `${td.accentColor}33`;
        }}
      >
        {isCurrent ? "Current Plan" : td.cta}
      </button>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────── //

type View = "plans" | "checkout" | "contact";

export function UpgradeModal() {
  const { upgradeModalOpen, closeUpgradeModal, triggeredFeature, tier, setTier } = useSubscription();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>("plans");
  const [checkoutTier, setCheckoutTier] = useState<TierDef | null>(null);

  // Reset to plans view whenever modal opens
  useEffect(() => {
    if (upgradeModalOpen) { setView("plans"); setCheckoutTier(null); }
  }, [upgradeModalOpen]);

  // Close on Escape
  useEffect(() => {
    if (!upgradeModalOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeUpgradeModal(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [upgradeModalOpen, closeUpgradeModal]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = upgradeModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [upgradeModalOpen]);

  if (!upgradeModalOpen) return null;

  const handleUpgrade = (td: TierDef) => { setCheckoutTier(td); setView("checkout"); };
  const handleContact = () => setView("contact");
  const handleFree    = () => { closeUpgradeModal(); window.location.href = "/signup"; };
  const handleConfirm = () => {
    if (checkoutTier) setTier(checkoutTier.id);
    closeUpgradeModal();
  };

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) closeUpgradeModal(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(2, 2, 10, 0.78)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        animation: "modal-in 0.22s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <div style={{
        background: "rgba(9, 9, 18, 0.96)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.12) inset",
        maxWidth: view === "plans" ? 940 : 520,
        width: "100%",
        maxHeight: "92vh",
        overflowY: "auto",
        animation: "modal-slide 0.28s cubic-bezier(0.16,1,0.3,1) both",
        transition: "max-width 0.3s ease",
      }}>

        {/* Close button — always visible */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 20px 0" }}>
          <button
            onClick={closeUpgradeModal}
            style={{
              width: 44, height: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)", cursor: "pointer",
              color: "rgba(255,255,255,0.5)", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <X size={15} />
          </button>
        </div>

        {/* ── Plans view ── */}
        {view === "plans" && (
          <>
            <div style={{ padding: "4px 28px 0" }}>
              {triggeredFeature && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: 9999, padding: "3px 11px", marginBottom: 8,
                }}>
                  <Lock size={10} color="#a5b4fc" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.08em" }}>
                    PREMIUM FEATURE: {triggeredFeature.toUpperCase()}
                  </span>
                </div>
              )}
              <h2 style={{ fontSize: "clamp(18px,3vw,22px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                Unlock Unlimited{" "}
                <span style={{ background: "linear-gradient(90deg,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Underwriting Automations
                </span>
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "4px 0 0", lineHeight: 1.5 }}>
                One platform. Every step — from target audit to lender routing.
              </p>
            </div>

            {/* Debt Offset Guarantee — compact single row */}
            <div style={{ padding: "12px 28px 0" }}>
              <div style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))",
                border: "1px solid rgba(99,102,241,0.25)", borderRadius: 10, padding: "10px 14px",
                display: "flex", gap: 10, alignItems: "center",
              }}>
                <RefreshCw size={14} color="#a5b4fc" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.5 }}>
                  <strong style={{ color: "#c4b5fd" }}>Debt Offset Guarantee</strong> — close a deal through our lender network and we refund up to{" "}
                  <strong style={{ color: "#4ade80" }}>£588</strong> in subscription fees.
                </p>
              </div>
            </div>

            {/* Tier cards */}
            <div style={{ padding: "14px 28px" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
                {TIERS.map(td => (
                  <TierCard key={td.id} tier={td} current={tier}
                    onUpgrade={handleUpgrade}
                    onContact={handleContact}
                    onFree={handleFree}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "0 28px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>
                Secure checkout · Cancel anytime · No lock-in
              </p>
              <a href="#" onClick={e => { e.preventDefault(); closeUpgradeModal(); }}
                style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
                Continue on Explorer <ArrowRight size={11} />
              </a>
            </div>
          </>
        )}

        {/* ── Checkout view ── */}
        {view === "checkout" && checkoutTier && (
          <CheckoutPanel tier={checkoutTier} onBack={() => setView("plans")} onConfirm={handleConfirm} />
        )}

        {/* ── Contact view ── */}
        {view === "contact" && (
          <ContactPanel onBack={() => setView("plans")} onSent={closeUpgradeModal} />
        )}
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes modal-slide {
          from { opacity: 0; transform: translateY(16px) scale(0.975); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
