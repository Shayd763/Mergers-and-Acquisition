"use client";
import React, { useState } from "react";
import { GlossaryTerm } from "@/app/components/GlossaryTerm";

// ─── Types ────────────────────────────────────────────────────────────────── //

interface ReconciliationFlag {
  flag_type: string;
  status: "AMBER" | "BLUE" | "GREEN" | "RED";
  title: string;
  message: string;
  detail?: string | null;
}

interface MultipleAdjustment {
  base_max_multiple: number;
  adjusted_max_multiple: number;
  adjustment_pct: number;
  adjustment_reason: string;
}

export interface ReconciliationResult {
  flags: ReconciliationFlag[];
  multiple_adjustment: MultipleAdjustment;
  company_age_years: number | null;
  reconciliation_score: "CLEAN" | "REVIEW" | "ALERT";
  summary: string;
  registry_company_name: string;
  registry_company_number: string;
  registry_charges_count: number;
  registry_directors_count: number;
  registry_date_of_creation: string | null;
  registry_sic_codes: string[];
}

interface ExtractedDeal {
  asking_price?: number | null;
  turnover?: number | null;
  net_profit?: number | null;
  add_backs?: number | null;
  business_type?: string | null;
  location?: string | null;
}

interface Props {
  result: ReconciliationResult;
  extracted: ExtractedDeal;
}

// ─── Helpers ─────────────────────────────────────────────────────────────── //

function fmtGbp(v: number | null | undefined): string {
  if (v == null) return "—";
  if (Math.abs(v) >= 1_000_000) return `£${(v / 1_000_000).toFixed(2)}m`;
  if (Math.abs(v) >= 1_000) return `£${(v / 1_000).toFixed(0)}k`;
  return `£${v.toFixed(0)}`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function scoreColor(score: string) {
  if (score === "ALERT") return { bg: "#7f1d1d", text: "#fca5a5", dot: "#ef4444" };
  if (score === "REVIEW") return { bg: "#1e3a5f", text: "#93c5fd", dot: "#3b82f6" };
  return { bg: "#14532d", text: "#86efac", dot: "#22c55e" };
}

function flagColors(status: string) {
  if (status === "AMBER" || status === "RED")
    return { border: "#d97706", bg: "rgba(217,119,6,0.08)", badge: "#92400e", badgeText: "#fbbf24" };
  if (status === "BLUE")
    return { border: "#3b82f6", bg: "rgba(59,130,246,0.08)", badge: "#1e3a5f", badgeText: "#93c5fd" };
  return { border: "#22c55e", bg: "rgba(34,197,94,0.08)", badge: "#14532d", badgeText: "#86efac" };
}

// ─── FlagCard ─────────────────────────────────────────────────────────────── //

function FlagCard({ flag }: { flag: ReconciliationFlag }) {
  const [expanded, setExpanded] = useState(false);
  const c = flagColors(flag.status);

  return (
    <div
      style={{
        border: `1px solid ${c.border}`,
        background: c.bg,
        borderRadius: 8,
        padding: "12px 14px",
        marginBottom: 10,
        cursor: flag.detail ? "pointer" : "default",
      }}
      onClick={() => flag.detail && setExpanded(e => !e)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span
          style={{
            background: c.badge,
            color: c.badgeText,
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
            flexShrink: 0,
            marginTop: 1,
            letterSpacing: "0.04em",
          }}
        >
          {flag.status}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9", marginBottom: 4 }}>
            {flag.title}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.55 }}>
            {flag.message}
          </div>
          {expanded && flag.detail && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 10px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 5,
                fontSize: 11.5,
                color: "#cbd5e1",
                lineHeight: 1.6,
              }}
            >
              {flag.detail}
            </div>
          )}
        </div>
        {flag.detail && (
          <span style={{ color: "#475569", fontSize: 16, marginTop: 1, flexShrink: 0 }}>
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────── //

export function ForensicAuditPanel({ result, extracted }: Props) {
  const sc = scoreColor(result.reconciliation_score);
  const adj = result.multiple_adjustment;
  const adjSign = adj.adjustment_pct >= 0 ? "+" : "";
  const adjPct = `${adjSign}${(adj.adjustment_pct * 100).toFixed(0)}%`;

  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #1e293b",
        marginTop: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#0a0f1e",
          borderBottom: "1px solid #1e293b",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 2 }}>
            FORENSIC AUDIT · RECONCILIATION ENGINE
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
            {result.registry_company_name || "Unknown Company"}
            <span style={{ fontSize: 12, color: "#475569", marginLeft: 8, fontWeight: 400 }}>
              #{result.registry_company_number}
            </span>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              background: sc.bg,
              color: sc.text,
              fontWeight: 700,
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 6,
              letterSpacing: "0.06em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: sc.dot,
                display: "inline-block",
                boxShadow: `0 0 6px ${sc.dot}`,
              }}
            />
            {result.reconciliation_score}
          </span>
        </div>
      </div>

      {/* Summary bar */}
      <div
        style={{
          padding: "10px 20px",
          background: "#111827",
          borderBottom: "1px solid #1e293b",
          fontSize: 12.5,
          color: "#94a3b8",
        }}
      >
        {result.summary}
      </div>

      {/* Triple-column body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 0,
        }}
        className="forensic-grid"
      >
        {/* Column 1: Registry */}
        <div style={{ padding: "18px 16px", borderRight: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", marginBottom: 14 }}>
            REGISTRY DATA
          </div>

          <DataRow label="Incorporated" value={fmtDate(result.registry_date_of_creation)} />
          {result.company_age_years != null && (
            <DataRow label="Age" value={`${result.company_age_years} yrs`} />
          )}
          <DataRow label="Active Officers" value={String(result.registry_directors_count)} />
          <DataRow
            label={<GlossaryTerm term="OutstandingCharges">Charges</GlossaryTerm>}
            value={result.registry_charges_count > 0
              ? `${result.registry_charges_count} outstanding`
              : "None registered"}
            valueColor={result.registry_charges_count > 0 ? "#fbbf24" : "#22c55e"}
          />
          {result.registry_sic_codes.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}><GlossaryTerm term="SICCode">SIC Codes</GlossaryTerm></div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {result.registry_sic_codes.map(c => (
                  <span
                    key={c}
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      color: "#a5b4fc",
                      fontSize: 10.5,
                      padding: "2px 7px",
                      borderRadius: 4,
                      fontFamily: "monospace",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 2: IM Claims */}
        <div style={{ padding: "18px 16px", borderRight: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", marginBottom: 14 }}>
            IM CLAIMS
          </div>
          <DataRow label="Asking Price" value={fmtGbp(extracted.asking_price)} />
          <DataRow label={<GlossaryTerm term="Revenue">Turnover</GlossaryTerm>} value={fmtGbp(extracted.turnover)} />
          <DataRow label={<GlossaryTerm term="NetProfit">Net Profit</GlossaryTerm>} value={fmtGbp(extracted.net_profit)} />
          <DataRow label={<GlossaryTerm term="AddBacks">Add-backs</GlossaryTerm>} value={fmtGbp(extracted.add_backs)} />
          {extracted.business_type && (
            <DataRow label="Sector" value={extracted.business_type} />
          )}
          {extracted.location && (
            <DataRow label="Location" value={extracted.location} />
          )}

          {/* Multiple Adjustment */}
          <div
            style={{
              marginTop: 18,
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: 7,
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>
              <GlossaryTerm term="ValuationMultiple">MULTIPLE ADJUSTMENT</GlossaryTerm>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>
                {adj.adjusted_max_multiple.toFixed(2)}×
              </span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                max <GlossaryTerm term="SDE">SDE</GlossaryTerm> multiple
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              Base {adj.base_max_multiple}× &nbsp;·&nbsp;
              <span style={{ color: adj.adjustment_pct >= 0 ? "#86efac" : "#fca5a5" }}>
                {adjPct}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
              {adj.adjustment_reason}
            </div>
          </div>
        </div>

        {/* Column 3: Flags */}
        <div style={{ padding: "18px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", marginBottom: 14 }}>
            AUDIT FLAGS ({result.flags.length})
          </div>
          {result.flags.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: "#22c55e",
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>✓</div>
              No material flags raised
            </div>
          ) : (
            result.flags.map((f, i) => <FlagCard key={i} flag={f} />)
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DataRow ──────────────────────────────────────────────────────────────── //

function DataRow({
  label,
  value,
  valueColor,
}: {
  label: React.ReactNode;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 8,
        gap: 8,
      }}
    >
      <span style={{ fontSize: 11.5, color: "#475569", flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: valueColor ?? "#cbd5e1",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
