"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GlossaryTerm } from "@/app/components/GlossaryTerm";
import { CreditMemoDrawer } from "@/app/components/CreditMemoDrawer";
import { LenderFunnelModal } from "@/app/components/LenderFunnelModal";
import { EmailCaptureModal } from "@/app/components/EmailCaptureModal";
import { useDealStore } from "../DealContext";
import { useSubscription } from "@/app/components/SubscriptionContext";
import { useSession } from "next-auth/react";
import { Lock } from "lucide-react";
import { CompanySearch, CompanyDetails, Officer, PSCEntry } from "@/app/components/CompanySearch";
import { ForensicAuditPanel, ReconciliationResult } from "@/app/components/ForensicAuditPanel";
import { CreditProfileBadge, CreditProfile, ValuationEstimate } from "@/app/components/CreditProfileBadge";
import { CreditReportDrawer } from "@/app/components/CreditReportDrawer";
import { AcquisitionInsightsCard } from "@/app/components/AcquisitionInsightsCard";
import { PremiumGate } from "@/app/components/PremiumGate";
import type { RegistryDataForMemo } from "@/app/components/CreditMemoDrawer";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ExtractedDeal {
  asking_price: number | null;
  turnover: number | null;
  net_profit: number | null;
  add_backs: number | null;
  lease_years_remaining: number | null;
  business_type: string | null;
  location: string | null;
  raw_confidence: "low" | "medium" | "high";
}

interface DealMetrics {
  sde: number;
  valuation_multiple: number;
  total_acquisition_cost: number;
  acquisition_fees: number;
  buyer_equity_amount: number;
  vendor_finance_amount: number;
  bank_loan_amount: number;
  capital_stack_valid: boolean;
  annual_bank_debt_service: number;
  monthly_bank_payment: number;
  annual_vendor_service: number;
  total_annual_debt_service: number;
  corp_tax_charge: number;
  levered_fcf: number;
  dscr: number;
  dscr_band: "strong" | "acceptable" | "marginal" | "unbankable";
  dscr_warning: boolean;
  equity_irr: number;
  coc_roi: number;
}

interface TerminalLine { tag: string; text: string; color: string; }

/* ─── Constants ──────────────────────────────────────────────────────────── */

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const SAMPLE = `Asking Price: £450,000
Turnover: £820,000
Net Profit: £120,000
Normalized Adjustments: Owner salary £55,000, one-off legal costs £8,000
Lease: 7 years remaining on commercial premises
Location: Manchester
Business type: Engineering consultancy, B2B contracts`;

const SAMPLE_EXTRACTED: ExtractedDeal = {
  asking_price: 450000, turnover: 820000, net_profit: 120000, add_backs: 63000,
  lease_years_remaining: 7, business_type: "Engineering consultancy", location: "Manchester",
  raw_confidence: "high",
};

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt = (n: number | null | undefined): string => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}m`;
  if (Math.abs(n) >= 1_000)     return `£${(n / 1_000).toFixed(0)}k`;
  return `£${n.toFixed(0)}`;
};

const fmtPct = (n: number | null | undefined): string => {
  if (n == null || !isFinite(n) || isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
};

function buildScript(d: ExtractedDeal): TerminalLine[] {
  return [
    { tag: "SCANNING",   text: "Reading listing structure…",                                                   color: "#a8a29e" },
    { tag: "ANALYSING",  text: "Extracting core financials…",                                                  color: "#a5b4fc" },
    { tag: "EXTRACTED",  text: `Turnover: ${fmt(d.turnover)}  |  Net Profit: ${fmt(d.net_profit)}`,           color: "#d6d3d1" },
    { tag: "PARSING",    text: "Normalising owner adjustments & lease data…",                                  color: "#a8a29e" },
    { tag: "CALCUL.",    text: "Projecting 5-yr SDE amortisation models…",                                     color: "#a5b4fc" },
    { tag: "VERIFIED",   text: `Normalized Adj: ${fmt(d.add_backs)}  |  Confidence: ${d.raw_confidence.toUpperCase()}`, color: "#d6d3d1" },
    { tag: "SUCCESS",    text: "Triage workspace populated.",                                                  color: "#34d399" },
  ];
}

function buildFileScript(filename: string): TerminalLine[] {
  return [
    { tag: "READING",    text: `Parsing uploaded document: ${filename}`,      color: "#a8a29e" },
    { tag: "IDENTIFYING",text: "Scanning financial tables and key metrics…",   color: "#a5b4fc" },
    { tag: "EXTRACTING", text: "Processing income statements…",                color: "#a8a29e" },
    { tag: "NORMALISING",text: "Calibrating owner adjustment figures…",        color: "#a5b4fc" },
    { tag: "EXTRACTED",  text: "Successfully pulled financial historicals.",   color: "#d6d3d1" },
    { tag: "SUCCESS",    text: "Triage workspace populated from document.",    color: "#34d399" },
  ];
}

/* ─── Deal viability score ───────────────────────────────────────────────── */

function viabilityScore(dscr: number): "strong" | "acceptable" | "marginal" | "unbankable" {
  if (dscr >= 1.50) return "strong";
  if (dscr >= 1.25) return "acceptable";
  if (dscr >= 1.10) return "marginal";
  return "unbankable";
}

const VIABILITY = {
  strong:     { label: "STRONG",     color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", dot: "#22c55e", text: "Excellent. High-street banks (HSBC, Barclays, Lloyds) will actively compete for this deal." },
  acceptable: { label: "ACCEPTABLE", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", dot: "#06b6d4", text: "Bankable. Meets standard 1.25× lender minimum. Specialist SME lenders will fund this." },
  marginal:   { label: "MARGINAL",   color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", text: "Below mainstream lender appetite. Higher equity or vendor finance required." },
  unbankable: { label: "UNBANKABLE", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#ef4444", text: "High risk. Try increasing vendor finance or buyer equity to improve DSCR above 1.25×." },
};

/* ─── Editable title ─────────────────────────────────────────────────────── */

function EditableTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef              = useRef<HTMLInputElement>(null);
  const committedRef          = useRef(false);

  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  // Call focus() synchronously in the click handler (before React re-renders)
  // so iOS treats it as within the user gesture and opens the keyboard.
  const startEditing = () => {
    committedRef.current = false;
    setDraft(value);
    setEditing(true);
    // input is always in DOM (visibility toggled), so focus() works immediately
    requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.select(); });
  };

  const commit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    onChange(draft.trim() || value);
    setEditing(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* Title — hidden while editing */}
      {!editing && (
        <h1
          onClick={startEditing}
          style={{ fontSize: 20, fontWeight: 800, color: "#1c1917", margin: 0, letterSpacing: "-0.02em", cursor: "pointer" }}
          title="Tap to rename"
        >
          {value}
        </h1>
      )}
      {/* Input — always mounted so focus() works synchronously on iOS */}
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        style={{
          display: editing ? "block" : "none",
          fontSize: 20, fontWeight: 800, color: "#1c1917",
          background: "#e7e5e4", border: "1.5px solid #1c1917",
          borderRadius: 6, padding: "4px 10px", outline: "none",
          fontFamily: "inherit", letterSpacing: "-0.02em",
          width: "100%", maxWidth: 420, minWidth: 160,
          WebkitAppearance: "none",
        }}
      />
      {!editing && (
        <button
          onClick={startEditing}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#a8a29e", display: "flex", alignItems: "center", flexShrink: 0 }}
          title="Rename deal"
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ─── Terminal component ─────────────────────────────────────────────────── */

function Terminal({ lines, active }: { lines: TerminalLine[]; active: boolean }) {
  return (
    <div className="terminal-window">
      <div className="terminal-chrome">
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ marginLeft: 10, fontSize: 11, color: "#6c7086", fontFamily: "monospace" }}>extraction engine — running</span>
        {active && (
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#a5b4fc" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a5b4fc", display: "inline-block", animation: "blink 1s step-end infinite" }} />
            live
          </span>
        )}
      </div>
      <div className="terminal-body">
        {lines.map((l, i) => (
          <div key={i} className="terminal-line" style={{ display: "flex", gap: 14 }}>
            <span style={{ color: "#6c7086", minWidth: 90, flexShrink: 0 }}>[{l.tag}]</span>
            <span style={{ color: l.color }}>{l.text}</span>
          </div>
        ))}
        {active && lines.length < 7 && (
          <div style={{ display: "flex", gap: 14 }}>
            <span style={{ color: "#6c7086", minWidth: 90, flexShrink: 0 }}>
              {["[READING]", "[IDENTIFYING]", "[EXTRACTING]", "[NORMALISING]", "[EXTRACTED]", "[SUCCESS]"][lines.length] ?? ""}
            </span>
            <span style={{ color: "#a8a29e" }} className="cursor-blink" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Precision slider — fully custom, no native input ──────────────────── */

function KSlider({ label, value, onChange, color }: {
  label: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const snap = (raw: number) => Math.round(Math.max(0, Math.min(100, raw)) / 5) * 5;

  const pctFromEvent = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    return snap(((clientX - rect.left) / rect.width) * 100);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    onChange(pctFromEvent(e.clientX));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    onChange(pctFromEvent(e.touches[0].clientX));
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => onChange(pctFromEvent(e.clientX));
    const onTouchMove = (e: TouchEvent) => onChange(pctFromEvent(e.touches[0].clientX));
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const active = dragging || hovered;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, userSelect: "none" }}>
      {/* Label row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: "var(--muted)",
          textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 14, fontWeight: 800, color,
          fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
          minWidth: 38, textAlign: "right",
        }}>
          {value}%
        </span>
      </div>

      {/* Track hit-zone — tall for easy pointer capture */}
      <div
        ref={trackRef}
        role="slider"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!dragging) setHovered(false); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(snap(value + 5));
          if (e.key === "ArrowLeft"  || e.key === "ArrowDown") onChange(snap(value - 5));
        }}
        style={{
          position: "relative", height: 20, cursor: dragging ? "grabbing" : "pointer",
          display: "flex", alignItems: "center",
          outline: "none",
        }}
      >
        {/* Track */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 4, borderRadius: 9999,
          overflow: "visible",
        }}>
          {/* Unfilled */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 9999,
            background: "var(--border)",
          }} />
          {/* Filled */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: 0,
            width: `${value}%`, borderRadius: 9999,
            background: color,
            transition: dragging ? "none" : "width 0.08s ease",
          }} />
        </div>

        {/* Thumb — clamped so it never clips outside track edges */}
        <div style={{
          position: "absolute",
          left: `clamp(9px, ${value}%, calc(100% - 9px))`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: active ? 20 : 18,
          height: active ? 20 : 18,
          borderRadius: "50%",
          background: dragging ? color : "var(--surface)",
          border: `2px solid ${color}`,
          // white separation ring + colored glow when active
          boxShadow: dragging
            ? `0 0 0 3px var(--surface), 0 0 0 5px ${color}40`
            : active
            ? `0 0 0 3px var(--surface), 0 0 0 5px ${color}25, 0 1px 4px rgba(0,0,0,0.10)`
            : `0 0 0 3px var(--surface), 0 1px 3px rgba(0,0,0,0.12)`,
          transition: "width 0.12s ease, height 0.12s ease, box-shadow 0.12s ease, background 0.12s ease",
          pointerEvents: "none",
          zIndex: 1,
        }} />
      </div>

      {/* Tick marks */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: -4 }}>
        {[0, 25, 50, 75, 100].map(t => (
          <span key={t} style={{ fontSize: 10, color: "var(--muted)", fontVariantNumeric: "tabular-nums", opacity: 0.6 }}>
            {t}%
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Metric card ────────────────────────────────────────────────────────── */

function MetricCard({ label, value, sub, variant }: {
  label: React.ReactNode; value: string; sub?: string; variant?: "success" | "danger" | "amber" | "default";
}) {
  const colors = {
    success: { bg: "var(--success-bg)", border: "var(--success-border)", text: "var(--success)" },
    danger:  { bg: "var(--danger-bg)",  border: "var(--danger-border)",  text: "var(--danger)" },
    amber:   { bg: "#fffbeb",           border: "#fde68a",               text: "#d97706" },
    default: { bg: "#ffffff",           border: "var(--border)",         text: "var(--text)" },
  };
  const c = colors[variant ?? "default"];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "16px 18px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.10em", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: c.text, margin: "0 0 3px", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{sub}</p>}
    </div>
  );
}

/* ─── DSCR banner ────────────────────────────────────────────────────────── */

function DSCRBanner({ dscr, warn }: { dscr: number; warn: boolean }) {
  return (
    <div className={warn ? "pulse-danger" : "pulse-success"} style={{
      background: warn ? "var(--danger-bg)" : "var(--success-bg)",
      border: `1px solid ${warn ? "var(--danger-border)" : "var(--success-border)"}`,
      borderRadius: 10, padding: "16px 20px",
      display: "flex", alignItems: "flex-start", gap: 14, transition: "all 0.5s",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: warn ? "#fee2e2" : "#d1fae5",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
      }}>
        {warn ? "⚠️" : "✅"}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: warn ? "var(--danger)" : "var(--success)", fontVariantNumeric: "tabular-nums" }}>
            {dscr === Infinity ? "∞" : dscr.toFixed(2)}×
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: warn ? "var(--danger)" : "var(--success)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <GlossaryTerm term="DSCR" />
          </span>
        </div>
        <p style={{ fontSize: 13, color: warn ? "#991b1b" : "#065f46", margin: 0, lineHeight: 1.5 }}>
          {warn ? "Below the 1.25× UK lender threshold. Reduce bank debt or increase SDE." : "Clears the 1.25× threshold. This deal should pass initial lender screens."}
        </p>
      </div>
    </div>
  );
}

/* ─── Sector multiple table ─────────────────────────────────────────────── */

// Each source provides a low/mid/high SDE multiple range for a sector.
// Sources: BVR (Business Valuation Resources), IBBA (Int'l Business Brokers),
//          Plimsoll Analytics, Daltons Business (UK market data).

interface SectorBand { low: number; mid: number; high: number; }
interface SourceEntry { source: string; abbrev: string; band: SectorBand; }

const SECTOR_MULTIPLES: Record<string, SourceEntry[]> = {
  automotive: [
    { source: "BVR / BIZCOMPS",           abbrev: "BVR",     band: { low: 2.0, mid: 2.8, high: 3.8 } },
    { source: "IBBA Market Pulse",         abbrev: "IBBA",    band: { low: 1.8, mid: 2.6, high: 3.5 } },
    { source: "Plimsoll Analytics (UK)",   abbrev: "Plimsoll",band: { low: 2.2, mid: 3.0, high: 4.0 } },
    { source: "Daltons Business (UK)",     abbrev: "Daltons", band: { low: 1.5, mid: 2.5, high: 3.5 } },
  ],
  technology: [
    { source: "BVR / BIZCOMPS",           abbrev: "BVR",     band: { low: 3.5, mid: 5.0, high: 7.5 } },
    { source: "IBBA Market Pulse",         abbrev: "IBBA",    band: { low: 3.0, mid: 4.5, high: 7.0 } },
    { source: "Plimsoll Analytics (UK)",   abbrev: "Plimsoll",band: { low: 3.5, mid: 5.5, high: 8.0 } },
    { source: "Daltons Business (UK)",     abbrev: "Daltons", band: { low: 3.0, mid: 4.5, high: 6.5 } },
  ],
  professional_services: [
    { source: "BVR / BIZCOMPS",           abbrev: "BVR",     band: { low: 2.5, mid: 3.5, high: 5.0 } },
    { source: "IBBA Market Pulse",         abbrev: "IBBA",    band: { low: 2.2, mid: 3.2, high: 4.8 } },
    { source: "Plimsoll Analytics (UK)",   abbrev: "Plimsoll",band: { low: 2.5, mid: 3.8, high: 5.5 } },
    { source: "Daltons Business (UK)",     abbrev: "Daltons", band: { low: 2.0, mid: 3.0, high: 4.5 } },
  ],
  retail: [
    { source: "BVR / BIZCOMPS",           abbrev: "BVR",     band: { low: 1.5, mid: 2.2, high: 3.0 } },
    { source: "IBBA Market Pulse",         abbrev: "IBBA",    band: { low: 1.2, mid: 2.0, high: 2.8 } },
    { source: "Plimsoll Analytics (UK)",   abbrev: "Plimsoll",band: { low: 1.5, mid: 2.3, high: 3.2 } },
    { source: "Daltons Business (UK)",     abbrev: "Daltons", band: { low: 1.0, mid: 1.8, high: 2.8 } },
  ],
  hospitality: [
    { source: "BVR / BIZCOMPS",           abbrev: "BVR",     band: { low: 1.5, mid: 2.5, high: 3.5 } },
    { source: "IBBA Market Pulse",         abbrev: "IBBA",    band: { low: 1.3, mid: 2.2, high: 3.2 } },
    { source: "Plimsoll Analytics (UK)",   abbrev: "Plimsoll",band: { low: 1.5, mid: 2.5, high: 3.8 } },
    { source: "Daltons Business (UK)",     abbrev: "Daltons", band: { low: 1.2, mid: 2.0, high: 3.0 } },
  ],
  manufacturing: [
    { source: "BVR / BIZCOMPS",           abbrev: "BVR",     band: { low: 2.5, mid: 3.5, high: 5.0 } },
    { source: "IBBA Market Pulse",         abbrev: "IBBA",    band: { low: 2.2, mid: 3.2, high: 4.5 } },
    { source: "Plimsoll Analytics (UK)",   abbrev: "Plimsoll",band: { low: 2.5, mid: 3.8, high: 5.5 } },
    { source: "Daltons Business (UK)",     abbrev: "Daltons", band: { low: 2.0, mid: 3.0, high: 4.5 } },
  ],
  healthcare: [
    { source: "BVR / BIZCOMPS",           abbrev: "BVR",     band: { low: 3.0, mid: 4.5, high: 6.5 } },
    { source: "IBBA Market Pulse",         abbrev: "IBBA",    band: { low: 3.0, mid: 4.2, high: 6.0 } },
    { source: "Plimsoll Analytics (UK)",   abbrev: "Plimsoll",band: { low: 3.2, mid: 4.8, high: 7.0 } },
    { source: "Daltons Business (UK)",     abbrev: "Daltons", band: { low: 2.8, mid: 4.0, high: 5.5 } },
  ],
  construction: [
    { source: "BVR / BIZCOMPS",           abbrev: "BVR",     band: { low: 2.0, mid: 3.0, high: 4.2 } },
    { source: "IBBA Market Pulse",         abbrev: "IBBA",    band: { low: 1.8, mid: 2.8, high: 4.0 } },
    { source: "Plimsoll Analytics (UK)",   abbrev: "Plimsoll",band: { low: 2.0, mid: 3.2, high: 4.5 } },
    { source: "Daltons Business (UK)",     abbrev: "Daltons", band: { low: 1.5, mid: 2.5, high: 3.8 } },
  ],
  ecommerce: [
    { source: "BVR / BIZCOMPS",           abbrev: "BVR",     band: { low: 2.5, mid: 3.8, high: 5.5 } },
    { source: "IBBA Market Pulse",         abbrev: "IBBA",    band: { low: 2.2, mid: 3.5, high: 5.0 } },
    { source: "Plimsoll Analytics (UK)",   abbrev: "Plimsoll",band: { low: 2.5, mid: 4.0, high: 6.0 } },
    { source: "Daltons Business (UK)",     abbrev: "Daltons", band: { low: 2.0, mid: 3.2, high: 5.0 } },
  ],
  general: [
    { source: "BVR / BIZCOMPS",           abbrev: "BVR",     band: { low: 2.0, mid: 3.0, high: 4.5 } },
    { source: "IBBA Market Pulse",         abbrev: "IBBA",    band: { low: 1.8, mid: 2.8, high: 4.2 } },
    { source: "Plimsoll Analytics (UK)",   abbrev: "Plimsoll",band: { low: 2.0, mid: 3.2, high: 4.8 } },
    { source: "Daltons Business (UK)",     abbrev: "Daltons", band: { low: 1.5, mid: 2.5, high: 4.0 } },
  ],
};

// SIC code prefix → sector key
const SIC_TO_SECTOR: [string, string][] = [
  ["451", "automotive"], ["452", "automotive"], ["453", "automotive"], ["454", "automotive"],
  ["47",  "retail"],
  ["55",  "hospitality"], ["56", "hospitality"],
  ["58",  "technology"], ["59", "technology"], ["60", "technology"], ["61", "technology"],
  ["62",  "technology"], ["63", "technology"],
  ["64",  "professional_services"], ["65", "professional_services"], ["66", "professional_services"],
  ["69",  "professional_services"], ["70", "professional_services"], ["71", "professional_services"],
  ["72",  "technology"], ["73", "professional_services"], ["74", "professional_services"],
  ["75",  "professional_services"],
  ["86",  "healthcare"], ["87", "healthcare"], ["88", "healthcare"],
  ["10",  "manufacturing"], ["11", "manufacturing"], ["12", "manufacturing"],
  ["13",  "manufacturing"], ["14", "manufacturing"], ["15", "manufacturing"],
  ["16",  "manufacturing"], ["17", "manufacturing"], ["18", "manufacturing"],
  ["19",  "manufacturing"], ["20", "manufacturing"], ["21", "manufacturing"],
  ["22",  "manufacturing"], ["23", "manufacturing"], ["24", "manufacturing"],
  ["25",  "manufacturing"], ["26", "manufacturing"], ["27", "manufacturing"],
  ["28",  "manufacturing"], ["29", "manufacturing"], ["30", "manufacturing"],
  ["31",  "manufacturing"], ["32", "manufacturing"], ["33", "manufacturing"],
  ["41",  "construction"], ["42", "construction"], ["43", "construction"],
];

const BUSINESS_TYPE_TO_SECTOR: [RegExp, string][] = [
  [/crash|repair|bodyshop|automo|vehicle|car|garage|mot/i, "automotive"],
  [/tech|software|saas|app|digital|it |web|cloud|cyber/i, "technology"],
  [/accountan|legal|consult|architect|engineer|survey|solicitor/i, "professional_services"],
  [/retail|shop|store|ecommerce|e-commerce|amazon|ebay/i, "retail"],
  [/restaurant|cafe|coffee|food|hospitality|hotel|pub|bar|takeaway/i, "hospitality"],
  [/manufactur|factory|production|fabricat/i, "manufacturing"],
  [/health|medical|dental|clinic|pharmacy|care|nurs/i, "healthcare"],
  [/build|construct|plumb|electr|hvac|roofing|landscap/i, "construction"],
];

function detectSector(sicCodes: string[], businessType: string | null): string {
  // Try SIC first
  for (const sic of sicCodes) {
    const code = sic.replace(/\D/g, "");
    for (const [prefix, sector] of SIC_TO_SECTOR) {
      if (code.startsWith(prefix)) return sector;
    }
  }
  // Fallback to business type text
  if (businessType) {
    for (const [re, sector] of BUSINESS_TYPE_TO_SECTOR) {
      if (re.test(businessType)) return sector;
    }
  }
  return "general";
}

const SECTOR_LABELS: Record<string, string> = {
  automotive: "Automotive / Vehicle Repair",
  technology: "Technology / IT Services",
  professional_services: "Professional Services",
  retail: "Retail",
  hospitality: "Hospitality / Food & Beverage",
  manufacturing: "Manufacturing",
  healthcare: "Healthcare / Medical",
  construction: "Construction / Trades",
  ecommerce: "E-commerce / D2C",
  general: "General SME",
};

/* ─── Sector Benchmarks Card ────────────────────────────────────────────── */

function fmtBenchmark(v: number): string {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `£${(v / 1_000).toFixed(0)}k`;
  return `£${v}`;
}

function SectorBenchmarksCard({
  val,
  sde,
  askingPrice,
  hasFinancials,
  lastAccountsDate,
  onViewCreditLimit,
}: {
  val: ValuationEstimate;
  sde: number;
  askingPrice: number;
  hasFinancials: boolean;
  lastAccountsDate: string | null;
  onViewCreditLimit: () => void;
}) {
  const impliedLow = sde > 0 ? Math.round(sde * val.adjusted_multiple_low) : null;
  const impliedMid = sde > 0 ? Math.round(sde * val.adjusted_multiple_mid) : null;
  const impliedHigh = sde > 0 ? Math.round(sde * val.adjusted_multiple_high) : null;

  const priceDelta = impliedMid && askingPrice > 0
    ? ((askingPrice - impliedMid) / impliedMid) * 100
    : null;
  const priceDeltaSign = priceDelta !== null ? (priceDelta > 0 ? "+" : "") : "";

  return (
    <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: "3px solid #1c1917" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" }}>
            Sector Benchmarks
          </h2>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
            {val.sector_label} · from Companies House SIC data
          </p>
        </div>
        {lastAccountsDate && (
          <span style={{ fontSize: 10, fontWeight: 600, color: "#78716c", background: "#e7e5e4", border: "1px solid #d6d3d1", borderRadius: 5, padding: "3px 8px", whiteSpace: "nowrap" }}>
            Accounts to {new Date(lastAccountsDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      {/* Three benchmark columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {/* EV multiple */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#78716c", letterSpacing: "0.09em", marginBottom: 5 }}>EV / SDE MULTIPLE</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1c1917" }}>
            {val.adjusted_multiple_low.toFixed(1)}×–{val.adjusted_multiple_high.toFixed(1)}×
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
            Mid: {val.adjusted_multiple_mid.toFixed(1)}× (credit-adj.)
          </div>
        </div>

        {/* Net margin */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#78716c", letterSpacing: "0.09em", marginBottom: 5 }}>TYPICAL NET MARGIN</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0891b2" }}>
            {(val.sector_net_margin_low ?? 6).toFixed(0)}%–{(val.sector_net_margin_high ?? 15).toFixed(0)}%
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
            of turnover (sector avg)
          </div>
        </div>

        {/* Implied asking price */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#78716c", letterSpacing: "0.09em", marginBottom: 5 }}>IMPLIED ASKING PRICE</div>
          {impliedMid ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#059669" }}>
                {fmtBenchmark(impliedLow!)}–{fmtBenchmark(impliedHigh!)}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                Based on SDE × adjusted multiple
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#a8a29e" }}>Enter profit to calculate</div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                SDE × {val.adjusted_multiple_low.toFixed(1)}×–{val.adjusted_multiple_high.toFixed(1)}×
              </div>
            </>
          )}
        </div>
      </div>

      {/* Price vs benchmark callout */}
      {priceDelta !== null && hasFinancials && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: 7,
          background: Math.abs(priceDelta) <= 15 ? "#f0fdf4" : priceDelta > 15 ? "#fef3c7" : "#f0fdf4",
          border: `1px solid ${Math.abs(priceDelta) <= 15 ? "#a7f3d0" : priceDelta > 15 ? "#fcd34d" : "#a7f3d0"}`,
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 13 }}>
            {Math.abs(priceDelta) <= 15 ? "✅" : priceDelta > 15 ? "⚠️" : "✅"}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: Math.abs(priceDelta) <= 15 ? "#059669" : priceDelta > 15 ? "#92400e" : "#059669" }}>
            Asking price is {priceDeltaSign}{priceDelta.toFixed(1)}% vs sector mid ({fmtBenchmark(impliedMid!)})
            {Math.abs(priceDelta) <= 15 ? " — within normal range." : priceDelta > 15 ? " — above benchmark, negotiate or validate premium." : " — below benchmark, strong value."}
          </span>
        </div>
      )}

      {/* Benchmark explanation row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 10, color: "#a8a29e", margin: 0, lineHeight: 1.5 }}>
          Multiples are credit-score adjusted from base sector range ({val.base_multiple_low.toFixed(1)}×–{val.base_multiple_high.toFixed(1)}×).
          Net margins from UK SME benchmarks (BDO/ICAEW).
        </p>
        <button
          onClick={onViewCreditLimit}
          style={{ fontSize: 10, fontWeight: 600, color: "#1c1917", background: "none", border: "none", cursor: "pointer", padding: 0, whiteSpace: "nowrap", textDecoration: "underline" }}
        >
          View credit limit calc →
        </button>
      </div>
    </div>
  );
}


/* ─── Estimated Valuation Card ──────────────────────────────────────────── */

function EstimatedValuationCard({
  sde,
  askingPrice,
  sicCodes,
  businessType,
}: {
  sde: number;
  askingPrice: number;
  sicCodes: string[];
  businessType: string | null;
}) {
  const sector = detectSector(sicCodes, businessType);
  const sources = SECTOR_MULTIPLES[sector] ?? SECTOR_MULTIPLES.general;
  const sectorLabel = SECTOR_LABELS[sector] ?? "General SME";

  // Per-source implied valuations at mid multiple
  const rows = sources.map(s => ({
    ...s,
    lowVal:  Math.round(sde * s.band.low  / 1000) * 1000,
    midVal:  Math.round(sde * s.band.mid  / 1000) * 1000,
    highVal: Math.round(sde * s.band.high / 1000) * 1000,
  }));

  // Weighted average (equal weight across sources)
  const avgLow  = Math.round(rows.reduce((a, r) => a + r.lowVal,  0) / rows.length / 1000) * 1000;
  const avgMid  = Math.round(rows.reduce((a, r) => a + r.midVal,  0) / rows.length / 1000) * 1000;
  const avgHigh = Math.round(rows.reduce((a, r) => a + r.highVal, 0) / rows.length / 1000) * 1000;
  const avgMultiple = +(rows.reduce((a, r) => a + r.band.mid, 0) / rows.length).toFixed(1);

  const askingVsAvg = askingPrice > 0 ? askingPrice / avgMid : null;
  const priceVerdict =
    askingVsAvg == null ? null :
    askingVsAvg < 0.85  ? { label: "Below Market",  color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" } :
    askingVsAvg < 1.10  ? { label: "Fair Value",    color: "#d97706", bg: "#fffbeb", border: "#fde68a" } :
    askingVsAvg < 1.30  ? { label: "Above Market",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca" } :
                          { label: "Overpriced",    color: "#292524", bg: "#e7e5e4", border: "#d6d3d1" };

  // Bar scale: max of highVal across sources for relative width
  const maxVal = Math.max(...rows.map(r => r.highVal), askingPrice || 0);
  const bar = (v: number) => `${Math.max(2, Math.round((v / maxVal) * 100))}%`;

  const fmtV = (n: number) =>
    n >= 1_000_000 ? `£${(n / 1_000_000).toFixed(2)}m` : `£${(n / 1_000).toFixed(0)}k`;

  return (
    <div className="card" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 3px" }}>
            Estimated Valuation
          </h2>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
            {sectorLabel} · SDE × sector multiple
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          {priceVerdict && (
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
              color: priceVerdict.color, background: priceVerdict.bg,
              border: `1px solid ${priceVerdict.border}`,
              borderRadius: 9999, padding: "3px 10px",
            }}>
              {priceVerdict.label}
            </span>
          )}
        </div>
      </div>

      {/* Market consensus banner */}
      <div style={{
        background: "linear-gradient(135deg, #e7e5e4 0%, #e7e5e4 100%)",
        border: "1px solid #d6d3d1", borderRadius: 10, padding: "14px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 18, flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#1c1917", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 4px" }}>
            Market Consensus Estimate
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#1e1b4b", margin: 0, letterSpacing: "-0.03em" }}>
            {fmtV(avgLow)} – {fmtV(avgHigh)}
          </p>
          <p style={{ fontSize: 12, color: "#1c1917", margin: "2px 0 0" }}>
            Mid-point: <strong>{fmtV(avgMid)}</strong> · avg {avgMultiple}× SDE
          </p>
        </div>
        {askingPrice > 0 && (
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 4px" }}>
              Asking Price
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#1c1917", margin: 0, letterSpacing: "-0.02em" }}>
              {fmtV(askingPrice)}
            </p>
            {askingVsAvg !== null && (
              <p style={{ fontSize: 11, color: priceVerdict?.color ?? "#78716c", margin: "2px 0 0" }}>
                {(askingVsAvg * 100).toFixed(0)}% of mid-point
              </p>
            )}
          </div>
        )}
      </div>

      {/* Per-source rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(r => (
          <div key={r.abbrev}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
                  color: "#1c1917", background: "#e7e5e4", border: "1px solid #d6d3d1",
                  borderRadius: 4, padding: "1px 5px",
                }}>
                  {r.abbrev}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-soft)", fontWeight: 600 }}>
                  {r.source}
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                {r.band.low}–{r.band.high}× · <span style={{ color: "#1c1917" }}>{fmtV(r.midVal)}</span>
              </span>
            </div>
            {/* Range bar */}
            <div style={{ position: "relative", height: 6, background: "#e7e5e4", borderRadius: 9999, overflow: "hidden" }}>
              {/* Low-to-high band */}
              <div style={{
                position: "absolute",
                left: bar(r.lowVal),
                width: `${Math.max(4, Math.round(((r.highVal - r.lowVal) / maxVal) * 100))}%`,
                top: 0, bottom: 0,
                background: "#d6d3d1", borderRadius: 9999,
              }} />
              {/* Mid dot */}
              <div style={{
                position: "absolute",
                left: `calc(${bar(r.midVal)} - 3px)`,
                top: 0, bottom: 0, width: 6,
                background: "#1c1917", borderRadius: 9999,
              }} />
              {/* Asking price marker */}
              {askingPrice > 0 && (
                <div style={{
                  position: "absolute",
                  left: `calc(${bar(askingPrice)} - 1px)`,
                  top: -1, bottom: -1, width: 2,
                  background: "#f59e0b", borderRadius: 9999,
                }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
        {[
          { color: "#d6d3d1", label: "Valuation range" },
          { color: "#1c1917", label: "Mid estimate" },
          ...(askingPrice > 0 ? [{ color: "#f59e0b", label: "Asking price" }] : []),
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
            <span style={{ fontSize: 10, color: "var(--muted)" }}>{label}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 10, color: "#d6d3d1", margin: "12px 0 0", lineHeight: 1.6 }}>
        Multiples based on BVR/BIZCOMPS, IBBA Market Pulse, Plimsoll Analytics and Daltons Business UK data.
        Indicative only — actual value depends on growth trajectory, customer concentration, lease terms and buyer profile.
      </p>
    </div>
  );
}

/* ─── Deal viability scorecard ───────────────────────────────────────────── */

function DealViabilityCard({
  dscr, fcf, onOpenFunnel,
}: { dscr: number; fcf: number; onOpenFunnel: () => void }) {
  const score = viabilityScore(dscr);
  const v = VIABILITY[score];
  const bars = score === "strong" ? 10 : score === "acceptable" ? 7 : score === "marginal" ? 4 : 2;

  return (
    <div style={{
      background: v.bg, border: `1px solid ${v.border}`,
      borderRadius: 12, overflow: "hidden",
    }}>
      {/* Score header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${v.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: v.color, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Deal Viability Score
          </span>
          <span style={{
            fontSize: 11, fontWeight: 800, color: v.color,
            background: "#fff", border: `1.5px solid ${v.border}`,
            borderRadius: 6, padding: "2px 10px", letterSpacing: "0.06em",
          }}>
            {v.label}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: 6, borderRadius: 3,
              background: i < bars ? v.color : "#d6d3d1",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
        <p style={{ fontSize: 13, color: v.color === "#059669" ? "#065f46" : v.color === "#d97706" ? "#92400e" : "#991b1b", margin: 0, fontWeight: 500 }}>
          {v.text}
        </p>
      </div>

      {/* Metrics row */}
      <div style={{ padding: "12px 20px", display: "flex", gap: 20, borderBottom: `1px solid ${v.border}` }}>
        {[
          ["DSCR", `${isFinite(dscr) ? dscr.toFixed(2) : "∞"}×`],
          ["Levered FCF", fmt(fcf) + "/yr"],
        ].map(([l, val]) => (
          <div key={l}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{l}</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: v.color, margin: 0, fontVariantNumeric: "tabular-nums" }}>{val}</p>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
          <span style={{
            width: 10, height: 10, borderRadius: "50%", background: v.dot,
            display: "inline-block", marginRight: 6, flexShrink: 0,
            boxShadow: `0 0 0 3px ${v.dot}30`,
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: v.color }}>
            {score === "strong" ? "Bankable" : score === "marginal" ? "Borderline" : "Restructure needed"}
          </span>
        </div>
      </div>

      {/* CTA */}
      {score !== "unbankable" && (
        <div style={{ padding: "14px 20px" }}>
          <button
            onClick={onOpenFunnel}
            style={{
              width: "100%", background: "#1c1917", color: "#fff",
              border: "none", borderRadius: 9, padding: "12px 0",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.20)",
              transition: "box-shadow 0.2s, background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#1e293b")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1c1917")}>
            🏦 Submit to Approved Lenders
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <p style={{ fontSize: 10, color: "#a8a29e", textAlign: "center", margin: "8px 0 0", lineHeight: 1.5 }}>
            Triage Finance receives a referral commission from lenders on successful origination · No cost to you
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Document drop zone ─────────────────────────────────────────────────── */

function DropZone({ onFile, disabled }: { onFile: (f: File) => void; disabled: boolean }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Unsupported format. Please upload a PDF, Word (.docx), or PowerPoint (.pptx) file.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError("File too large. Maximum size is 30 MB.");
      return;
    }
    onFile(file);
  };

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => !disabled && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#1c1917" : error ? "#dc2626" : "#d6d3d1"}`,
          borderRadius: 12, padding: "36px 24px",
          background: dragging ? "#e7e5e4" : "#fafafa",
          textAlign: "center", cursor: disabled ? "not-allowed" : "pointer",
          transition: "border-color 0.15s, background 0.15s",
          opacity: disabled ? 0.5 : 1,
        }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>
          {dragging ? "📂" : "📄"}
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: dragging ? "#1c1917" : "#44403c", margin: "0 0 6px" }}>
          {dragging ? "Release to upload" : "Drop your IM here"}
        </p>
        <p style={{ fontSize: 12, color: "#a8a29e", margin: "0 0 14px" }}>
          PDF, Word (.docx), or PowerPoint (.pptx) · Max 30 MB
        </p>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#fff", border: "1px solid #d6d3d1",
          borderRadius: 7, padding: "7px 16px",
          fontSize: 13, fontWeight: 600, color: "#475569",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Browse files
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx"
          style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {error && (
        <p style={{ fontSize: 12, color: "#dc2626", margin: "8px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

/* ─── SIC code → sector ─────────────────────────────────────────────────── */

function sicToSector(codes: string[]): string {
  if (!codes?.length) return "";
  const n = parseInt(codes[0], 10);
  if (n >= 1000  && n <= 3999)  return "Agriculture / Fishing";
  if (n >= 5000  && n <= 9999)  return "Mining & Extraction";
  if (n >= 10000 && n <= 33999) return "Manufacturing";
  if (n >= 35000 && n <= 39999) return "Utilities";
  if (n >= 41000 && n <= 43999) return "Construction";
  if (n >= 45000 && n <= 45999) return "Motor Trades";
  if (n >= 46000 && n <= 46999) return "Wholesale";
  if (n >= 47000 && n <= 47999) return "Retail";
  if (n >= 49000 && n <= 53999) return "Transport & Logistics";
  if (n >= 55000 && n <= 56999) return "Hospitality";
  if (n >= 58000 && n <= 63999) return "Technology / Media";
  if (n >= 64000 && n <= 66999) return "Financial Services";
  if (n >= 68000 && n <= 68999) return "Real Estate";
  if (n >= 69000 && n <= 75999) return "Prof. Services";
  if (n >= 77000 && n <= 82999) return "Business Services";
  if (n >= 85000 && n <= 85999) return "Education";
  if (n >= 86000 && n <= 88999) return "Healthcare";
  if (n >= 90000 && n <= 93999) return "Arts & Entertainment";
  if (n >= 94000 && n <= 96999) return "Facilities / Personal Svcs";
  return "";
}

function addressToCity(details: CompanyDetails): string {
  // Prefer the structured locality field from Companies House
  if (details.locality) return details.locality;
  // Fallback: parse the concatenated address string
  const addr = details.registered_office_address;
  if (!addr) return "";
  const parts = addr.split(",").map(s => s.trim()).filter(Boolean);
  const nonPostcode = parts.filter(p => !/^[A-Z]{1,2}\d/.test(p));
  // locality is typically the last non-postcode, non-street part
  return nonPostcode[nonPostcode.length - 1] || "";
}

export default function TriagePage() {
  const { activeDeal, activeDealId, updateDeal, createDeal, hydrated } = useDealStore();
  const { isPremium, openUpgradeModal, pdfExportCount, incrementPdfExport } = useSubscription();
  const { status: authStatus } = useSession();
  const isGuest = authStatus !== "authenticated";

  const [inputMode, setInputMode]     = useState<"paste" | "upload" | "manual">("paste");
  const [rawText, setRawText]         = useState(activeDeal?.isDemo ? "" : (activeDeal?.rawText ?? ""));
  const [extracted, setExtracted]     = useState<ExtractedDeal | null>(activeDeal?.isDemo ? null : (activeDeal?.extracted ?? null));
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [askingPrice, setAskingPrice] = useState(activeDeal?.isDemo ? 0 : (activeDeal?.askingPrice ?? 0));
  const [netProfit, setNetProfit]     = useState(activeDeal?.isDemo ? 0 : (activeDeal?.netProfit ?? 0));
  const [addBacks, setAddBacks]       = useState(activeDeal?.isDemo ? 0 : (activeDeal?.addBacks ?? 0));
  const [equityPct, setEquityPct]     = useState(activeDeal?.equityPct ?? 30);
  const [vendorPct, setVendorPct]     = useState(activeDeal?.vendorPct ?? 20);
  const [bankPct, setBankPct]         = useState(activeDeal?.bankPct ?? 50);
  // BoE base rate (4.25% as of Jun 2026) + lender spread → effective APR
  const BOE_BASE_RATE = 4.25;
  const [boeSpread, setBoeSpread]     = useState(7.75);   // default: +7.75% → 12% APR
  const [loanTermYears, setLoanTermYears] = useState(5);
  const bankApr = (BOE_BASE_RATE + boeSpread) / 100;      // e.g. 0.12
  const [metrics, setMetrics]         = useState<DealMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string>("");
  const metricsTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [termLines, setTermLines]     = useState<TerminalLine[]>([]);
  const [termActive, setTermActive]   = useState(false);
  const [showTerm, setShowTerm]       = useState(false);
  const [drawerOpen, setDrawerOpen]             = useState(false);
  const [funnelOpen, setFunnelOpen]             = useState(false);
  const [companyDetails, setCompanyDetails]     = useState<CompanyDetails | null>(activeDeal?.companyDetails ?? null);
  const [reconciliation, setReconciliation]     = useState<ReconciliationResult | null>(activeDeal?.reconciliation ?? null);
  const [reconciling, setReconciling]           = useState(false);
  const [creditProfile, setCreditProfile]       = useState<CreditProfile | null>(activeDeal?.creditProfile ?? null);
  const [creditLoading, setCreditLoading]       = useState(false);
  const [creditReportOpen, setCreditReportOpen] = useState(false);
  const [captureOpen, setCaptureOpen]           = useState(false);
  const [emailCaptured, setEmailCaptured]       = useState(false);
  const pendingCompanyRef = useRef<CompanyDetails | null>(null);

  // Stable deal ID for this session
  const dealIdRef = useRef(`req_uk_mna_${Math.random().toString(36).slice(2, 10)}`);

  // Check if visitor email already captured
  useEffect(() => {
    try { if (localStorage.getItem("visitor_email")) setEmailCaptured(true); } catch {}
  }, []);

  /* ── Sync active deal → local state when deal switches ── */
  useEffect(() => {
    if (!activeDeal) return;
    // Demo deals: keep financials blank so the user must enter their own data
    const isDemo = activeDeal.isDemo;
    setAskingPrice(isDemo ? 0 : activeDeal.askingPrice);
    setNetProfit(isDemo ? 0 : activeDeal.netProfit);
    setAddBacks(isDemo ? 0 : activeDeal.addBacks);
    setEquityPct(activeDeal.equityPct);
    setVendorPct(activeDeal.vendorPct);
    setBankPct(activeDeal.bankPct);
    setRawText(isDemo ? "" : activeDeal.rawText);
    setExtracted(isDemo ? null : activeDeal.extracted);
    setMetrics(null);
    setShowTerm(false); setTermLines([]); setTermActive(false);
    setError(null);
    setCompanyDetails(activeDeal?.companyDetails ?? null);
    setReconciliation(activeDeal?.reconciliation ?? null);
    setCreditProfile(activeDeal?.creditProfile ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDealId]);

  /* ── Re-hydrate step-1 state once localStorage has loaded ── */
  useEffect(() => {
    if (!hydrated || !activeDeal) return;
    setCompanyDetails(prev => prev ?? activeDeal.companyDetails ?? null);
    setReconciliation(prev => prev ?? activeDeal.reconciliation ?? null);
    setCreditProfile(prev => prev ?? activeDeal.creditProfile ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  /* ── Write local state back to store (debounced, skip if unchanged) ── */
  useEffect(() => {
    if (!activeDeal) return;
    if (
      askingPrice === activeDeal.askingPrice &&
      netProfit   === activeDeal.netProfit   &&
      addBacks    === activeDeal.addBacks    &&
      equityPct   === activeDeal.equityPct   &&
      vendorPct   === activeDeal.vendorPct   &&
      bankPct     === activeDeal.bankPct
    ) return;
    const t = setTimeout(() => {
      updateDeal(activeDealId, { askingPrice, netProfit, addBacks, equityPct, vendorPct, bankPct });
    }, 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askingPrice, netProfit, addBacks, equityPct, vendorPct, bankPct]);

  /* ── Persist rawText + extracted; write IM location/sector if not yet set by CH ── */
  useEffect(() => {
    if (!activeDealId) return;
    const patch: Parameters<typeof updateDeal>[1] = { rawText, extracted };
    if (extracted?.location)      patch.location = extracted.location;
    if (extracted?.business_type) patch.sector   = extracted.business_type;
    updateDeal(activeDealId, patch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText, extracted]);

  /* ── Text extraction ── */
  const runExtraction = async (text: string) => {
    setLoading(true); setError(null);
    setShowTerm(true); setTermLines([]); setTermActive(true);

    const earlyLines: TerminalLine[] = [
      { tag: "SCANNING",  text: "Reading listing structure…",  color: "#a8a29e" },
      { tag: "ANALYSING", text: "Extracting core financials…", color: "#a5b4fc" },
    ];
    let shown = 0;
    const early = setInterval(() => {
      shown++;
      if (shown <= earlyLines.length) setTermLines(earlyLines.slice(0, shown));
      else clearInterval(early);
    }, 700);

    try {
      const res = await fetch(`${API}/api/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: text }),
      });
      clearInterval(early);
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail ?? `HTTP ${res.status}`); }
      const data: ExtractedDeal = await res.json();
      setExtracted(data);
      setAskingPrice(data.asking_price ?? 0);
      setNetProfit(data.net_profit ?? 0);
      setAddBacks(data.add_backs ?? 0);

      const script = buildScript(data);
      let idx = 2; setTermLines(script.slice(0, idx));
      const roll = setInterval(() => {
        idx++;
        setTermLines(script.slice(0, idx));
        if (idx >= script.length) { clearInterval(roll); setTermActive(false); }
      }, 500);
    } catch (e: unknown) {
      clearInterval(early); setTermActive(false);
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  };

  /* ── File upload (Wizard of Oz simulation) ── */
  const runFileUpload = (file: File) => {
    // DEMO MODE: Document parsing is not yet live. Shows sample data so users can
    // experience the full workflow. A banner is displayed to make this clear.
    setLoading(true); setError(null);
    setShowTerm(true); setTermLines([]); setTermActive(true);

    const script = buildFileScript(file.name);
    let idx = 0;
    setTermLines(script.slice(0, 1));
    const roll = setInterval(() => {
      idx++;
      setTermLines(script.slice(0, idx + 1));
      if (idx >= script.length - 1) {
        clearInterval(roll);
        setTermActive(false);
        setExtracted(SAMPLE_EXTRACTED);
        setAskingPrice(SAMPLE_EXTRACTED.asking_price ?? 0);
        setNetProfit(SAMPLE_EXTRACTED.net_profit ?? 0);
        setAddBacks(SAMPLE_EXTRACTED.add_backs ?? 0);
        setLoading(false);
        setError("DEMO: Document parsing is coming soon. The workspace has been populated with a sample deal so you can explore the full workflow.");
      }
    }, 700);
  };

  /* ── Metrics debounce ── */
  const fetchMetrics = useCallback(async () => {
    if (!askingPrice || !netProfit) return;
    setMetricsError("");
    try {
      const res = await fetch(`${API}/api/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asking_price: askingPrice, net_profit: netProfit, add_backs: addBacks,
          buyer_equity_pct: equityPct, vendor_finance_pct: vendorPct, bank_debt_pct: bankPct,
          annual_interest_rate: bankApr, loan_term_years: loanTermYears,
        }),
      });
      if (res.ok) {
        const m = await res.json();
        setMetrics(m);
        setMetricsError("");
        const currentStatus = activeDeal?.status;
        updateDeal(activeDealId, {
          // Only promote status to Analysed — never downgrade Pursuing/Saved/Rejected
          ...((!currentStatus || currentStatus === "In Review" || currentStatus === "Demo") ? { status: "Analysed" as const } : {}),
          date: new Date().toISOString().split("T")[0],
          isDemo: false,
          ...(extracted?.location      ? { location: extracted.location }           : {}),
          ...(extracted?.business_type ? { sector: extracted.business_type }        : {}),
        });
      } else {
        setMetricsError("Analysis failed — please try again.");
      }
    } catch { setMetricsError("Analysis failed — please try again."); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askingPrice, netProfit, addBacks, equityPct, vendorPct, bankPct, bankApr, loanTermYears, extracted, activeDealId, updateDeal]);

  useEffect(() => {
    if (metricsTimer.current) clearTimeout(metricsTimer.current);
    metricsTimer.current = setTimeout(fetchMetrics, 600);
    return () => { if (metricsTimer.current) clearTimeout(metricsTimer.current); };
  }, [fetchMetrics]);

  /* ── Re-run reconciliation + credit when financials change after company select ── */
  useEffect(() => {
    if (!companyDetails) return;
    const im = extracted ?? {
      asking_price: askingPrice || null,
      turnover: null,
      net_profit: netProfit || null,
      add_backs: addBacks || null,
      lease_years_remaining: null,
      business_type: null,
      location: null,
      raw_confidence: "low" as const,
    };
    runReconcile(companyDetails, im);
    // Also refresh credit profile so it reflects current financials
    const sde = (netProfit || 0) + (addBacks || 0);
    runCredit(companyDetails, { net_profit: netProfit || null, add_backs: addBacks || null, sde: sde > 0 ? sde : null, turnover: extracted?.turnover ?? null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extracted, askingPrice, netProfit, addBacks]);

  /* ── Credit profile ── */
  const runCredit = async (details: CompanyDetails, financials?: { net_profit?: number | null; add_backs?: number | null; sde?: number | null; turnover?: number | null }) => {
    setCreditLoading(true); setCreditProfile(null);
    try {
      const res = await fetch(`${API}/api/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_number: details.company_number,
          company_name: details.company_name,
          date_of_creation: details.date_of_creation ?? null,
          company_status: details.company_status ?? "active",
          accounts_next_due: details.accounts_next_due ?? null,
          confirmation_next_due: null,
          outstanding_charges_count: details.outstanding_charges?.length ?? 0,
          total_charges_count: details.total_charges ?? 0,
          active_officers_count: details.officers?.length ?? 0,
          sic_codes: details.sic_codes ?? [],
          postcode: details.postal_code ?? null,
          officer_names: (details.officers ?? []).map((o: Officer) => o.name),
          psc_raw_items: (details.psc_list ?? []).map((p: PSCEntry) => ({
            name: p.name,
            kind: p.kind,
            natures_of_control: p.natures_of_control ?? [],
            nationality: p.nationality ?? null,
            country_of_residence: p.country_of_residence ?? null,
            notified_on: p.notified_on ?? null,
          })),
          net_profit: financials?.net_profit ?? null,
          add_backs: financials?.add_backs ?? null,
          sde: financials?.sde ?? null,
          turnover: financials?.turnover ?? null,
        }),
      });
      if (res.ok) {
        const profile = await res.json();
        setCreditProfile(profile);
        updateDeal(activeDealId, { creditProfile: profile });
      }
    } catch { /* credit profile is supplemental — failure is non-blocking */ } finally { setCreditLoading(false); }
  };

  /* ── Reconciliation ── */
  const runReconcile = async (details: CompanyDetails, im: ExtractedDeal | null) => {
    setReconciling(true); setReconciliation(null);
    try {
      const res = await fetch(`${API}/api/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companies_house_data: details,
          extracted_im_data: im ?? {},
          im_raw_text: rawText,
        }),
      });
      if (res.ok) {
        const rec = await res.json();
        setReconciliation(rec);
        updateDeal(activeDealId, { reconciliation: rec });
      }
    } catch { /* reconciliation is supplemental — failure is non-blocking */ } finally { setReconciling(false); }
  };

  /* ── Email-gated company select ── */
  const doCompanySelect = (d: CompanyDetails) => {
    const derivedLocation = addressToCity(d);
    const derivedSector   = d.sic_description || sicToSector(d.sic_codes);
    const formattedName   = d.company_name
      .toLowerCase()
      .replace(/\b([a-z])/g, (_: string, c: string) => c.toUpperCase());
    updateDeal(activeDealId, {
      name: formattedName,
      companyDetails: d,
      ...(derivedLocation ? { location: derivedLocation } : {}),
      ...(derivedSector   ? { sector:   derivedSector   } : {}),
    });
    setCompanyDetails(d);
    runReconcile(d, extracted);
    runCredit(d, {
      net_profit: extracted?.net_profit,
      add_backs: extracted?.add_backs,
      sde: extracted?.net_profit && extracted?.add_backs ? extracted.net_profit + extracted.add_backs : null,
      turnover: extracted?.turnover ?? null,
    });
  };

  const handleCompanySelect = (d: CompanyDetails) => {
    // Logged-in users skip the email gate entirely
    if (authStatus === "authenticated") {
      doCompanySelect(d);
      return;
    }
    if (!emailCaptured) {
      pendingCompanyRef.current = d;
      setCaptureOpen(true);
      return;
    }
    doCompanySelect(d);
  };

  /* ── Slider locking ── */
  // Sliders: always ensure the three values sum exactly to 100 (no rounding drift)
  const setEquity = (v: number) => { const r = 100-v; const nv = vendorPct+bankPct > 0 ? Math.round(r * vendorPct/(vendorPct+bankPct)) : Math.round(r/2); setEquityPct(v); setVendorPct(nv); setBankPct(r-nv); };
  const setVendor = (v: number) => { const r = 100-v; const ne = equityPct+bankPct > 0 ? Math.round(r * equityPct/(equityPct+bankPct)) : Math.round(r/2); setVendorPct(v); setEquityPct(ne); setBankPct(r-ne); };
  const setBank   = (v: number) => { const r = 100-v; const ne = equityPct+vendorPct > 0 ? Math.round(r * equityPct/(equityPct+vendorPct)) : Math.round(r/2); setBankPct(v); setEquityPct(ne); setVendorPct(r-ne); };

  const hasFinancials = askingPrice > 0 && netProfit > 0 && !activeDeal?.isDemo;

  const dscrVariant = metrics
    ? metrics.dscr_band === "strong" ? "success"
    : metrics.dscr_band === "acceptable" ? "amber"
    : metrics.dscr_band === "marginal" ? "amber"
    : "danger"
    : "default";
  const dscrBandLabel = metrics
    ? metrics.dscr_band === "strong"     ? "Strong — exceeds 1.50× lender threshold"
    : metrics.dscr_band === "acceptable" ? "Acceptable — meets 1.25× minimum"
    : metrics.dscr_band === "marginal"   ? "Marginal — below 1.25×, may need more equity"
    : "Unbankable — below 1.10×"
    : "";

  // Credit memo available for any analysed deal — removed FCF gate (FCF can be negative due to tax model)
  const creditMemoUnlocked = hasFinancials && !!metrics && metrics.dscr >= 1.0;

  /* ── Workflow navigation ── */
  // currentStep controls which view is shown. Data is NEVER cleared when navigating.
  // Steps unlock progressively but can always be revisited once reached.
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const step1Reached = true;
  const step2Reached = hasFinancials;
  const step3Reached = hasFinancials && !!metrics; // require at least one metrics result
  const step4Reached = !!metrics;

  // Derived "done" flags for the progress bar indicators
  const step1Done = !!companyDetails;
  const step2Done = hasFinancials && !termActive;
  const step3Done = currentStep === 4;

  // Navigate to a step — only allowed if that step has been reached
  const goToStep = (n: 1 | 2 | 3 | 4) => {
    if (n === 1) setCurrentStep(1);
    if (n === 2 && step2Reached) setCurrentStep(2);
    if (n === 3 && step3Reached) setCurrentStep(3);
    if (n === 4 && step4Reached) setCurrentStep(4);
    // The dashboard main area is overflow:auto — scroll it, not window
    const main = document.querySelector("main");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Step indicator pill (clickable) ── */
  const StepPill = ({ n, label, done, active, reached }: { n: number; label: string; done: boolean; active: boolean; reached: boolean }) => (
    <button
      onClick={() => goToStep(n as 1 | 2 | 3 | 4)}
      disabled={!reached}
      style={{
        display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0,
        background: "none", border: "none", padding: "4px 0",
        cursor: reached ? "pointer" : "default",
        textAlign: "left",
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800,
        background: done ? "#059669" : active ? "#1c1917" : reached ? "#e0e7ff" : "#e7e5e4",
        color: done ? "#fff" : active ? "#fff" : reached ? "#1c1917" : "#d6d3d1",
        transition: "all 0.25s",
        boxShadow: active ? "0 0 0 4px rgba(28,25,23,0.15)" : "none",
      }}>
        {done ? (
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : n}
      </div>
      <span className="step-label" style={{
        fontSize: 12, fontWeight: active ? 700 : 500,
        color: done ? "#059669" : active ? "#1c1917" : reached ? "#475569" : "#d6d3d1",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        transition: "color 0.25s",
      }}>
        {label}
      </span>
    </button>
  );

  /* ── Shared step header ── */
  const StepHeader = ({ n, label, sub }: { n: number; label: string; sub: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 4px 12px rgba(28,25,23,0.3)" }}>{n}</div>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>{label}</h2>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>{sub}</p>
      </div>
    </div>
  );

  /* ── Bottom nav bar shared across steps ── */
  const StepNav = ({ prevStep, prevLabel, nextStep, nextLabel, nextDisabled, onNext }: {
    prevStep?: 1 | 2 | 3 | 4; prevLabel?: string;
    nextStep?: 1 | 2 | 3 | 4; nextLabel?: string;
    nextDisabled?: boolean; onNext?: () => void;
  }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
      <div>
        {prevStep && (
          <button
            onClick={() => goToStep(prevStep)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#78716c", background: "#faf9f7", border: "1px solid #d6d3d1", borderRadius: 9, padding: "9px 16px", cursor: "pointer", fontWeight: 600 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>
            {prevLabel ?? "Back"}
          </button>
        )}
      </div>
      <div>
        {nextStep && (
          <button
            onClick={() => { onNext?.(); goToStep(nextStep); }}
            disabled={nextDisabled}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 14, fontWeight: 700,
              background: nextDisabled ? "#d6d3d1" : "linear-gradient(135deg,#166534,#14532d)",
              color: nextDisabled ? "#a8a29e" : "#fff",
              border: "none", borderRadius: 10, padding: "11px 22px",
              cursor: nextDisabled ? "not-allowed" : "pointer",
              boxShadow: nextDisabled ? "none" : "0 4px 14px rgba(28,25,23,0.3)",
              transition: "all 0.2s",
            }}>
            {nextLabel ?? "Continue"}
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="triage-padding" style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px 80px" }}>

      {/* ── Back to dashboard breadcrumb ── */}
      <div style={{ marginBottom: 14 }}>
        <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          My Deals
        </a>
      </div>

      {/* ── Guest save-your-work nudge ── */}
      {isGuest && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between",
          background: "linear-gradient(135deg,#f0f4ff,#faf5ff)",
          border: "1px solid #d6d3d1", borderRadius: 12, padding: "12px 18px",
          marginBottom: 18, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="15" height="15" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1e1b4b", margin: "0 0 1px" }}>
                Your deal analysis isn&apos;t saved yet
              </p>
              <p style={{ fontSize: 11, color: "#1c1917", margin: 0 }}>
                Create a free account to save unlimited deal audits and revisit them anytime.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="/login" style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 7, border: "1px solid #d6d3d1", background: "#fff", color: "#1c1917", textDecoration: "none" }}>
              Sign in
            </a>
            <a href="/signup" style={{ fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#166534,#14532d)", color: "#fff", textDecoration: "none" }}>
              Create free account →
            </a>
          </div>
        </div>
      )}

      {/* ── Page title ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <EditableTitle
            value={activeDeal?.name ?? "New Deal Analysis"}
            onChange={name => {
              if (activeDealId) {
                updateDeal(activeDealId, { name });
              } else {
                const newId = createDeal();
                updateDeal(newId, { name });
              }
            }}
          />
          {activeDealId && (
            <button
              onClick={() => {
                if (!activeDeal) return;
                const isSaved = activeDeal.status === "Saved";
                updateDeal(activeDealId, {
                  status: isSaved ? "In Review" : "Saved",
                  ...(activeDeal.isDemo && !isSaved ? { isDemo: false } : {}),
                });
              }}
              title={activeDeal?.status === "Saved" ? "Remove from saved" : "Save for later"}
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 7, cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                border: activeDeal?.status === "Saved" ? "1.5px solid #d6d3d1" : "1.5px solid #d6d3d1",
                background: activeDeal?.status === "Saved" ? "#e7e5e4" : "#fff",
                color: activeDeal?.status === "Saved" ? "#292524" : "#a8a29e",
                transition: "all 0.15s",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={activeDeal?.status === "Saved" ? "#292524" : "none"} stroke={activeDeal?.status === "Saved" ? "#292524" : "#a8a29e"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              {activeDeal?.status === "Saved" ? "Saved" : "Save for later"}
            </button>
          )}
        </div>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "6px 0 0" }}>
          Search the company register and enter financials to begin your analysis.
        </p>
      </div>

      {/* ── Step progress bar ── */}
      <div className="step-bar" style={{
        display: "flex", alignItems: "center",
        background: "#fff", border: "1px solid #d6d3d1",
        borderRadius: 14, padding: "12px 20px",
        marginBottom: 28, boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        gap: 4,
      }}>
        <StepPill n={1} label="Verify Company"   done={step1Done}  active={currentStep === 1} reached={step1Reached} />
        <div className="step-connector" style={{ height: 2, flex: "0 0 32px", background: step1Done ? "#a7f3d0" : "#d6d3d1", borderRadius: 9999 }} />
        <StepPill n={2} label="Enter Financials" done={step2Done}  active={currentStep === 2} reached={step2Reached} />
        <div className="step-connector" style={{ height: 2, flex: "0 0 32px", background: step2Done ? "#a7f3d0" : "#d6d3d1", borderRadius: 9999 }} />
        <StepPill n={3} label="Deal Analysis"    done={step3Done}  active={currentStep === 3} reached={step3Reached} />
        <div className="step-connector" style={{ height: 2, flex: "0 0 32px", background: step3Done ? "#a7f3d0" : "#d6d3d1", borderRadius: 9999 }} />
        <StepPill n={4} label="Submit & Export"  done={false}      active={currentStep === 4} reached={step4Reached} />
      </div>

      {/* ── Social proof ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, justifyContent: "center" }}>
        <div style={{ display: "flex", gap: -3 }}>
          {["#292524","#1c1917","#06b6d4","#059669","#d97706"].map((c, i) => (
            <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: "2px solid #faf9f7", marginLeft: i > 0 ? -6 : 0, flexShrink: 0 }} />
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#78716c" }}>
          Analyse any UK business listing in under 60 seconds
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* STEP 1 & 2 — side-by-side inputs                              */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {currentStep <= 2 && (
        <div>
          <div className="triage-steps-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 0, alignItems: "start" }}>

            {/* ── Left: Company Search ── */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: step1Done ? "#059669" : "#1c1917", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {step1Done ? <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : "1"}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>Verify Company</p>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>UK Companies House register</p>
                </div>
                {step1Done && (
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#059669", background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 6, padding: "2px 8px" }}>Verified</span>
                )}
              </div>

              <CompanySearch
                initialDetails={companyDetails}
                onCompanySelect={handleCompanySelect}
              />

              {(creditProfile || creditLoading) && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  {creditLoading
                    ? <CreditProfileBadge loading />
                    : creditProfile && <CreditProfileBadge profile={creditProfile} onViewReport={() => setCreditReportOpen(true)} />
                  }
                </div>
              )}

              {!step1Done && (
                <p style={{ fontSize: 11, color: "#a8a29e", margin: "12px 0 0", lineHeight: 1.6 }}>
                  Optional but recommended — verifies directors, charges, and company age before you model the deal.
                </p>
              )}
            </div>

            {/* ── Right: Financial Data ── */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: step2Done ? "#059669" : "#1c1917", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {step2Done ? <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : "2"}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>Financial Data</p>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>Upload IM or enter figures</p>
                </div>
                <button
                  onClick={() => { setInputMode("paste"); setRawText(SAMPLE); runExtraction(SAMPLE); }}
                  disabled={loading}
                  style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-light)", border: "1px solid var(--accent-mid)", borderRadius: 6, padding: "3px 9px", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
                  Sample
                </button>
              </div>

              {/* Mode tabs */}
              <div style={{ display: "flex", gap: 2, background: "#e7e5e4", borderRadius: 9, padding: 3, marginBottom: 14 }}>
                {(["paste", "upload", "manual"] as const).map(mode => (
                  <button key={mode}
                    onClick={() => {
                      if (mode === "upload" && !isPremium) { openUpgradeModal("Document Upload"); return; }
                      setInputMode(mode);
                    }}
                    style={{
                      flex: 1, fontSize: 11, fontWeight: 600, padding: "6px 8px", borderRadius: 7,
                      border: "none", cursor: "pointer",
                      background: inputMode === mode ? "#fff" : "transparent",
                      color: inputMode === mode ? "#1c1917" : "#78716c",
                      boxShadow: inputMode === mode ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                      transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    }}>
                    {mode === "paste" ? "✏ Paste Text"
                     : mode === "upload" ? (<>📄 Upload IM{!isPremium && <Lock size={9} style={{ color: "#a8a29e" }} />}</>)
                     : "✎ Manual"}
                  </button>
                ))}
              </div>

              {inputMode === "paste" && (
                <>
                  <textarea className="input" rows={8}
                    placeholder={"Asking Price: £450,000\nTurnover: £820,000\nNet Profit: £120,000\nNorm. Adj: Owner salary £55,000\nLease: 7 years remaining\nBusiness: Engineering consultancy…"}
                    value={rawText} onChange={e => setRawText(e.target.value)}
                    style={{ fontFamily: "inherit", marginBottom: 10, fontSize: 12, resize: "vertical" }}
                  />
                  <button onClick={() => rawText.trim() && runExtraction(rawText)} disabled={loading || !rawText.trim()} className="btn-primary"
                    style={{ width: "100%", justifyContent: "center", padding: "10px 16px", fontSize: 13, opacity: loading || !rawText.trim() ? 0.5 : 1, cursor: loading || !rawText.trim() ? "not-allowed" : "pointer" }}>
                    {loading ? "Extracting with AI…" : "Extract & Analyse →"}
                  </button>
                </>
              )}

              {inputMode === "upload" && (
                <>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 10px" }}>PDF, Word (.docx), or PowerPoint (.pptx) · Max 30 MB</p>
                  <DropZone onFile={runFileUpload} disabled={loading} />
                  {loading && <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", margin: "10px 0 0" }}>Parsing document…</p>}
                </>
              )}

              {inputMode === "manual" && (
                <>
                  <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 12px" }}>Enter the key figures from the listing</p>
                  {activeDeal?.isDemo && (
                    <div style={{ marginBottom: 8, padding: "7px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8 }}>
                      <p style={{ fontSize: 11, color: "#92400e", margin: 0 }}>Sample deal — enter your own figures to begin analysis.</p>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {([
                      ["Asking Price £", askingPrice, setAskingPrice, activeDeal?.isDemo ? activeDeal.askingPrice : null],
                      ["Net Profit £",   netProfit,   setNetProfit,   activeDeal?.isDemo ? activeDeal.netProfit  : null],
                      ["Norm. Adj. £",   addBacks,    setAddBacks,    activeDeal?.isDemo ? activeDeal.addBacks   : null],
                    ] as [string, number, (n: number) => void, number | null][]).map(([label, val, set, sampleVal]) => (
                      <label key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
                          {label === "Norm. Adj. £" ? <GlossaryTerm term="NormalizedAdjustments">Norm. Adj. £</GlossaryTerm> : label}
                        </span>
                        <input
                          type="number"
                          value={val || ""}
                          placeholder={sampleVal != null ? `e.g. ${sampleVal.toLocaleString()}` : "0"}
                          onChange={e => {
                            if (activeDeal?.isDemo) updateDeal(activeDealId, { isDemo: false, status: "In Review" });
                            set(Number(e.target.value));
                          }}
                          className="input"
                          style={{ padding: "9px 12px", fontSize: 14 }}
                        />
                      </label>
                    ))}
                  </div>
                </>
              )}

              {error && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: 8, fontSize: 12, color: "var(--danger)" }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {showTerm && <div style={{ marginTop: 14 }}><Terminal lines={termLines} active={termActive} /></div>}

          {/* Extracted data card — appears after AI extraction */}
          {extracted && !termActive && (
            <div className="card" style={{ padding: 20, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>AI Extracted Financials</h3>
                <span className={`badge ${extracted.raw_confidence === "high" ? "badge-success" : extracted.raw_confidence === "medium" ? "badge-amber" : "badge-danger"}`}>
                  {extracted.raw_confidence} confidence
                </span>
              </div>
              <div className="triage-extracted-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 16 }}>
                {[
                  ["Asking", fmt(extracted.asking_price)],
                  ["Turnover", fmt(extracted.turnover)],
                  ["Net Profit", fmt(extracted.net_profit)],
                  ["Adj.", fmt(extracted.add_backs)],
                  ["Lease", extracted.lease_years_remaining ? `${extracted.lease_years_remaining}y` : "—"],
                  ["Location", extracted.location ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="card-inset" style={{ padding: "8px 12px" }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Override values</p>
                <div className="triage-override-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {([
                    ["Asking Price £", askingPrice, setAskingPrice],
                    ["Net Profit £",   netProfit,   setNetProfit],
                    ["Norm. Adj. £",   addBacks,    setAddBacks],
                  ] as [string, number, (n: number) => void][]).map(([label, val, set]) => (
                    <label key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>
                        {label === "Norm. Adj. £" ? <GlossaryTerm term="NormalizedAdjustments">Norm. Adj. £</GlossaryTerm> : label}
                      </span>
                      <input type="number" value={val || ""} onChange={e => set(Number(e.target.value))} className="input" style={{ padding: "7px 10px", fontSize: 13 }} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <StepNav
            nextStep={3}
            nextLabel="Run Deal Analysis"
            nextDisabled={!hasFinancials || termActive}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* STEP 3 — DEAL ANALYSIS                                         */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {currentStep === 3 && (
        <div>
          <StepHeader n={3} label="Deal Analysis" sub="Valuation, capital structure, and financial signals" />

          {metricsError && !metricsError.startsWith("DEMO") && (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca" }}>
              <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{metricsError}</p>
            </div>
          )}

          {/* Context summary bar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {companyDetails && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 8, padding: "7px 12px" }}>
                <svg width="12" height="12" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>{companyDetails.company_name}</span>
                <button onClick={() => goToStep(1)} style={{ fontSize: 10, color: "#059669", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>edit</button>
              </div>
            )}
            {hasFinancials && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f0fdf4", border: "1px solid #a7f3d0", borderRadius: 8, padding: "7px 12px" }}>
                <svg width="12" height="12" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>Asking {fmt(askingPrice)} · Profit {fmt(netProfit)}</span>
                <button onClick={() => goToStep(2)} style={{ fontSize: 10, color: "#059669", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>edit</button>
              </div>
            )}
          </div>

          {/* ── Headline valuation ── */}
          {metrics && (
            <div style={{ marginBottom: 16 }}>
              <EstimatedValuationCard
                sde={metrics.sde}
                askingPrice={askingPrice}
                sicCodes={companyDetails?.sic_codes ?? []}
                businessType={extracted?.business_type ?? null}
              />
            </div>
          )}

          {/* ── Capital stack ── */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 3px" }}>Capital Stack</h2>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Model how you intend to fund the acquisition</p>
              </div>
              <span className={`badge ${equityPct + vendorPct + bankPct === 100 ? "badge-success" : "badge-danger"}`}>
                {equityPct + vendorPct + bankPct}% total
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <KSlider label={<GlossaryTerm term="BuyerEquity">Buyer Equity</GlossaryTerm>}       value={equityPct} onChange={setEquity} color="#3b82f6" />
              <KSlider label={<GlossaryTerm term="VendorFinance">Vendor Finance / Earn-out</GlossaryTerm>} value={vendorPct} onChange={setVendor} color="#a855f7" />
              <KSlider label={<GlossaryTerm term="BankDebt">Bank / Commercial Debt</GlossaryTerm>}  value={bankPct}   onChange={setBank}   color="#f59e0b" />
            </div>
            <div style={{ marginTop: 28 }}>
              <div style={{ height: 14, borderRadius: 9999, overflow: "hidden", background: "#d6d3d1", display: "flex", border: "1px solid #d6d3d1" }}>
                <div style={{ width: `${equityPct}%`, background: "#3b82f6", transition: "width 0.2s", position: "relative" }}>
                  {equityPct >= 10 && <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 800, color: "#fff" }}>{equityPct}%</span>}
                </div>
                <div style={{ width: `${vendorPct}%`, background: "#a855f7", transition: "width 0.2s", position: "relative", boxShadow: equityPct > 0 && vendorPct > 0 ? "inset 1.5px 0 0 rgba(255,255,255,0.45)" : "none" }}>
                  {vendorPct >= 10 && <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 800, color: "#fff" }}>{vendorPct}%</span>}
                </div>
                <div style={{ width: `${bankPct}%`, background: "#f59e0b", transition: "width 0.2s", position: "relative", boxShadow: bankPct > 0 && (equityPct > 0 || vendorPct > 0) ? "inset 1.5px 0 0 rgba(255,255,255,0.45)" : "none" }}>
                  {bankPct >= 10 && <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 800, color: "#fff" }}>{bankPct}%</span>}
                </div>
              </div>
              {(() => { const tc = askingPrice * 1.05; return (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700 }}>{fmt(tc * equityPct / 100)} equity</span>
                  <span style={{ fontSize: 11, color: "#a855f7", fontWeight: 700 }}>{fmt(tc * vendorPct / 100)} vendor</span>
                  <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>{fmt(tc * bankPct / 100)} bank</span>
                </div>
              ); })()}
              {metrics && (
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "6px 0 0", textAlign: "center" }}>
                  Total acquisition cost: <strong style={{ color: "var(--text)" }}>{fmt(metrics.total_acquisition_cost)}</strong>
                  {" "}(incl. {fmt(metrics.acquisition_fees)} fees)
                </p>
              )}
            </div>
          </div>

          {/* ── Advanced debt engineering (premium) ── */}
          <div style={{ marginBottom: 16 }}>
            <PremiumGate feature="Advanced Debt Engineering" title="Advanced Debt Engineering" teaser="Customise lender spread, loan term, and see live debt service recalculation">
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>Advanced Debt Engineering</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1c1917", background: "#e7e5e4", padding: "3px 10px", borderRadius: 20 }}>
                    Effective APR: {(BOE_BASE_RATE + boeSpread).toFixed(2)}%
                  </span>
                </div>
                <div style={{ background: "#faf9f7", border: "1px solid #d6d3d1", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>BoE Base Rate</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{BOE_BASE_RATE.toFixed(2)}%</span>
                  </div>
                  <p style={{ fontSize: 10, color: "#a8a29e", margin: "3px 0 0" }}>Bank of England rate as of June 2026 · updates manually</p>
                </div>
                <div className="triage-metrics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>Lender Spread (% above BoE)</label>
                    <input type="number" min={1} max={20} step={0.25} value={boeSpread} onChange={e => setBoeSpread(Number(e.target.value))} className="input" style={{ fontSize: 13 }} />
                    <p style={{ fontSize: 10, color: "#a8a29e", margin: "4px 0 0" }}>BoE {BOE_BASE_RATE}% + {boeSpread}% = {(BOE_BASE_RATE + boeSpread).toFixed(2)}% APR</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 5 }}>Loan Term (years)</label>
                    <input type="number" min={1} max={25} step={1} value={loanTermYears} onChange={e => setLoanTermYears(Number(e.target.value))} className="input" style={{ fontSize: 13 }} />
                  </div>
                </div>
              </div>
            </PremiumGate>
          </div>

          {/* ── Core deal metrics ── */}
          {metrics && (
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 16px" }}>Deal Metrics</h2>
              <div className="triage-metrics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <MetricCard label={<GlossaryTerm term="SDE" />} value={fmt(metrics.sde)} sub="Seller's Discretionary Earnings" />
                <MetricCard label={<GlossaryTerm term="ValuationMultiple">Valuation Multiple</GlossaryTerm>} value={`${metrics.valuation_multiple}×`} sub="Asking Price ÷ SDE" variant={metrics.valuation_multiple <= 4 ? "success" : "default"} />
                <MetricCard label={<GlossaryTerm term="DebtService">Monthly Bank Repayment</GlossaryTerm>} value={bankPct === 0 ? "£0" : fmt(metrics.monthly_bank_payment)} sub={bankPct === 0 ? "No bank debt" : `${fmt(metrics.annual_bank_debt_service)}/yr · ${loanTermYears}yr @ ${(BOE_BASE_RATE + boeSpread).toFixed(2)}% APR`} />
                <MetricCard label={<GlossaryTerm term="BankDebt">Bank Loan</GlossaryTerm>} value={fmt(askingPrice * 1.05 * bankPct / 100)} sub={`${bankPct}% of total cost`} />
              </div>
              <DSCRBanner dscr={metrics.dscr} warn={metrics.dscr_warning} />
            </div>
          )}

          {/* ── Sector Benchmarks ── */}
          {creditProfile?.valuation && (
            <SectorBenchmarksCard
              val={creditProfile.valuation}
              sde={metrics?.sde ?? 0}
              askingPrice={askingPrice}
              hasFinancials={hasFinancials}
              lastAccountsDate={companyDetails?.last_accounts_made_up_to ?? null}
              onViewCreditLimit={() => setCreditReportOpen(true)}
            />
          )}

          {/* ── IB metrics (premium) ── */}
          {metrics && (
            <div style={{ marginBottom: 16 }}>
              <PremiumGate feature="Investment Banking Metrics" title="Investment Banking Deal Metrics" teaser="Unlock IRR, Levered FCF, Cash-on-Cash ROI and full debt modelling">
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>Investment Banking Deal Metrics</h2>
                    <span className="badge badge-indigo">IB Grade</span>
                  </div>
                  <div className="triage-metrics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <MetricCard label={<GlossaryTerm term="DSCR" />} value={`${metrics.dscr === Infinity ? "∞" : metrics.dscr.toFixed(2)}×`} sub={dscrBandLabel} variant={dscrVariant} />
                    <MetricCard label={<GlossaryTerm term="LeveredFCF">Levered FCF</GlossaryTerm>} value={fmt(metrics.levered_fcf)} sub="Annual equity cash flow" variant={metrics.levered_fcf >= 0 ? "success" : "danger"} />
                    <MetricCard label={<GlossaryTerm term="IRR">5-Year IRR</GlossaryTerm>} value={fmtPct(metrics.equity_irr)} sub="5-year equity hold" variant={!isFinite(metrics.equity_irr) || isNaN(metrics.equity_irr) ? "default" : metrics.equity_irr >= 0.25 ? "success" : "default"} />
                    <MetricCard label={<GlossaryTerm term="CoCROI">Cash-on-Cash ROI</GlossaryTerm>} value={fmtPct(metrics.coc_roi)} sub="Year 1 yield on equity" variant={!isFinite(metrics.coc_roi) || isNaN(metrics.coc_roi) ? "default" : metrics.coc_roi >= 0.15 ? "success" : "default"} />
                  </div>
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 4px" }}>
                      <GlossaryTerm term="CorpTax"><strong style={{ color: "var(--text-soft)" }}>Corp tax</strong></GlossaryTerm>: {fmt(metrics.corp_tax_charge)}/yr · <GlossaryTerm term="VendorFinance"><strong style={{ color: "var(--text-soft)" }}>Vendor service</strong></GlossaryTerm>: {fmt(metrics.annual_vendor_service)}/yr (3yr earn-out)
                    </p>
                    <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>IRR assumes 5-year hold, exit at entry multiple, full debt amortised at exit.</p>
                  </div>
                </div>
              </PremiumGate>
            </div>
          )}

          {/* ── Forensic audit (premium) ── */}
          {reconciling && (
            <div style={{ marginBottom: 16, padding: "20px 24px", background: "#1c1917", borderRadius: 12, border: "1px solid #1e293b", color: "#475569", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 14, height: 14, border: "2px solid #44403c", borderTopColor: "#1c1917", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              Running forensic reconciliation…
            </div>
          )}
          {reconciliation && extracted && (
            <div style={{ marginBottom: 16 }}>
              <PremiumGate feature="Forensic Audit" title="Forensic Audit & Registry Reconciliation" teaser="Cross-reference Companies House data against listing claims — catch mismatches before you bid">
                <ForensicAuditPanel result={reconciliation} extracted={extracted} />
              </PremiumGate>
            </div>
          )}

          {/* ── Acquisition intelligence (premium) ── */}
          {companyDetails && (
            <div style={{ marginBottom: 16 }}>
              <PremiumGate feature="Acquisition Intelligence" title="Acquisition Intelligence Report" teaser="AI-powered deal scoring, valuation benchmarks, sector multiples and red-flag summary">
                <AcquisitionInsightsCard
                  companyDetails={companyDetails}
                  extracted={extracted ?? { asking_price: askingPrice || null, turnover: null, net_profit: netProfit || null, add_backs: addBacks || null, business_type: null, location: null, raw_confidence: "low" }}
                  askingPrice={askingPrice} netProfit={netProfit} addBacks={addBacks} imRawText={rawText} creditProfile={creditProfile}
                />
              </PremiumGate>
            </div>
          )}

          {hasFinancials && !metrics && (
            <div className="card" style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 80 }}>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>Computing metrics…</p>
            </div>
          )}

          <StepNav
            prevStep={1} prevLabel="Edit Inputs"
            nextStep={4} nextLabel="Proceed to Submit & Export"
            nextDisabled={!metrics}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* STEP 4 — SUBMIT & EXPORT                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {currentStep === 4 && (
        <div>
          <StepHeader n={4} label="Submit & Export" sub="Route to approved lenders and generate your Credit Memo" />

          {/* ── Deal viability scorecard ── */}
          {metrics && (
            <div style={{ marginBottom: 16 }}>
              <DealViabilityCard dscr={metrics.dscr} fcf={metrics.levered_fcf} onOpenFunnel={() => setFunnelOpen(true)} />
            </div>
          )}

          <div className="triage-cta-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

            {/* Lender routing */}
            <div style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              border: "1px solid #a7f3d0", borderRadius: 14, padding: "24px",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>
                🏦
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#065f46", margin: "0 0 6px" }}>Route to Lenders</h3>
              <p style={{ fontSize: 13, color: "#047857", margin: "0 0 18px", lineHeight: 1.55 }}>
                Share your deal with our approved commercial lender network. We match based on DSCR, sector, and deal size.
              </p>
              {metrics && (
                <button
                  onClick={() => setFunnelOpen(true)}
                  style={{
                    width: "100%", padding: "12px 0", background: "#059669", color: "#fff",
                    border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", boxShadow: "0 4px 14px rgba(5,150,105,0.3)",
                  }}>
                  View Matching Lenders →
                </button>
              )}
            </div>

            {/* Credit memo */}
            <div style={{
              background: creditMemoUnlocked ? "linear-gradient(135deg, #e7e5e4 0%, #e7e5e4 100%)" : "#faf9f7",
              border: `1px solid ${creditMemoUnlocked ? "#d6d3d1" : "#d6d3d1"}`,
              borderRadius: 14, padding: "24px", transition: "all 0.3s",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: creditMemoUnlocked ? "#1c1917" : "#d6d3d1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>
                {creditMemoUnlocked ? "📋" : "🔒"}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: creditMemoUnlocked ? "#1e1b4b" : "#a8a29e", margin: "0 0 6px" }}>Credit Memo PDF</h3>
              <p style={{ fontSize: 13, color: creditMemoUnlocked ? "#1c1917" : "#a8a29e", margin: "0 0 18px", lineHeight: 1.55 }}>
                {creditMemoUnlocked
                  ? "Generate a 3-page institutional Credit Memo ready to share with lenders."
                  : "Unlocks when DSCR ≥ 1.25× and Levered FCF > 0."}
              </p>
              <button
                disabled={!creditMemoUnlocked}
                onClick={() => {
                  if (!creditMemoUnlocked) return;
                  if (!isPremium && pdfExportCount >= 1) { openUpgradeModal("Credit Memo PDF (2nd export)"); return; }
                  incrementPdfExport();
                  setDrawerOpen(true);
                }}
                style={{
                  width: "100%", padding: "12px 0",
                  background: creditMemoUnlocked ? "#1c1917" : "#d6d3d1",
                  color: creditMemoUnlocked ? "#fff" : "#a8a29e",
                  border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700,
                  cursor: creditMemoUnlocked ? "pointer" : "not-allowed",
                  boxShadow: creditMemoUnlocked ? "0 4px 14px rgba(28,25,23,0.28)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}>
                {creditMemoUnlocked ? (
                  <>Generate Credit Memo →{!isPremium && pdfExportCount >= 1 && <Lock size={11} style={{ opacity: 0.8 }} />}</>
                ) : "Locked"}
              </button>
            </div>
          </div>

          <StepNav prevStep={3} prevLabel="Back to Analysis" />
        </div>
      )}

      {/* ── Overlays / Drawers ── */}
      {metrics && (
        <CreditMemoDrawer
          isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}
          metrics={metrics} extracted={extracted}
          askingPrice={askingPrice} netProfit={netProfit}
          equityPct={equityPct} vendorPct={vendorPct} bankPct={bankPct}
          registryData={companyDetails && reconciliation && creditProfile ? ({
            company_name: companyDetails.company_name,
            company_number: companyDetails.company_number,
            date_of_creation: companyDetails.date_of_creation,
            outstanding_charges_count: companyDetails.outstanding_charges?.length ?? 0,
            active_officers_count: companyDetails.officers?.length ?? 0,
            reconciliation_score: reconciliation.reconciliation_score,
            credit_score: creditProfile.open_credit_score,
            credit_limit_gbp: creditProfile.credit_limit_gbp,
            insolvency_risk: creditProfile.insolvency_risk,
            flags: reconciliation.flags.map(f => ({ title: f.title, status: f.status, message: f.message })),
          } satisfies RegistryDataForMemo) : null}
          creditProfile={creditProfile}
        />
      )}

      {creditProfile && companyDetails && (
        <CreditReportDrawer
          isOpen={creditReportOpen} onClose={() => setCreditReportOpen(false)}
          profile={creditProfile}
          companyName={companyDetails.company_name}
          companyNumber={companyDetails.company_number}
        />
      )}

      {metrics && (
        <LenderFunnelModal
          isOpen={funnelOpen} onClose={() => setFunnelOpen(false)}
          dscr={metrics.dscr} leveredFcf={metrics.levered_fcf}
          dealId={dealIdRef.current}
          totalCost={metrics.total_acquisition_cost}
          sector={extracted?.business_type ?? null}
        />
      )}

      <EmailCaptureModal
        isOpen={captureOpen}
        onClose={() => { setCaptureOpen(false); pendingCompanyRef.current = null; }}
        onCaptured={() => {
          setEmailCaptured(true);
          setCaptureOpen(false);
          if (pendingCompanyRef.current) {
            doCompanySelect(pendingCompanyRef.current);
            pendingCompanyRef.current = null;
          }
        }}
        headline="Unlock company verification"
        subline="Enter your details to run a free Companies House check, credit assessment, and forensic reconciliation."
      />
    </div>
  );
}
