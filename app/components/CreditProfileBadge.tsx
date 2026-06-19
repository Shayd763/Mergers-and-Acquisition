"use client";
import React, { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────── //

export interface CreditProfile {
  open_credit_score: number;
  credit_band: string;
  credit_band_label: string;
  insolvency_risk: string;
  risk_color: "green" | "amber" | "red";
  credit_opinion: string;
  credit_limit_gbp: number;
  max_credit_gbp: number;
  recommended_payment_days: number;
  score_percentile: number;
  payment_behaviour: string;
  industry_risk: string;
  industry_label: string;
  company_age_years: number;
  score_breakdown: Record<string, number>;
  detailed_factors: DetailedFactor[];
  positive_indicators: string[];
  negative_indicators: string[];
  improvement_actions: ImprovementAction[];
  summary: string;
  analyst_notes: string;
  data_sources_used?: string[];
  enrichment?: Record<string, unknown> | null;
  valuation?: ValuationEstimate | null;
}

export interface DetailedFactor {
  id: string;
  name: string;
  category: string;
  earned: number;
  max_score: number;
  status: "excellent" | "good" | "fair" | "poor" | "negative";
  finding: string;
  detail: string;
  weight: string;
}

export interface ValuationAdjustment {
  factor: string;
  direction: "positive" | "negative" | "neutral";
  pct: number;
  note: string;
}

export interface ValuationEstimate {
  sector_label: string;
  base_multiple_low: number;
  base_multiple_mid: number;
  base_multiple_high: number;
  adjusted_multiple_low: number;
  adjusted_multiple_mid: number;
  adjusted_multiple_high: number;
  total_adjustment_pct: number;
  adjustments: ValuationAdjustment[];
  earnings_used?: number | null;
  earnings_label?: string | null;
  ev_low?: number | null;
  ev_mid?: number | null;
  ev_high?: number | null;
  valuation_note: string;
  methodology: string;
}

export interface ImprovementAction {
  id: string;
  title: string;
  category: string;
  potential_gain: number;
  timeframe: string;
  difficulty: string;
  how: string;
}

interface Props {
  profile?: CreditProfile;
  loading?: boolean;
  onViewReport?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────── //

function fmtGbp(v: number): string {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(2)}m`;
  if (v >= 1_000) return `£${(v / 1_000).toFixed(0)}k`;
  return `£${v}`;
}

const PALETTE = {
  green: { arc: "#22c55e", glow: "rgba(34,197,94,0.20)", badge: "#14532d", badgeText: "#86efac" },
  amber: { arc: "#f59e0b", glow: "rgba(245,158,11,0.20)", badge: "#78350f", badgeText: "#fcd34d" },
  red:   { arc: "#ef4444", glow: "rgba(239,68,68,0.20)",  badge: "#7f1d1d", badgeText: "#fca5a5" },
};

const OPINION_COLOR: Record<string, string> = {
  Recommend: "#22c55e",
  Review:    "#a5b4fc",
  Caution:   "#f59e0b",
  Decline:   "#ef4444",
};

// ─── Mini radial arc ─────────────────────────────────────────────────────── //

function MiniArc({ score, color }: { score: number; color: "green" | "amber" | "red" }) {
  const animRef = useRef<number>(0);
  const [display, setDisplay] = useState(0);
  const p = PALETTE[color];

  useEffect(() => {
    let start: number | null = null;
    const dur = 900;
    const step = (ts: number) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setDisplay(Math.round(eased * score));
      if (prog < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [score]);

  const R = 38, cx = 48, cy = 48;
  const circ = 2 * Math.PI * R;
  const arcLen = circ * (240 / 360);
  const offset = arcLen * (1 - display / 100);

  return (
    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"
          strokeDasharray={`${arcLen} ${circ - arcLen}`} strokeDashoffset={0}
          strokeLinecap="round" transform={`rotate(150 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={p.arc} strokeWidth="8"
          strokeDasharray={`${arcLen - offset} ${circ - (arcLen - offset)}`}
          strokeDashoffset={0} strokeLinecap="round"
          transform={`rotate(150 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 5px ${p.arc})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: p.arc, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{display}</span>
        <span style={{ fontSize: 8, color: "#475569", fontWeight: 700, letterSpacing: "0.08em" }}>/100</span>
      </div>
    </div>
  );
}

// ─── Main badge (headline only) ───────────────────────────────────────────── //

export function CreditProfileBadge({ profile, loading, onViewReport }: Props) {
  if (loading) {
    return (
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, color: "#475569", fontSize: 13 }}>
        <span style={{ width: 12, height: 12, border: "2px solid #334155", borderTopColor: "#6366f1", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
        Computing credit profile…
      </div>
    );
  }

  if (!profile) return null;

  const p = PALETTE[profile.risk_color];
  const opinionColor = OPINION_COLOR[profile.credit_opinion] ?? "#94a3b8";

  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
      {/* Header strip */}
      <div style={{ background: "#0a0f1e", borderBottom: "1px solid #1e293b", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.12em", flex: 1 }}>CREDIT PROFILE · COMPANIES HOUSE DATA</span>
        {profile.data_sources_used && profile.data_sources_used.length > 0 && (
          <span style={{ fontSize: 9, fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em" }}>
            {profile.data_sources_used.length} sources
          </span>
        )}
        <span style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.08em" }}>OPEN-SOURCE ENGINE</span>
      </div>

      {/* Score + headline metrics */}
      <div style={{ padding: "14px 16px", display: "flex", gap: 14, alignItems: "center" }}>
        <MiniArc score={profile.open_credit_score} color={profile.risk_color} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Band + risk badge */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: p.arc, letterSpacing: "-0.02em" }}>
              Band {profile.credit_band}
            </span>
            <span style={{ background: p.badge, color: p.badgeText, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.07em" }}>
              {profile.insolvency_risk} RISK
            </span>
          </div>

          {/* 3-up headline figures */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.09em", marginBottom: 2 }}>CREDIT LIMIT</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>{fmtGbp(profile.credit_limit_gbp)}</div>
              <div style={{ fontSize: 9, color: "#475569" }}>up to {fmtGbp(profile.max_credit_gbp)}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.09em", marginBottom: 2 }}>PAYMENT TERMS</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9" }}>Net {profile.recommended_payment_days}d</div>
              <div style={{ fontSize: 9, color: "#475569" }}>{profile.payment_behaviour}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.09em", marginBottom: 2 }}>OPINION</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: opinionColor }}>{profile.credit_opinion}</div>
              <div style={{ fontSize: 9, color: "#475569" }}>Top {100 - profile.score_percentile}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary line */}
      <div style={{ padding: "0 16px 10px" }}>
        <p style={{ fontSize: 11, color: "#475569", margin: 0, lineHeight: 1.55 }}>{profile.summary}</p>
      </div>

      {/* View full report CTA */}
      {onViewReport && (
        <div style={{ borderTop: "1px solid #1e293b", padding: "10px 14px" }}>
          <button
            onClick={onViewReport}
            style={{
              width: "100%", background: "rgba(99,102,241,0.12)", color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.25)", borderRadius: 7,
              padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.20)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}
          >
            View Full Credit Report
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
