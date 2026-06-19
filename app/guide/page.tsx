"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { GlossaryTerm } from "@/app/components/GlossaryTerm";

// ─── Sector data ──────────────────────────────────────────────────────────── //

interface Sector {
  id: string;
  name: string;
  emoji: string;
  minMultiple: number;
  maxMultiple: number;
  note: string;            // short qualifier shown in table
  drivers: string[];       // positive value drivers
  risks: string[];         // typical risk factors
  color: string;           // accent colour for card
}

const SECTORS: Sector[] = [
  {
    id: "healthcare",
    name: "Healthcare & Dental",
    emoji: "🏥",
    minMultiple: 3.5,
    maxMultiple: 4.8,
    note: "of SDE",
    drivers: ["Recurring patient base", "NHS contract revenue", "CQC registration moat"],
    risks: ["Regulatory risk", "Key-person dependency", "Recruitment pressure"],
    color: "#6366f1",
  },
  {
    id: "engineering",
    name: "Engineering & Manufacturing",
    emoji: "⚙️",
    minMultiple: 2.6,
    maxMultiple: 3.8,
    note: "of SDE",
    drivers: ["Long-term supply contracts", "Specialist equipment moat", "Export potential"],
    risks: ["Input cost volatility", "Skilled labour shortage", "CapEx requirements"],
    color: "#0891b2",
  },
  {
    id: "saas",
    name: "SaaS & Technology",
    emoji: "💻",
    minMultiple: 2.0,
    maxMultiple: 3.5,
    note: "of SDE (SME SaaS)",
    drivers: ["Recurring subscription revenue", "High gross margins", "Scalable delivery"],
    risks: ["Churn rate", "Technical debt", "Market saturation"],
    color: "#7c3aed",
  },
  {
    id: "logistics",
    name: "Logistics & Transport",
    emoji: "🚚",
    minMultiple: 2.2,
    maxMultiple: 3.4,
    note: "of SDE",
    drivers: ["Long-term haulage contracts", "Owned fleet assets", "Route density"],
    risks: ["Fuel cost exposure", "Driver shortage", "ULEZ / regulatory change"],
    color: "#0d9488",
  },
  {
    id: "retail",
    name: "Retail & E-commerce",
    emoji: "🛒",
    minMultiple: 1.8,
    maxMultiple: 2.8,
    note: "of SDE",
    drivers: ["Own-brand product margin", "Repeat purchase rate", "D2C channel"],
    risks: ["Seasonal cash flow", "Inventory risk", "Platform dependency (Amazon)"],
    color: "#ea580c",
  },
  {
    id: "professional",
    name: "Professional Services",
    emoji: "📊",
    minMultiple: 1.0,
    maxMultiple: 1.5,
    note: "of recurring fees",
    drivers: ["Retainer/recurring fee base", "Reputation & accreditation", "Client stickiness"],
    risks: ["Key-person risk", "Staff churn", "Non-recurring revenue mix"],
    color: "#d97706",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────── //

function fmtGbp(v: number): string {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(2)}m`;
  if (v >= 1_000)     return `£${(v / 1_000).toFixed(0)}k`;
  return `£${v}`;
}

function fmtMultiple(m: number): string {
  return `${m.toFixed(1)}×`;
}

// ─── Sector card ─────────────────────────────────────────────────────────── //

function SectorCard({
  sector,
  sde,
  highlight,
}: {
  sector: Sector;
  sde: number;
  highlight: boolean;
}) {
  const evLow  = sde * sector.minMultiple;
  const evHigh = sde * sector.maxMultiple;

  return (
    <div
      style={{
        background: highlight ? `linear-gradient(135deg, #0f172a 0%, ${sector.color}18 100%)` : "#0f172a",
        border: `1px solid ${highlight ? sector.color + "60" : "#1e293b"}`,
        borderRadius: 12,
        padding: "20px 22px",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: highlight ? `0 0 24px ${sector.color}22` : "none",
        cursor: "default",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = sector.color + "80";
        (e.currentTarget as HTMLElement).style.boxShadow  = `0 0 24px ${sector.color}30`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = highlight ? sector.color + "60" : "#1e293b";
        (e.currentTarget as HTMLElement).style.boxShadow  = highlight ? `0 0 24px ${sector.color}22` : "none";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{sector.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", marginBottom: 2 }}>
            {sector.name}
          </div>
          <div style={{ fontSize: 11, color: "#475569" }}>{sector.note}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: sector.color, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
            {fmtMultiple(sector.minMultiple)} – {fmtMultiple(sector.maxMultiple)}
          </div>
          <div style={{ fontSize: 10, color: "#475569" }}>multiple range</div>
        </div>
      </div>

      {/* EV band (shown when SDE > 0) */}
      {sde > 0 && (
        <div style={{
          background: `${sector.color}12`,
          border: `1px solid ${sector.color}30`,
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: sector.color, letterSpacing: "0.07em", flexShrink: 0 }}>
            <GlossaryTerm term="EV">EV</GlossaryTerm> RANGE
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>
            {fmtGbp(evLow)} – {fmtGbp(evHigh)}
          </span>
        </div>
      )}

      {/* Multiple bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ height: 6, borderRadius: 9999, background: "#1e293b", overflow: "hidden", position: "relative" }}>
          <div style={{
            position: "absolute",
            left: `${((sector.minMultiple - 1) / 5) * 100}%`,
            width: `${((sector.maxMultiple - sector.minMultiple) / 5) * 100}%`,
            height: "100%",
            background: sector.color,
            borderRadius: 9999,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "#334155" }}>
          <span>1×</span><span>2×</span><span>3×</span><span>4×</span><span>5×</span><span>6×</span>
        </div>
      </div>

      {/* Drivers / Risks */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#22c55e", letterSpacing: "0.09em", marginBottom: 6 }}>VALUE DRIVERS</div>
          {sector.drivers.map(d => (
            <div key={d} style={{ display: "flex", gap: 5, fontSize: 11, color: "#94a3b8", marginBottom: 3, lineHeight: 1.4 }}>
              <span style={{ color: "#22c55e", flexShrink: 0, marginTop: 1 }}>▸</span>{d}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#f87171", letterSpacing: "0.09em", marginBottom: 6 }}>RISK FACTORS</div>
          {sector.risks.map(r => (
            <div key={r} style={{ display: "flex", gap: 5, fontSize: 11, color: "#94a3b8", marginBottom: 3, lineHeight: 1.4 }}>
              <span style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }}>▸</span>{r}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/dashboard/triage?sector=${sector.id}&minMultiple=${sector.minMultiple}&maxMultiple=${sector.maxMultiple}`}
        style={{ display: "block", textDecoration: "none" }}
      >
        <button
          style={{
            width: "100%",
            background: sector.color,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 0",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.02em",
            transition: "opacity 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        >
          Use this Benchmark
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </Link>
    </div>
  );
}

// ─── SDE Slider ───────────────────────────────────────────────────────────── //

const SDE_MIN = 50_000;
const SDE_MAX = 1_000_000;
const SDE_STEP = 10_000;

function SdeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct = ((value - SDE_MIN) / (SDE_MAX - SDE_MIN)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Annual <GlossaryTerm term="SDE">SDE</GlossaryTerm> / Owner Earnings</span>
        <span style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#a5b4fc",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
        }}>
          {fmtGbp(value)}
        </span>
      </div>
      <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 8, borderRadius: 9999,
          background: `linear-gradient(90deg, #6366f1 ${pct}%, #1e293b ${pct}%)`,
          pointerEvents: "none",
        }} />
        <input
          type="range"
          min={SDE_MIN}
          max={SDE_MAX}
          step={SDE_STEP}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="slider slider-hc-blue"
          style={{ position: "relative", zIndex: 1, background: "transparent", width: "100%" }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#334155", marginTop: 4 }}>
        <span>£50k</span><span>£250k</span><span>£500k</span><span>£750k</span><span>£1m</span>
      </div>
    </div>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────── //

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative" }}>
      <svg
        style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569" }}
        width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" strokeWidth={2} />
        <path d="M21 21l-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Filter sectors…"
        style={{
          width: "100%",
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 9,
          padding: "11px 14px 11px 38px",
          fontSize: 13,
          color: "#f1f5f9",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={e => (e.currentTarget.style.borderColor = "#6366f1")}
        onBlur={e => (e.currentTarget.style.borderColor = "#1e293b")}
      />
    </div>
  );
}

// ─── Summary table ────────────────────────────────────────────────────────── //

function SummaryTable({ sectors, sde }: { sectors: Sector[]; sde: number }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #1e293b" }}>
            {[
              "Sector",
              "Multiple Range",
              sde > 0 ? "EV Low" : null,
              sde > 0 ? "EV High" : null,
              "Risk Profile",
            ].filter(Boolean).map(h => (
              <th key={h as string} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.09em", textTransform: "uppercase" }}>
                {h === "EV Low" || h === "EV High"
                  ? <><GlossaryTerm term="EV">EV</GlossaryTerm>{h === "EV Low" ? " Low" : " High"}</>
                  : h === "Multiple Range"
                  ? <GlossaryTerm term="ValuationMultiple">Multiple Range</GlossaryTerm>
                  : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sectors.map((s, i) => (
            <tr
              key={s.id}
              style={{ borderBottom: "1px solid #0f172a", background: i % 2 === 0 ? "#0a0f1e" : "transparent" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = `${s.color}10`)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "#0a0f1e" : "transparent")}
            >
              <td style={{ padding: "11px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{s.name}</span>
                </div>
              </td>
              <td style={{ padding: "11px 14px" }}>
                <span style={{ color: s.color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {fmtMultiple(s.minMultiple)} – {fmtMultiple(s.maxMultiple)}
                </span>
              </td>
              {sde > 0 && (
                <>
                  <td style={{ padding: "11px 14px", fontVariantNumeric: "tabular-nums", color: "#94a3b8" }}>
                    {fmtGbp(sde * s.minMultiple)}
                  </td>
                  <td style={{ padding: "11px 14px", fontVariantNumeric: "tabular-nums", color: "#f1f5f9", fontWeight: 600 }}>
                    {fmtGbp(sde * s.maxMultiple)}
                  </td>
                </>
              )}
              <td style={{ padding: "11px 14px" }}>
                <span style={{
                  background: s.maxMultiple >= 4 ? "rgba(99,102,241,0.12)" : s.maxMultiple >= 3 ? "rgba(13,148,136,0.12)" : "rgba(217,119,6,0.12)",
                  color: s.maxMultiple >= 4 ? "#a5b4fc" : s.maxMultiple >= 3 ? "#2dd4bf" : "#fbbf24",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 4,
                  letterSpacing: "0.05em",
                }}>
                  {s.maxMultiple >= 4 ? "PREMIUM" : s.maxMultiple >= 3 ? "STANDARD" : "LOWER"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────── //

export default function GuidePage() {
  const [sde, setSde]       = useState(0);
  const [query, setQuery]   = useState("");
  const [view, setView]     = useState<"cards" | "table">("cards");

  const filtered = useMemo(() =>
    SECTORS.filter(s => s.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const sliderActive = sde > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#050a14", color: "#f1f5f9" }}>
      {/* Top nav */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid #1e293b",
        background: "rgba(5,10,20,0.92)",
        backdropFilter: "blur(12px)",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        height: 56,
        gap: 16,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>T</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Triage Finance</span>
        </Link>
        <span style={{ color: "#1e293b" }}>·</span>
        <span style={{ fontSize: 13, color: "#475569" }}>Industry Valuation Guide</span>
        <div style={{ flex: 1 }} />
        <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
          <button style={{
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            Open Triage Workspace
            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </Link>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 80px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 40, maxWidth: 720 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.07em", marginBottom: 16 }}>
            UK M&A BENCHMARK DATA
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#f8fafc", margin: "0 0 14px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Industry Valuation Guide
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, margin: 0 }}>
            Benchmark <GlossaryTerm term="SDE">SDE</GlossaryTerm> multiples for UK SME acquisitions, sourced from live deal data and broker consensus ranges. Drag the slider to calculate <GlossaryTerm term="EV">enterprise value</GlossaryTerm> ranges across all sectors in real time.
          </p>
        </div>

        {/* SDE Calculator panel */}
        <div style={{
          background: "#0a0f1e",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: "24px 28px",
          marginBottom: 32,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.09em" }}>
              LIVE EV CALCULATOR
            </span>
            {sliderActive && (
              <span style={{ fontSize: 10, background: "rgba(99,102,241,0.12)", color: "#a5b4fc", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                ACTIVE — cards updating below
              </span>
            )}
          </div>
          <SdeSlider value={sde || SDE_MIN} onChange={setSde} />
          {!sliderActive && (
            <p style={{ fontSize: 12, color: "#334155", margin: "12px 0 0" }}>
              Move the slider to see enterprise value ranges populate across all sectors simultaneously.
            </p>
          )}
        </div>

        {/* Controls row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px" }}>
            <SearchBar value={query} onChange={setQuery} />
          </div>
          <div style={{ display: "flex", gap: 2, background: "#0a0f1e", borderRadius: 9, padding: 3, border: "1px solid #1e293b" }}>
            {(["cards", "table"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  background: view === v ? "#1e293b" : "transparent",
                  color: view === v ? "#f1f5f9" : "#475569",
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {v === "cards" ? "Cards" : "Table"}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "#334155" }}>
            {filtered.length} sector{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Content */}
        {view === "cards" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 18,
          }}>
            {filtered.map(s => (
              <SectorCard key={s.id} sector={s} sde={sliderActive ? sde : 0} highlight={sliderActive} />
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#334155" }}>
                No sectors match "{query}"
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden" }}>
            <SummaryTable sectors={filtered} sde={sliderActive ? sde : 0} />
          </div>
        )}

        {/* Methodology footer */}
        <div style={{
          marginTop: 56,
          padding: "24px 28px",
          background: "#0a0f1e",
          border: "1px solid #1e293b",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", marginBottom: 12 }}>
            METHODOLOGY & DISCLAIMER
          </div>
          <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.7, margin: 0 }}>
            Multiples represent the mid-market consensus range for profitable UK SMEs (SDE £100k – £2m) transacted via business brokers and corporate finance advisers (2022–2024). Healthcare/Dental premiums reflect NHS income multiples. Professional Services multiples are expressed as a factor of annual recurring fees rather than SDE. SaaS figures apply to SME MRR-based businesses, not VC-backed growth companies. Enterprise Value = Asking Price (debt-free, cash-free basis). All figures are indicative benchmarks only and do not constitute financial advice.{" "}
            <Link href="/dashboard/triage" style={{ color: "#6366f1", textDecoration: "none" }}>
              Use the Triage Workspace
            </Link>{" "}
            for a personalised deal analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
