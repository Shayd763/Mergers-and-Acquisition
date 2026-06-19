"use client";
import React from "react";
import { Lock } from "lucide-react";
import { useSubscription, type Tier } from "./SubscriptionContext";

interface Props {
  feature: string;
  title: string;
  teaser: string;
  requiredTier?: Tier;   // minimum tier needed — defaults to "searcher"
  children: React.ReactNode;
}

const TIER_LABELS: Record<Tier, string> = {
  explorer: "Explorer",
  searcher: "Active Searcher",
  broker: "Deal Broker",
  institutional: "Institutional",
};

const TIER_COLORS: Record<Tier, string> = {
  explorer: "#64748b",
  searcher: "#6366f1",
  broker: "#a855f7",
  institutional: "#0891b2",
};

export function PremiumGate({ feature, title, teaser, requiredTier = "searcher", children }: Props) {
  const { isAtLeast, openUpgradeModal } = useSubscription();

  if (isAtLeast(requiredTier)) return <>{children}</>;

  const color = TIER_COLORS[requiredTier];
  const label = TIER_LABELS[requiredTier];

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
      {/* blurred content */}
      <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.55 }}>
        {children}
      </div>

      {/* overlay */}
      <div
        onClick={() => openUpgradeModal(feature)}
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 10,
          background: "rgba(248,250,252,0.72)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          cursor: "pointer",
          borderRadius: 12,
          border: `1px solid ${color}30`,
          transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(238,242,255,0.82)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,250,252,0.72)")}
      >
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: `linear-gradient(135deg,${color},${color}bb)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 18px ${color}55`,
        }}>
          <Lock size={16} color="#fff" />
        </div>

        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
            {title}
          </p>
          <p style={{ fontSize: 12, color, margin: 0, lineHeight: 1.5 }}>
            {teaser}
          </p>
        </div>

        <button
          style={{
            marginTop: 4,
            padding: "8px 20px",
            background: `linear-gradient(135deg,${color},${color}cc)`,
            color: "#fff",
            border: "none",
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 4px 14px ${color}44`,
            letterSpacing: "0.02em",
          }}
        >
          Unlock with {label} →
        </button>
      </div>
    </div>
  );
}
