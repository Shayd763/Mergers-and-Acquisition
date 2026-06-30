"use client";
import React, { useState } from "react";
import { useSubscription, type Tier } from "@/app/components/SubscriptionContext";
import { useSession } from "next-auth/react";
import { CheckCircle, Zap, Star, Building2, Lock, ArrowRight, ExternalLink } from "lucide-react";

const TIER_DEFS: {
  id: Tier;
  name: string;
  price: string;
  priceNote: string;
  color: string;
  icon: React.ReactNode;
  features: string[];
  cta: string;
  popular?: boolean;
}[] = [
  {
    id: "explorer",
    name: "Explorer",
    price: "Free",
    priceNote: "forever",
    color: "#78716c",
    icon: <Star size={15} />,
    features: [
      "Dynamic deal structuring with live sliders",
      "DSCR, FCF & equity IRR modelling",
      "Proprietary credit score from live UK databases",
      "1 Credit Memo export per month",
    ],
    cta: "Downgrade to Explorer",
  },
  {
    id: "searcher",
    name: "Active Searcher",
    price: "£49",
    priceNote: "/month",
    color: "#1c1917",
    icon: <Zap size={15} />,
    features: [
      "Unlimited deal workspaces",
      "AI extraction — paste listing or upload PDF",
      "Full credit score breakdown with risk flags",
      "FCA, VAT, PSC & director enrichment",
      "Unlimited Credit Memo PDF exports",
      "Annual Rebate on Closing (up to £588 cashback)",
    ],
    cta: "Switch to Searcher",
    popular: true,
  },
  {
    id: "broker",
    name: "Deal Broker",
    price: "£149",
    priceNote: "/month",
    color: "#292524",
    icon: <Building2 size={15} />,
    features: [
      "Everything in Active Searcher",
      "White-labelled Credit Memo — your brand",
      "Shared investor pipeline dashboards",
      "Priority routing to UK lender network",
      "Annual Rebate on Closing (up to £1,788)",
    ],
    cta: "Switch to Broker",
  },
  {
    id: "institutional",
    name: "Institutional",
    price: "Custom",
    priceNote: "pricing",
    color: "#0891b2",
    icon: <Building2 size={15} />,
    features: [
      "Everything in Deal Broker",
      "Bulk regional multiples API",
      "Multi-seat team access",
      "Dedicated account manager",
      "Custom SLA & uptime guarantee",
    ],
    cta: "Contact Sales",
  },
];

function PlanCard({ td, isCurrent, onSelect, loading }: {
  td: typeof TIER_DEFS[0];
  isCurrent: boolean;
  onSelect: () => void;
  loading: boolean;
}) {
  return (
    <div style={{
      border: isCurrent ? `2px solid ${td.color}` : "1.5px solid #d6d3d1",
      borderRadius: 14,
      padding: "20px",
      background: isCurrent ? `${td.color}07` : "#fff",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      position: "relative",
      transition: "box-shadow 0.15s",
    }}>
      {/* Popular badge */}
      {td.popular && !isCurrent && (
        <div style={{
          position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
          background: td.color, color: "#fff", fontSize: 10, fontWeight: 800,
          padding: "3px 12px", borderRadius: 999, letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}>
          MOST POPULAR
        </div>
      )}
      {isCurrent && (
        <div style={{
          position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
          background: td.color, color: "#fff", fontSize: 10, fontWeight: 800,
          padding: "3px 12px", borderRadius: 999, letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}>
          CURRENT PLAN
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: td.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
          {td.icon}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#1c1917", margin: 0 }}>{td.name}</p>
          <p style={{ fontSize: 13, color: "#78716c", margin: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#1c1917" }}>{td.price}</span>
            {" "}{td.priceNote}
          </p>
        </div>
      </div>

      {/* Features */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        {td.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <CheckCircle size={13} style={{ color: td.color, flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 12.5, color: "#44403c", lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onSelect}
        disabled={isCurrent || loading}
        style={{
          width: "100%",
          padding: "10px 0",
          borderRadius: 9,
          border: isCurrent ? `1.5px solid ${td.color}40` : "none",
          background: isCurrent ? "transparent" : td.id === "institutional" ? "transparent" : td.color,
          color: isCurrent ? td.color : td.id === "institutional" ? td.color : "#fff",
          fontSize: 13,
          fontWeight: 700,
          cursor: isCurrent ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          opacity: loading ? 0.6 : 1,
          borderWidth: td.id === "institutional" && !isCurrent ? 1 : undefined,
          borderStyle: td.id === "institutional" && !isCurrent ? "solid" : undefined,
          borderColor: td.id === "institutional" && !isCurrent ? td.color : undefined,
          transition: "opacity 0.15s",
        }}
      >
        {isCurrent ? "Your current plan" : loading ? "Redirecting…" : td.cta}
        {!isCurrent && <ArrowRight size={13} />}
      </button>
    </div>
  );
}

async function openBillingPortal() {
  const res = await fetch("/api/billing-portal", { method: "POST" });
  if (res.status === 401) { window.location.href = "/login"; return; }
  if (res.status === 404) { alert("No billing account found. Please subscribe first."); return; }
  const data = await res.json();
  window.location.href = data.url;
}

export default function AccountPage() {
  const { tier, isPremium } = useSubscription();
  const { data: session } = useSession();
  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const userEmail = session?.user?.email ?? "";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  React.useEffect(() => {
    const name = session?.user?.name ?? "";
    setFirstName(name.split(" ")[0] ?? "");
    setLastName(name.split(" ").slice(1).join(" ") ?? "");
  }, [session?.user?.name]);

  const userName = session?.user?.name ?? "";
  const initials = userName
    ? userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase();

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleBillingPortal = async () => {
    setPortalLoading(true);
    await openBillingPortal();
    setPortalLoading(false);
  };

  const handleSelect = async (td: typeof TIER_DEFS[0]) => {
    if (td.id === tier) return;

    // Explorer = downgrade via billing portal
    if (td.id === "explorer") {
      await openBillingPortal();
      return;
    }

    // Institutional = contact sales
    if (td.id === "institutional") {
      window.location.href = "mailto:hello@triagefinance.co.uk?subject=Institutional%20Plan%20Enquiry";
      return;
    }

    // Paid tiers → Stripe Checkout
    setLoadingTier(td.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: td.id }),
      });
      const data = await res.json();
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setLoadingTier(null);
    }
  };

  const currentDef = TIER_DEFS.find(t => t.id === tier)!;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Account & Subscription</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Manage your profile, plan, and billing.</p>
      </div>

      {/* Profile card */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>Profile</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {initials}
            </div>
          )}
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>{userName || userEmail}</p>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{userEmail}</p>
          </div>
        </div>
        <div className="triage-metrics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>First name</span>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} className="input" style={{ fontSize: 13 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Last name</span>
            <input value={lastName} onChange={e => setLastName(e.target.value)} className="input" style={{ fontSize: 13 }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</span>
            <input value={userEmail} readOnly className="input" style={{ fontSize: 13, opacity: 0.6, cursor: "not-allowed" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Role</span>
            <input defaultValue="ETA Buyer / Searcher" readOnly className="input" style={{ fontSize: 13, opacity: 0.6, cursor: "not-allowed" }} />
          </label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button onClick={handleSaveProfile} disabled={profileSaving} className="btn-primary" style={{ padding: "9px 20px", fontSize: 13 }}>
            {profileSaving ? "Saving…" : "Save changes"}
          </button>
          {profileSaved && <span style={{ fontSize: 13, color: "#059669", fontWeight: 600 }}>✓ Saved</span>}
        </div>
      </div>

      {/* Plan management */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>Your Plan</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Upgrade, downgrade, or switch plans at any time.</p>
          </div>
          {isPremium && (
            <button
              onClick={handleBillingPortal}
              disabled={portalLoading}
              style={{ fontSize: 12, color: "#1c1917", fontWeight: 600, border: "1px solid #d6d3d1", borderRadius: 7, padding: "6px 12px", background: "#e7e5e4", whiteSpace: "nowrap", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              {portalLoading ? "Opening…" : <><ExternalLink size={11} /> Manage billing</>}
            </button>
          )}
        </div>

        <div className="plan-grid">
          {TIER_DEFS.map(td => (
            <PlanCard
              key={td.id}
              td={td}
              isCurrent={td.id === tier}
              onSelect={() => handleSelect(td)}
              loading={loadingTier === td.id}
            />
          ))}
        </div>

        <p style={{ fontSize: 11, color: "#a8a29e", margin: "16px 0 0", textAlign: "center" }}>
          Cancel anytime · No lock-in · Billed monthly · Prices in GBP
        </p>
      </div>

      {/* Billing */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 16px", paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>Billing</h2>
        {isPremium ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-soft)" }}>
              <span>Current plan</span>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{currentDef.name} — {currentDef.price}{currentDef.id !== "institutional" ? "/mo" : ""}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-soft)" }}>
              <span>Next billing date</span>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>View in billing portal</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-soft)" }}>
              <span>Payment method</span>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>View in billing portal</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={handleBillingPortal} disabled={portalLoading} className="btn-secondary" style={{ fontSize: 12, padding: "7px 14px", cursor: "pointer" }}>
                Update card
              </button>
              <button onClick={handleBillingPortal} disabled={portalLoading} style={{ fontSize: 12, padding: "7px 14px", background: "none", border: "1px solid #fee2e2", borderRadius: 7, color: "#dc2626", cursor: "pointer", fontWeight: 600 }}>
                Cancel plan
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Lock size={16} style={{ color: "#a8a29e" }} />
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
              No active subscription.{" "}
              <button
                onClick={() => handleSelect(TIER_DEFS[1])}
                style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontSize: 13, padding: 0 }}>
                Upgrade to unlock billing
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="card" style={{ padding: 24, border: "1px solid #fee2e2" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#dc2626", margin: "0 0 12px" }}>Danger zone</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px" }}>Permanently delete your account and all saved deals. This cannot be undone.</p>
        <button
          disabled={deleteLoading}
          onClick={async () => {
            if (!window.confirm("Are you sure? This will permanently delete your account and all saved deals. This cannot be undone.")) return;
            setDeleteLoading(true);
            try {
              const res = await fetch("/api/account", { method: "DELETE" });
              if (res.ok) {
                window.location.href = "/?deleted=1";
              } else {
                alert("Failed to delete account. Please contact support at hello@triagefinance.co.uk");
                setDeleteLoading(false);
              }
            } catch {
              alert("Failed to delete account. Please contact support at hello@triagefinance.co.uk");
              setDeleteLoading(false);
            }
          }}
          style={{ fontSize: 12, fontWeight: 700, padding: "8px 16px", background: "none", border: "1px solid #fca5a5", borderRadius: 7, color: "#dc2626", cursor: deleteLoading ? "wait" : "pointer", opacity: deleteLoading ? 0.6 : 1 }}>
          {deleteLoading ? "Deleting…" : "Delete account"}
        </button>
      </div>
    </div>
  );
}
