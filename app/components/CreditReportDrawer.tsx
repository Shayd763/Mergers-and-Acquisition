"use client";
import React, { useEffect, useRef, useState } from "react";
import type { CreditProfile, DetailedFactor, ImprovementAction, ValuationEstimate, ValuationAdjustment, CreditLimitBreakdown } from "./CreditProfileBadge";

// ─── Props ────────────────────────────────────────────────────────────────── //

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: CreditProfile;
  companyName: string;
  companyNumber: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────── //

function fmtGbp(v: number): string {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(2)}m`;
  if (v >= 1_000) return `£${(v / 1_000).toFixed(0)}k`;
  return `£${v}`;
}

const PALETTE = {
  green: { arc: "#22c55e", badge: "#14532d", badgeText: "#86efac", dim: "rgba(34,197,94,0.12)" },
  amber: { arc: "#f59e0b", badge: "#78350f", badgeText: "#fcd34d", dim: "rgba(245,158,11,0.12)" },
  red:   { arc: "#ef4444", badge: "#7f1d1d", badgeText: "#fca5a5", dim: "rgba(239,68,68,0.12)" },
};

const STATUS_COLOR: Record<string, { bar: string; text: string; bg: string }> = {
  excellent: { bar: "#22c55e", text: "#86efac", bg: "rgba(34,197,94,0.08)" },
  good:      { bar: "#4ade80", text: "#4ade80", bg: "rgba(74,222,128,0.06)" },
  fair:      { bar: "#f59e0b", text: "#fcd34d", bg: "rgba(245,158,11,0.08)" },
  poor:      { bar: "#f87171", text: "#f87171", bg: "rgba(248,113,113,0.08)" },
  negative:  { bar: "#ef4444", text: "#fca5a5", bg: "rgba(239,68,68,0.10)" },
};

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy:     "#22c55e",
  Moderate: "#f59e0b",
  Complex:  "#f87171",
};

const TIMEFRAME_COLOR: Record<string, string> = {
  Immediate:    "#a5b4fc",
  "1–3 months": "#34d399",
  "3–12 months":"#fcd34d",
  "Long-term":  "#94a3b8",
};

const BAND_EXPLAIN: Record<string, { color: string; description: string }> = {
  A: { color: "#22c55e", description: "Very Low Risk — Highly creditworthy. Standard or extended payment terms appropriate." },
  B: { color: "#4ade80", description: "Low Risk — Reliable counterparty. Standard trade terms recommended." },
  C: { color: "#f59e0b", description: "Moderate Risk — Proceed with reduced credit limits and shorter payment terms." },
  D: { color: "#f87171", description: "High Risk — Exercise significant caution. Require deposits or personal guarantees." },
  E: { color: "#ef4444", description: "Very High Risk — Decline standard credit. Prepayment or cash-only terms." },
};

// ─── Section header ───────────────────────────────────────────────────────── //

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.12em", textTransform: "uppercase" }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─── Score gauge (large) ──────────────────────────────────────────────────── //

function LargeGauge({ score, color }: { score: number; color: "green" | "amber" | "red" }) {
  const animRef = useRef<number>(0);
  const [display, setDisplay] = useState(0);
  const p = PALETTE[color];

  useEffect(() => {
    setDisplay(0);
    let start: number | null = null;
    const dur = 1000;
    const step = (ts: number) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / dur, 1);
      setDisplay(Math.round((1 - Math.pow(1 - prog, 3)) * score));
      if (prog < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [score]);

  const R = 70, cx = 88, cy = 88;
  const circ = 2 * Math.PI * R;
  const arcLen = circ * (240 / 360);
  const offset = arcLen * (1 - display / 100);

  // Tick marks for the gauge
  const ticks = [0, 20, 40, 60, 80, 100].map(v => {
    const angleDeg = 150 + (v / 100) * 240;
    const angleRad = (angleDeg * Math.PI) / 180;
    const r1 = R + 8, r2 = R + 14;
    return {
      x1: cx + r1 * Math.cos(angleRad), y1: cy + r1 * Math.sin(angleRad),
      x2: cx + r2 * Math.cos(angleRad), y2: cy + r2 * Math.sin(angleRad),
      label: v, angleDeg,
    };
  });

  return (
    <div style={{ position: "relative", width: 176, height: 176, margin: "0 auto" }}>
      <svg width="176" height="176" viewBox="0 0 176 176">
        {/* Gradient track segments */}
        {[
          { color: "#ef4444", start: 0,  end: 0.2 },
          { color: "#f97316", start: 0.2, end: 0.4 },
          { color: "#f59e0b", start: 0.4, end: 0.6 },
          { color: "#84cc16", start: 0.6, end: 0.8 },
          { color: "#22c55e", start: 0.8, end: 1.0 },
        ].map(({ color: col, start, end }) => {
          const segArcLen = arcLen * (end - start);
          const segOffset = arcLen * (1 - end);
          return (
            <circle key={start} cx={cx} cy={cy} r={R} fill="none" stroke={col}
              strokeWidth="8" opacity="0.15"
              strokeDasharray={`${segArcLen} ${circ - segArcLen}`}
              strokeDashoffset={-arcLen * start}
              strokeLinecap="butt"
              transform={`rotate(150 ${cx} ${cy})`} />
          );
        })}
        {/* Track */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"
          strokeDasharray={`${arcLen} ${circ - arcLen}`}
          transform={`rotate(150 ${cx} ${cy})`} />
        {/* Filled arc */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={p.arc} strokeWidth="10"
          strokeDasharray={`${arcLen - offset} ${circ - (arcLen - offset)}`}
          strokeDashoffset={0} strokeLinecap="round"
          transform={`rotate(150 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 8px ${p.arc})` }} />
        {/* Tick marks */}
        {ticks.map(t => (
          <line key={t.label} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#1e293b" strokeWidth="1.5" />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 40, fontWeight: 900, color: p.arc, lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{display}</span>
        <span style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.08em" }}>/ 100</span>
      </div>
    </div>
  );
}

// ─── Factor row ───────────────────────────────────────────────────────────── //

function FactorRow({ factor }: { factor: DetailedFactor }) {
  const [open, setOpen] = useState(false);
  const sc = STATUS_COLOR[factor.status] ?? STATUS_COLOR.fair;
  const pct = factor.max_score > 0 ? Math.max(0, (factor.earned / factor.max_score)) * 100 : 0;

  return (
    <div style={{ borderBottom: "1px solid #0f172a" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "12px 16px", display: "grid",
          gridTemplateColumns: "1fr 120px 80px 24px", gap: 12, alignItems: "center",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#e2e8f0" }}>{factor.name}</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{factor.finding}</div>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ height: 5, background: "#0f172a", borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: sc.bar, borderRadius: 9999, transition: "width 0.6s ease" }} />
          </div>
        </div>

        {/* Score chip */}
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: sc.text, background: sc.bg, padding: "2px 8px", borderRadius: 4 }}>
            {factor.earned < 0 ? factor.earned : `+${factor.earned}`} / {factor.max_score}
          </span>
        </div>

        {/* Chevron */}
        <span style={{ color: "#334155", fontSize: 12, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 14px 16px", background: sc.bg }}>
          <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>{factor.detail}</p>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: "#475569", background: "#0f172a", padding: "2px 8px", borderRadius: 4 }}>
              Category: {factor.category}
            </span>
            <span style={{ fontSize: 10, color: "#475569", background: "#0f172a", padding: "2px 8px", borderRadius: 4 }}>
              Weight: {factor.weight}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Improvement action card ──────────────────────────────────────────────── //

function ActionCard({ action, rank }: { action: ImprovementAction; rank: number }) {
  const [open, setOpen] = useState(false);
  const diffColor = DIFFICULTY_COLOR[action.difficulty] ?? "#94a3b8";
  const tfColor = TIMEFRAME_COLOR[action.timeframe] ?? "#94a3b8";

  return (
    <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 9, overflow: "hidden", marginBottom: 10 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left" }}
      >
        {/* Rank */}
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {rank}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>{action.title}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 8px", borderRadius: 4 }}>
              +{action.potential_gain} pts potential
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: tfColor, background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 4 }}>
              {action.timeframe}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: diffColor, background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 4 }}>
              {action.difficulty}
            </span>
          </div>
        </div>

        <span style={{ color: "#334155", fontSize: 14, flexShrink: 0, marginTop: 4, transform: open ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 14px 56px", borderTop: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginTop: 12, marginBottom: 6 }}>HOW TO IMPROVE</div>
          <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>{action.how}</p>
        </div>
      )}
    </div>
  );
}

// ─── Valuation tab ───────────────────────────────────────────────────────── //

function fmtM(v: number): string {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(2)}m`;
  if (v >= 1_000) return `£${(v / 1_000).toFixed(0)}k`;
  return `£${v.toLocaleString()}`;
}

function MultipleBracket({ low, mid, high, label, dimColor }: { low: number; mid: number; high: number; label: string; dimColor: string }) {
  return (
    <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>LOW</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#94a3b8" }}>{low.toFixed(1)}×</div>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>MID</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: dimColor, lineHeight: 1 }}>{mid.toFixed(1)}×</div>
          <div style={{ fontSize: 9, color: "#334155", marginTop: 2 }}>POINT ESTIMATE</div>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>HIGH</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#94a3b8" }}>{high.toFixed(1)}×</div>
        </div>
      </div>
    </div>
  );
}

function ValuationTab({ val, creditBand, p }: { val: ValuationEstimate | null; creditBand: string; p: { arc: string; dim: string } }) {
  if (!val) {
    return (
      <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8 }}>No valuation data</div>
        <div style={{ fontSize: 12, color: "#334155" }}>Valuation estimate could not be generated.</div>
      </div>
    );
  }

  const hasEV = val.ev_low != null && val.ev_mid != null && val.ev_high != null;
  const adjDir = val.total_adjustment_pct > 0 ? "premium" : val.total_adjustment_pct < 0 ? "discount" : "inline";
  const adjColor = val.total_adjustment_pct > 0 ? "#22c55e" : val.total_adjustment_pct < 0 ? "#ef4444" : "#94a3b8";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader
        title={`${val.sector_label} — Valuation Estimate`}
        sub={`Credit-adjusted EV/SDE multiple · Band ${creditBand}`}
      />

      {/* Net adjustment callout */}
      <div style={{
        background: val.total_adjustment_pct >= 0 ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
        border: `1px solid ${val.total_adjustment_pct >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
        borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", marginBottom: 2 }}>NET ADJUSTMENT</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: adjColor, lineHeight: 1 }}>
            {val.total_adjustment_pct > 0 ? "+" : ""}{val.total_adjustment_pct.toFixed(0)}%
          </div>
        </div>
        <div style={{ flex: 1, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
          This company trades at a <strong style={{ color: adjColor }}>{Math.abs(val.total_adjustment_pct).toFixed(0)}% {adjDir}</strong> to
          the {val.sector_label} sector baseline of <strong style={{ color: "#f1f5f9" }}>{val.base_multiple_mid.toFixed(1)}×</strong>,
          driven by credit quality, governance, and ownership structure signals.
        </div>
      </div>

      {/* Base vs adjusted multiples */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <MultipleBracket
          low={val.base_multiple_low} mid={val.base_multiple_mid} high={val.base_multiple_high}
          label="BASE SECTOR MULTIPLE (UNADJUSTED)"
          dimColor="#475569"
        />
        <div style={{ textAlign: "center", fontSize: 10, color: "#334155" }}>▼ credit &amp; governance adjustment applied ▼</div>
        <MultipleBracket
          low={val.adjusted_multiple_low} mid={val.adjusted_multiple_mid} high={val.adjusted_multiple_high}
          label="CREDIT-ADJUSTED MULTIPLE"
          dimColor={p.arc}
        />
      </div>

      {/* EV range — only if earnings were provided */}
      {hasEV && val.ev_low != null && val.ev_mid != null && val.ev_high != null && (
        <div style={{ background: "#0a0f1e", border: `1px solid ${p.arc}33`, borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: 12 }}>
            ESTIMATED ENTERPRISE VALUE · BASED ON {val.earnings_label?.toUpperCase()} OF {fmtM(val.earnings_used!)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>CONSERVATIVE</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#94a3b8" }}>{fmtM(val.ev_low)}</div>
              <div style={{ fontSize: 9, color: "#334155" }}>{val.adjusted_multiple_low.toFixed(1)}× {val.earnings_label}</div>
            </div>
            <div style={{ textAlign: "center", borderLeft: "1px solid #1e293b", borderRight: "1px solid #1e293b", padding: "0 12px" }}>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>CENTRAL</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: p.arc, lineHeight: 1 }}>{fmtM(val.ev_mid)}</div>
              <div style={{ fontSize: 9, color: "#334155", marginTop: 3 }}>{val.adjusted_multiple_mid.toFixed(1)}× {val.earnings_label}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>OPTIMISTIC</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#94a3b8" }}>{fmtM(val.ev_high)}</div>
              <div style={{ fontSize: 9, color: "#334155" }}>{val.adjusted_multiple_high.toFixed(1)}× {val.earnings_label}</div>
            </div>
          </div>
        </div>
      )}

      {!hasEV && (
        <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", marginBottom: 4 }}>Enterprise value not calculated</div>
          <div style={{ fontSize: 11, color: "#6366f1" }}>
            Paste an Information Memorandum with net profit or SDE figures to unlock the full EV estimate range.
          </div>
        </div>
      )}

      {/* Adjustment waterfall */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 10 }}>ADJUSTMENT WATERFALL</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {val.adjustments.map((adj: ValuationAdjustment, i: number) => (
            <div key={i} style={{
              background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 8,
              padding: "10px 14px", display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <span style={{
                fontSize: 11, fontWeight: 800, minWidth: 52, textAlign: "right", flexShrink: 0,
                color: adj.direction === "positive" ? "#22c55e" : adj.direction === "negative" ? "#ef4444" : "#94a3b8",
              }}>
                {adj.pct > 0 ? "+" : ""}{adj.pct.toFixed(0)}%
              </span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>{adj.factor}</div>
                <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.5 }}>{adj.note}</div>
              </div>
            </div>
          ))}
          {/* Running total */}
          <div style={{
            background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8,
            padding: "10px 14px", display: "flex", gap: 12, alignItems: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 900, minWidth: 52, textAlign: "right", flexShrink: 0, color: adjColor }}>
              {val.total_adjustment_pct > 0 ? "+" : ""}{val.total_adjustment_pct.toFixed(0)}%
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc" }}>Net adjustment → {val.adjusted_multiple_mid.toFixed(1)}× mid multiple</span>
          </div>
        </div>
      </div>

      {/* Valuation note */}
      <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 8 }}>ANALYST NOTE</div>
        <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.65, margin: 0 }}>{val.valuation_note}</p>
      </div>

      {/* Methodology */}
      <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 8 }}>METHODOLOGY</div>
        <p style={{ fontSize: 10, color: "#475569", lineHeight: 1.65, margin: 0 }}>{val.methodology}</p>
        <div style={{ fontSize: 9, color: "#334155", marginTop: 10, paddingTop: 8, borderTop: "1px solid #1e293b" }}>
          ⚠ This estimate is indicative only and does not constitute a formal valuation. Always commission a qualified accountant or M&amp;A adviser for deal pricing.
        </div>
      </div>
    </div>
  );
}

// ─── Credit limit breakdown tab ───────────────────────────────────────────── //

function StepRow({ step, label, value, formula, highlight }: { step: number; label: string; value: string; formula?: string; highlight?: boolean }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 12, alignItems: "flex-start",
      padding: "12px 14px",
      background: highlight ? "rgba(99,102,241,0.08)" : "#0a0f1e",
      border: `1px solid ${highlight ? "rgba(99,102,241,0.25)" : "#1e293b"}`,
      borderRadius: 8, marginBottom: 6,
    }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: highlight ? "#4f46e5" : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: highlight ? "#fff" : "#475569", flexShrink: 0 }}>
        {step}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{label}</div>
        {formula && <div style={{ fontSize: 10, color: "#475569", marginTop: 3, fontFamily: "monospace" }}>{formula}</div>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: highlight ? "#a5b4fc" : "#94a3b8", whiteSpace: "nowrap", textAlign: "right" }}>{value}</div>
    </div>
  );
}

function CreditLimitTab({ breakdown, p }: { breakdown: CreditLimitBreakdown | null; p: { arc: string; dim: string } }) {
  if (!breakdown) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#475569", fontSize: 13 }}>
        Credit limit breakdown not available for this profile.
      </div>
    );
  }

  const b = breakdown;
  const earningsProvided = b.earnings_used > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader
        title="Credit Limit Calculation"
        sub="Step-by-step derivation of the recommended trade credit limit"
      />

      {/* Result banner */}
      <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", letterSpacing: "0.1em", marginBottom: 8 }}>RECOMMENDED TRADE CREDIT LIMIT</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#a5b4fc", letterSpacing: "-0.03em" }}>
          {fmtM(b.conservative_limit)}
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
          Conservative limit · up to {fmtM(b.max_limit)} maximum
        </div>
      </div>

      {/* Step-by-step */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 10 }}>CALCULATION STEPS</div>

        <StepRow
          step={1}
          label="Age-Based Baseline"
          value={fmtM(b.age_base)}
          formula={`£3,000 + (${Math.round((b.age_base - 3000) / 3000)} yrs × £3,000) = ${fmtM(b.age_base)}`}
        />

        {earningsProvided ? (
          <StepRow
            step={2}
            label={`Earnings Baseline (${b.earnings_label})`}
            value={fmtM(b.earnings_base)}
            formula={`${fmtM(b.earnings_used)} earnings × 25% (3-month buffer) = ${fmtM(b.earnings_base)}`}
          />
        ) : (
          <StepRow
            step={2}
            label="Earnings Baseline"
            value="No data"
            formula="No SDE or net profit provided — age baseline used"
          />
        )}

        <StepRow
          step={3}
          label="Base (higher of age or earnings)"
          value={fmtM(b.base_before_multipliers)}
          formula={`max(${fmtM(b.age_base)}, ${fmtM(b.earnings_base)}) = ${fmtM(b.base_before_multipliers)}`}
        />

        <StepRow
          step={4}
          label="Charge Multiplier"
          value={`×${b.charge_multiplier.toFixed(3)}`}
          formula={`1.0 − (${b.charges_count} charges × 0.20) = ${b.charge_multiplier.toFixed(3)}`}
        />

        <StepRow
          step={5}
          label="Credit Score Multiplier"
          value={`×${b.score_multiplier.toFixed(3)}`}
          formula={`(${b.credit_score} ÷ 100)^1.3 = ${b.score_multiplier.toFixed(3)} (convex — high scores earn proportionally more)`}
        />

        <StepRow
          step={6}
          label="Raw Limit"
          value={fmtM(b.raw_limit)}
          formula={`${fmtM(b.base_before_multipliers)} × ${b.charge_multiplier.toFixed(3)} × ${b.score_multiplier.toFixed(3)} = ${fmtM(b.raw_limit)}`}
        />

        <StepRow
          step={7}
          label="Ceiling Cap Applied"
          value={fmtM(b.ceiling_applied)}
          formula={earningsProvided ? `max(£500k, ${fmtM(b.earnings_used)} × 2.5) = ${fmtM(b.ceiling_applied)}` : "£250,000 (no earnings data)"}
        />

        <StepRow
          step={8}
          label="Conservative Limit (final)"
          value={fmtM(b.conservative_limit)}
          formula={`min(raw, ceiling) = ${fmtM(b.conservative_limit)}, floored at £500`}
          highlight
        />

        <StepRow
          step={9}
          label="Maximum Limit"
          value={fmtM(b.max_limit)}
          formula={`Conservative × 2.5 = ${fmtM(b.max_limit)}`}
        />
      </div>

      {/* Key inputs summary */}
      <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 10 }}>KEY INPUTS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Credit Score", value: `${b.credit_score} / 100` },
            { label: "Registered Charges", value: b.charges_count === 0 ? "None" : `${b.charges_count}` },
            { label: "Earnings Source", value: b.earnings_label },
            { label: "Earnings Used", value: b.earnings_used > 0 ? fmtM(b.earnings_used) : "Not provided" },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", marginBottom: 3 }}>{item.label.toUpperCase()}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 10, color: "#334155", lineHeight: 1.6, padding: "10px 14px", background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 8 }}>
        ⚠ This is a trade credit recommendation for suppliers and counterparties, not an acquisition financing limit.
        The limit scales with business earnings and is reduced by outstanding debt charges and lower credit scores.
        Provide SDE or net profit to improve accuracy.
      </div>
    </div>
  );
}

// ─── Main drawer ──────────────────────────────────────────────────────────── //

export function CreditReportDrawer({ isOpen, onClose, profile, companyName, companyNumber }: Props) {
  const [tab, setTab] = useState<"overview" | "breakdown" | "indicators" | "improvements" | "valuation" | "credit-limit" | "sources">("overview");
  const p = PALETTE[profile.risk_color];
  const bandInfo = BAND_EXPLAIN[profile.credit_band] ?? { color: "#94a3b8", description: "" };

  // Sort improvements by potential gain desc
  const sortedActions = [...profile.improvement_actions].sort((a, b) => b.potential_gain - a.potential_gain);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = "hidden"; setTab("overview"); }
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const enrichment = profile.enrichment as Record<string, unknown> | null | undefined;
  const sourceCount = (profile.data_sources_used ?? []).length;

  const TABS = [
    { id: "overview",     label: "Overview" },
    { id: "breakdown",    label: "Score Breakdown" },
    { id: "indicators",   label: "Indicators" },
    { id: "improvements", label: "Improvements" + (sortedActions.length > 0 ? ` (${sortedActions.length})` : "") },
    { id: "valuation",     label: "Valuation" },
    { id: "credit-limit",  label: "Credit Limit" },
    { id: "sources",       label: "Data Sources" + (sourceCount > 0 ? ` (${sourceCount})` : "") },
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 400, backdropFilter: "blur(2px)" }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(680px, 100vw)",
        background: "#070d18", borderLeft: "1px solid #1e293b",
        zIndex: 401, display: "flex", flexDirection: "column",
        animation: "slideInRight 0.25s ease",
        overflowX: "hidden",
      }}>

        {/* ── Panel header ── */}
        <div style={{ background: "#0a0f1e", borderBottom: "1px solid #1e293b", padding: "16px 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.12em", marginBottom: 4 }}>
                CREDIT REPORT · COMPANIES HOUSE DATA
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", marginBottom: 2 }}>{companyName}</div>
              <div style={{ fontSize: 11, color: "#475569" }}>Company #{companyNumber} · Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1e293b", color: "#64748b", cursor: "pointer", borderRadius: 7, padding: "6px 10px", fontSize: 16, lineHeight: 1, flexShrink: 0, transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >✕</button>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 2, marginTop: 14, background: "#0f172a", borderRadius: 8, padding: 3 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: "7px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600,
                  background: tab === t.id ? "#1e293b" : "transparent",
                  color: tab === t.id ? "#f1f5f9" : "#475569",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

          {/* ═══ OVERVIEW ═══ */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Score + band */}
              <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 12, padding: "24px 24px 20px", textAlign: "center" }}>
                <LargeGauge score={profile.open_credit_score} color={profile.risk_color} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: bandInfo.color }}>Band {profile.credit_band}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: p.badgeText, background: p.badge, padding: "3px 10px", borderRadius: 5 }}>
                    {profile.insolvency_risk} RISK
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#64748b", margin: "8px 0 0", lineHeight: 1.6 }}>{bandInfo.description}</p>
              </div>

              {/* 6-up headline grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Credit Score",       value: `${profile.open_credit_score} / 100`, sub: `Top ${100 - profile.score_percentile}% of UK SMEs`, color: p.arc },
                  { label: "Credit Opinion",      value: profile.credit_opinion, sub: profile.credit_band_label, color: ({ Recommend: "#22c55e", Review: "#a5b4fc", Caution: "#f59e0b", Decline: "#ef4444" } as Record<string,string>)[profile.credit_opinion] ?? "#94a3b8" },
                  { label: "Payment Behaviour",   value: profile.payment_behaviour, sub: "Filing compliance proxy", color: "#a5b4fc" },
                  { label: "Trade Credit Limit",  value: fmtGbp(profile.credit_limit_gbp), sub: `Up to ${fmtGbp(profile.max_credit_gbp)}`, color: "#f1f5f9" },
                  { label: "Payment Terms",       value: `Net ${profile.recommended_payment_days} days`, sub: "Recommended maximum", color: "#f1f5f9" },
                  { label: "Industry Risk",       value: profile.industry_risk, sub: profile.industry_label, color: profile.industry_risk === "Low" ? "#22c55e" : profile.industry_risk === "Moderate" ? "#f59e0b" : "#ef4444" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 9, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 4 }}>{item.label.toUpperCase()}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: item.color, fontVariantNumeric: "tabular-nums", marginBottom: 2 }}>{item.value}</div>
                    <div style={{ fontSize: 10, color: "#475569" }}>{item.sub}</div>
                  </div>
                ))}
              </div>

              {/* Credit band legend */}
              <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 18px" }}>
                <SectionHeader title="Credit Band Reference" />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(["A", "B", "C", "D", "E"] as const).map(band => {
                    const info = BAND_EXPLAIN[band];
                    const isCurrent = band === profile.credit_band;
                    return (
                      <div key={band} style={{
                        display: "flex", gap: 12, alignItems: "center", padding: "8px 12px",
                        background: isCurrent ? `${info.color}15` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isCurrent ? info.color + "40" : "transparent"}`,
                        borderRadius: 7,
                      }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: info.color, width: 20, flexShrink: 0 }}>{band}</span>
                        <span style={{ fontSize: 11, color: isCurrent ? "#e2e8f0" : "#64748b", lineHeight: 1.5 }}>{info.description}</span>
                        {isCurrent && <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: info.color, letterSpacing: "0.08em", flexShrink: 0 }}>THIS COMPANY</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Analyst notes */}
              <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 18px" }}>
                <SectionHeader title="Analyst Summary" sub="Automated assessment based on Companies House data" />
                <p style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.75, margin: 0 }}>{profile.analyst_notes}</p>
              </div>

              {/* Methodology */}
              <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 18px" }}>
                <SectionHeader title="Methodology" />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["Data Source", "Companies House free REST API — public data only"],
                    ["Score Range", "0–100 across 6 weighted factors"],
                    ["Update Frequency", "Real-time — refreshed each time you search a company"],
                    ["Limitations", "Based solely on public registry data. Does not reflect bank account behaviour, filed accounts data, or trade payment history. Use alongside commercial credit reference agency reports for lending decisions."],
                    ["Regulatory Note", "This profile is provided for information purposes and does not constitute a regulated credit reference report under the Consumer Credit Act 1974."],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.06em" }}>{k}</span>
                      <span style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ SCORE BREAKDOWN ═══ */}
          {tab === "breakdown" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Score meter bar */}
              <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Total Score</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: p.arc, fontVariantNumeric: "tabular-nums" }}>{profile.open_credit_score} / 100</span>
                </div>
                <div style={{ height: 8, background: "#0f172a", borderRadius: 9999, overflow: "hidden" }}>
                  <div style={{ width: `${profile.open_credit_score}%`, height: "100%", background: `linear-gradient(90deg, #ef4444 0%, #f59e0b 40%, #22c55e 80%)`, borderRadius: 9999, transition: "width 0.8s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "#1e293b" }}>
                  <span>0</span><span>E</span><span>D</span><span>C</span><span>B</span><span>A</span><span>100</span>
                </div>
              </div>

              {/* Factor table */}
              <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
                {/* Table header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 80px 24px", gap: 12, padding: "10px 16px", borderBottom: "1px solid #1e293b", background: "#070d18" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.1em" }}>FACTOR</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.1em" }}>SCORE</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", textAlign: "right" }}>POINTS</span>
                  <span />
                </div>
                {profile.detailed_factors.map(f => <FactorRow key={f.id} factor={f} />)}
              </div>

              {/* What the score means */}
              <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 18px" }}>
                <SectionHeader title="Score Interpretation" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { range: "80–100", band: "A", label: "Very Low Risk", color: "#22c55e" },
                    { range: "60–79",  band: "B", label: "Low Risk",      color: "#4ade80" },
                    { range: "40–59",  band: "C", label: "Moderate Risk", color: "#f59e0b" },
                    { range: "20–39",  band: "D", label: "High Risk",     color: "#f87171" },
                    { range: "0–19",   band: "E", label: "Very High Risk",color: "#ef4444" },
                  ].map(row => (
                    <div key={row.band} style={{
                      display: "flex", gap: 10, alignItems: "center",
                      padding: "8px 12px", borderRadius: 7,
                      background: profile.credit_band === row.band ? `${row.color}12` : "transparent",
                      border: `1px solid ${profile.credit_band === row.band ? row.color + "30" : "transparent"}`,
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: row.color, width: 16 }}>{row.band}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: row.color }}>{row.label}</div>
                        <div style={{ fontSize: 10, color: "#475569" }}>{row.range}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ INDICATORS ═══ */}
          {tab === "indicators" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Positive */}
              {profile.positive_indicators.length > 0 && (
                <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b", background: "rgba(34,197,94,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, color: "#22c55e" }}>✓</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", letterSpacing: "0.1em" }}>POSITIVE INDICATORS ({profile.positive_indicators.length})</span>
                  </div>
                  {profile.positive_indicators.map((ind, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", borderBottom: i < profile.positive_indicators.length - 1 ? "1px solid #0f172a" : "none" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#14532d", color: "#22c55e", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</div>
                      <span style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6 }}>{ind}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Negative */}
              {profile.negative_indicators.length > 0 && (
                <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b", background: "rgba(239,68,68,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, color: "#ef4444" }}>!</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#f87171", letterSpacing: "0.1em" }}>RISK INDICATORS ({profile.negative_indicators.length})</span>
                  </div>
                  {profile.negative_indicators.map((ind, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", borderBottom: i < profile.negative_indicators.length - 1 ? "1px solid #0f172a" : "none" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#7f1d1d", color: "#ef4444", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>!</div>
                      <span style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6 }}>{ind}</span>
                    </div>
                  ))}
                </div>
              )}

              {profile.positive_indicators.length === 0 && profile.negative_indicators.length === 0 && (
                <div style={{ padding: "32px", textAlign: "center", color: "#475569", fontSize: 13 }}>
                  No specific indicators identified from available data.
                </div>
              )}

              {/* Industry context */}
              <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "16px 18px" }}>
                <SectionHeader title="Industry Context" sub={`${profile.industry_label} — ${profile.industry_risk} risk sector`} />
                <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                  The sector modifier ({profile.industry_risk === "Low" ? "positive" : profile.industry_risk === "Very High" ? "strong negative" : "neutral to negative"}) reflects UK insolvency statistics for the {profile.industry_label} industry.
                  {" "}This is a systemic factor that applies regardless of individual company performance.
                  {profile.industry_risk !== "Low" && " Operating in a higher-risk sector means trade creditors should apply shorter payment terms and lower credit limits relative to the company's score alone."}
                </p>
              </div>
            </div>
          )}

          {/* ═══ IMPROVEMENTS ═══ */}
          {tab === "improvements" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sortedActions.length === 0 ? (
                <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "32px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#22c55e", marginBottom: 6 }}>No immediate improvements identified</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>This company scores well across all tracked factors. Continue filing on time and maintaining governance standards.</div>
                </div>
              ) : (
                <>
                  <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", marginBottom: 4 }}>
                      Potential score improvement: +{sortedActions.reduce((s, a) => s + a.potential_gain, 0)} points
                    </div>
                    <div style={{ fontSize: 11, color: "#6366f1" }}>Actions ranked by impact. Expand each for step-by-step guidance.</div>
                  </div>

                  {sortedActions.map((a, i) => <ActionCard key={a.id} action={a} rank={i + 1} />)}

                  <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px", marginTop: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 8 }}>WHAT CANNOT BE IMPROVED QUICKLY</div>
                    <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.7 }}>
                      Company age (contributing up to 25 points) can only be improved over time — 2.5 points per year of trading. Industry risk is a systemic factor tied to SIC codes and does not reflect individual company performance.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {/* ═══ VALUATION ═══ */}
          {tab === "valuation" && (
            <ValuationTab val={profile.valuation ?? null} creditBand={profile.credit_band} p={p} />
          )}

          {/* ═══ CREDIT LIMIT ═══ */}
          {tab === "credit-limit" && (
            <CreditLimitTab breakdown={profile.credit_limit_breakdown ?? null} p={p} />
          )}

          {/* ═══ DATA SOURCES ═══ */}
          {tab === "sources" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <SectionHeader title="External Data Sources" sub="APIs queried to enrich this credit profile" />

              {/* Source list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(profile.data_sources_used ?? ["Companies House"]).map((src) => (
                  <div key={src} style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{src}</span>
                    <span style={{ fontSize: 10, color: "#22c55e", marginLeft: "auto" }}>✓ Queried</span>
                  </div>
                ))}
              </div>

              {/* FCA enrichment */}
              {enrichment && !!((enrichment.fca as Record<string, unknown>)?.checked) && (
                <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 10 }}>FCA FINANCIAL SERVICES REGISTER</div>
                  {(() => {
                    const fca = enrichment.fca as Record<string, unknown>;
                    if (fca.unverifiable) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <span style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)", color: "#fcd34d", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, display: "inline-block", width: "fit-content" }}>UNVERIFIED</span>
                          <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                            FCA status could not be checked — API credentials not configured.
                            Register at <span style={{ color: "#6366f1" }}>register.fca.org.uk/developer</span> and set <code style={{ color: "#a5b4fc", fontSize: 10 }}>FCA_API_EMAIL</code> + <code style={{ color: "#a5b4fc", fontSize: 10 }}>FCA_API_KEY</code> in your backend environment.
                          </div>
                        </div>
                      );
                    }
                    if (fca.is_authorised) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>FCA AUTHORISED</span>
                            {!!(fca.status) && <span style={{ fontSize: 11, color: "#94a3b8" }}>{String(fca.status)}</span>}
                          </div>
                          {!!(fca.firm_reference_number) && (
                            <div style={{ fontSize: 11, color: "#475569" }}>FRN: {String(fca.firm_reference_number)}</div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ background: "rgba(100,116,139,0.10)", border: "1px solid #1e293b", color: "#64748b", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, display: "inline-block", width: "fit-content" }}>NOT FOUND</span>
                        <div style={{ fontSize: 11, color: "#475569" }}>No matching firm found on the FCA Financial Services Register via name/CH number search.</div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* PSC enrichment */}
              {enrichment && enrichment.psc != null && (
                <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 10 }}>PSC OWNERSHIP REGISTER</div>
                  {(() => {
                    const psc = enrichment.psc as Record<string, unknown>;
                    const names = (psc.psc_names as string[] | undefined) ?? [];
                    const pscCount = Number(psc.active_psc_count) || 0;
                    const concentration = String(psc.concentration_risk);
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          <strong style={{ color: "#f1f5f9" }}>{pscCount}</strong> active PSC{pscCount !== 1 ? "s" : ""} registered
                          {" · "}Concentration: <strong style={{ color: concentration === "Low" ? "#22c55e" : concentration === "High" ? "#ef4444" : "#f59e0b" }}>{concentration}</strong>
                        </div>
                        {psc.has_offshore_psc === true && <div style={{ fontSize: 10, color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4, padding: "3px 8px" }}>⚠ Offshore PSC detected</div>}
                        {psc.has_corporate_psc === true && <div style={{ fontSize: 10, color: "#fcd34d", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 4, padding: "3px 8px" }}>Corporate entity PSC</div>}
                        {names.length > 0 && (
                          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                            {names.map((n: string, i: number) => <div key={i} style={{ padding: "2px 0" }}>· {n}</div>)}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Postcode enrichment */}
              {enrichment && !!((enrichment.postcode as Record<string, unknown>)?.checked) && !!((enrichment.postcode as Record<string, unknown>).region) && (
                <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 10 }}>GEOGRAPHIC ANALYSIS (POSTCODES.IO)</div>
                  {(() => {
                    const pc = enrichment.postcode as Record<string, unknown>;
                    const imdDecile = pc.imd_decile != null ? Number(pc.imd_decile) : null;
                    const deprivLabel = pc.deprivation_label != null ? String(pc.deprivation_label) : null;
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div><div style={{ fontSize: 9, color: "#475569", marginBottom: 2 }}>REGION</div><div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{String(pc.region) || "—"}</div></div>
                        <div><div style={{ fontSize: 9, color: "#475569", marginBottom: 2 }}>COUNTRY</div><div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{String(pc.country) || "—"}</div></div>
                        {imdDecile != null && <div><div style={{ fontSize: 9, color: "#475569", marginBottom: 2 }}>IMD DECILE</div><div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{imdDecile}/10</div></div>}
                        {deprivLabel && <div><div style={{ fontSize: 9, color: "#475569", marginBottom: 2 }}>DEPRIVATION</div><div style={{ fontSize: 12, fontWeight: 600, color: deprivLabel === "Low" ? "#22c55e" : deprivLabel === "Moderate" ? "#f59e0b" : "#ef4444" }}>{deprivLabel}</div></div>}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Director network */}
              {enrichment && !!((enrichment.opencorp as Record<string, unknown>)?.checked) && (
                <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 10 }}>DIRECTOR NETWORK (OPENCORPORATES)</div>
                  {(() => {
                    const oc = enrichment.opencorp as Record<string, unknown>;
                    const flags = (oc.adverse_flags as Array<Record<string, string>> | undefined) ?? [];
                    const checked = Number(oc.directors_checked) || 0;
                    return (
                      <div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
                          {checked} director{checked !== 1 ? "s" : ""} checked ·{" "}
                          {flags.length === 0 ? <span style={{ color: "#22c55e" }}>No adverse associations found</span> : <span style={{ color: "#ef4444" }}>{flags.length} adverse flag{flags.length !== 1 ? "s" : ""}</span>}
                        </div>
                        {flags.map((f, i) => (
                          <div key={i} style={{ fontSize: 10, color: "#fca5a5", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 4, padding: "4px 8px", marginBottom: 4 }}>
                            {f.director_name} → {f.associated_company} ({f.status})
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* VAT */}
              {enrichment && !!((enrichment.vat as Record<string, unknown>)?.vat_number_provided) && (
                <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 10 }}>HMRC VAT REGISTER</div>
                  {(() => {
                    const vat = enrichment.vat as Record<string, unknown>;
                    const bizName = vat.business_name != null ? String(vat.business_name) : null;
                    const addr = vat.address != null ? String(vat.address) : null;
                    return !!(vat.is_registered) ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, display: "inline-block", width: "fit-content" }}>VAT REGISTERED</span>
                        {bizName && <div style={{ fontSize: 11, color: "#94a3b8" }}>{bizName}</div>}
                        {addr && <div style={{ fontSize: 10, color: "#475569" }}>{addr}</div>}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "#475569" }}>VAT number not found on HMRC register</div>
                    );
                  })()}
                </div>
              )}

              {/* Errors */}
              {enrichment && ((enrichment.enrichment_errors as string[] | undefined) ?? []).length > 0 && (
                <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", marginBottom: 6 }}>API LOOKUP NOTES</div>
                  {((enrichment.enrichment_errors as string[] | undefined) ?? []).map((e: string, i: number) => (
                    <div key={i} style={{ fontSize: 10, color: "#475569", padding: "1px 0" }}>· {e}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ borderTop: "1px solid #1e293b", padding: "12px 24px", flexShrink: 0, background: "#0a0f1e", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 10, color: "#334155", flex: 1 }}>
            Triage Finance Open-Source Credit Engine · Powered by Companies House public data · Not a regulated credit reference report
          </span>
          <button
            onClick={onClose}
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", cursor: "pointer", borderRadius: 7, padding: "7px 16px", fontSize: 12, fontWeight: 600 }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
