"use client";

import { useSubscription, type Tier } from "./SubscriptionContext";

const TIERS: { id: Tier; label: string; color: string }[] = [
  { id: "explorer",      label: "Explorer",    color: "#64748b" },
  { id: "searcher",      label: "Searcher",    color: "#4f46e5" },
  { id: "broker",        label: "Broker",      color: "#7c3aed" },
  { id: "institutional", label: "Institutional", color: "#0891b2" },
];

export function DevTierSwitcher() {
  const { tier, setTier } = useSubscription();

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 16,
      right: 16,
      zIndex: 9999,
      background: "#0f172a",
      borderRadius: 12,
      padding: "8px 10px",
      display: "flex",
      alignItems: "center",
      gap: 6,
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      fontFamily: "monospace",
    }}>
      <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.06em", marginRight: 2 }}>DEV</span>
      {TIERS.map(t => (
        <button
          key={t.id}
          onClick={() => setTier(t.id)}
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 7,
            border: "none",
            cursor: "pointer",
            background: tier === t.id ? t.color : "#1e293b",
            color: tier === t.id ? "#fff" : "#94a3b8",
            transition: "all 0.15s",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
