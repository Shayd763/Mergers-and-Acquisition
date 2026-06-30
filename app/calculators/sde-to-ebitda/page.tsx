"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Info } from "lucide-react";
import { SiteNav } from "@/app/components/SiteNav";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SDE to EBITDA Bridge Tool",
  "applicationCategory": "FinanceApplication",
  "description": "Convert Seller's Discretionary Earnings (SDE) to EBITDA for UK SME acquisitions. Understand how your deal metrics change when switching from owner-operator to hired management.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" },
};

export default function SDEToEBITDAPage() {
  const [netProfit, setNetProfit] = useState("");
  const [ownerSalary, setOwnerSalary] = useState("");
  const [ownerPerks, setOwnerPerks] = useState("");
  const [oneOffCosts, setOneOffCosts] = useState("");
  const [depreciation, setDepreciation] = useState("");
  const [amortisation, setAmortisation] = useState("");
  const [interest, setInterest] = useState("");
  const [replacementMgrSalary, setReplacementMgrSalary] = useState("");

  const npV  = Number(netProfit)          || 0;
  const osV  = Number(ownerSalary)        || 0;
  const opV  = Number(ownerPerks)         || 0;
  const ocV  = Number(oneOffCosts)        || 0;
  const depV = Number(depreciation)       || 0;
  const amoV = Number(amortisation)       || 0;
  const intV = Number(interest)           || 0;
  const rmV  = Number(replacementMgrSalary) || 0;

  const [sector, setSector] = useState("Engineering / Manufacturing");
  const SECTOR_SDE_MULTIPLES: Record<string, [number, number]> = {
    "Healthcare / Dental":      [3.5, 4.8],
    "Engineering / Manufacturing": [2.6, 3.8],
    "SaaS / Technology":        [2.0, 3.5],
    "Logistics / Transport":    [2.2, 3.4],
    "Retail / E-commerce":      [1.8, 2.8],
    "Professional Services":    [1.0, 1.5],
  };
  const [sdeMin, sdeMax] = SECTOR_SDE_MULTIPLES[sector] ?? [2.5, 3.5];
  const sdeMidMultiple = (sdeMin + sdeMax) / 2;
  const ebitdaMultiple = 5.0; // generic institutional buyer benchmark

  const sde = npV + osV + opV + ocV;
  const ebitda = npV + depV + amoV + intV;
  const adjustedEbitda = sde - rmV;
  const sdeValuation = sde * sdeMidMultiple;
  const ebitdaValuation = ebitda * ebitdaMultiple;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 10, padding: "11px 14px 11px 28px", fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit",
  };

  const fields: [string, string, (s: string) => void][] = [
    ["Net Profit (after tax)", netProfit, setNetProfit],
    ["Owner / Director Salary", ownerSalary, setOwnerSalary],
    ["Personal Perks & Benefits", ownerPerks, setOwnerPerks],
    ["One-off / Non-recurring Costs", oneOffCosts, setOneOffCosts],
    ["Depreciation (D&A)", depreciation, setDepreciation],
    ["Amortisation", amortisation, setAmortisation],
    ["Interest Expense", interest, setInterest],
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <div style={{ background: "#f8fafc", minHeight: "100vh", color: "#0f172a", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.12) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#f8fafc 80%)", WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#f8fafc 80%)" }} />
        <SiteNav />

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px 80px", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EXPO }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Free Calculator · ETA & Search Fund Tool</p>
            <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 16px", color: "#0f172a" }}>
              SDE to EBITDA Bridge Tool
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 620, lineHeight: 1.75, marginBottom: 24 }}>
              SDE (Seller's Discretionary Earnings) measures value to an owner-operator. EBITDA measures value to a corporate buyer or investor. This tool bridges the gap — showing how your valuation changes based on your operating model.
            </p>
          </motion.div>

          <div className="grid-2col" style={{ gap: 20 }}>
            {/* Inputs */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55, ease: EXPO }}
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 8px" }}>Financial Inputs</p>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Sector</label>
                <select value={sector} onChange={e => setSector(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 14, cursor: "pointer" }}>
                  {Object.keys(SECTOR_SDE_MULTIPLES).map(s => <option key={s}>{s}</option>)}
                </select>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>SDE range: {sdeMin}× – {sdeMax}× for {sector}</p>
              </div>
              {fields.map(([label, val, set]) => (
                <div key={label}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>{label}</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>£</span>
                    <input type="number" value={val} step={1000} min={0} onChange={e => set(e.target.value)} style={inputStyle} />
                  </div>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#d97706", display: "block", marginBottom: 6 }}>Replacement Manager Salary</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>£</span>
                  <input type="number" value={replacementMgrSalary} step={1000} min={0} onChange={e => setReplacementMgrSalary(e.target.value)} style={inputStyle} />
                </div>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>Cost of hired GM if you don&apos;t plan to work in the business</p>
              </div>
            </motion.div>

            {/* Results */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.55, ease: EXPO }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Bridge waterfall */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 18 }}>Reconciliation Bridge</p>
                {[
                  { label: "Net Profit",         val: npV,                                    color: "#334155" },
                  { label: "+ Owner Salary",      val: osV,                                   color: "#059669" },
                  { label: "+ Owner Perks",       val: opV,                                   color: "#059669" },
                  { label: "+ One-off Costs",     val: ocV,                                   color: "#059669" },
                  { label: "= SDE",               val: sde,                                   color: "#2563eb", bold: true },
                  { label: "− Replacement Mgr",   val: -rmV,                                  color: "#dc2626" },
                  { label: "= Adjusted SDE",      val: adjustedEbitda,                        color: "#1e3a8a", bold: true },
                  { label: "+ D&A + Interest",    val: depV + amoV + intV,                   color: "#d97706" },
                  { label: "= EBITDA",            val: ebitda,                                color: "#d97706", bold: true },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: r.bold ? "2px solid #e2e8f0" : "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 13, color: r.bold ? "#334155" : "#64748b", fontWeight: r.bold ? 700 : 400 }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: r.bold ? 800 : 600, color: r.color }}>
                      {r.val >= 0 ? `£${r.val.toLocaleString()}` : `−£${Math.abs(r.val).toLocaleString()}`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Valuations */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: `SDE Valuation (${sdeMidMultiple.toFixed(1)}× mid)`, val: `£${(sdeValuation / 1000).toFixed(0)}k`, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", sub: `${sector} range: ${sdeMin}×–${sdeMax}×` },
                  { label: `EBITDA Valuation (${ebitdaMultiple}×)`, val: `£${(ebitdaValuation / 1000).toFixed(0)}k`, color: "#d97706", bg: "#fffbeb", border: "#fde68a", sub: "Generic institutional buyer" },
                ].map(m => (
                  <div key={m.label} style={{ padding: "18px 16px", borderRadius: 14, background: m.bg, border: `1px solid ${m.border}`, textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: m.color, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700 }}>{m.label}</p>
                    <p style={{ fontSize: 26, fontWeight: 800, color: m.color, margin: "0 0 4px", letterSpacing: "-0.03em" }}>{m.val}</p>
                    <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{m.sub}</p>
                  </div>
                ))}
              </div>

              <div style={{ padding: "14px 16px", borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", gap: 10 }}>
                <Info size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.65 }}>
                  The gap between SDE and EBITDA valuation (£{Math.abs((sdeValuation - ebitdaValuation) / 1000).toFixed(0)}k) represents the value you capture by working in the business vs hiring a manager. SDE multiple uses the mid-point of the {sector} sector range.
                </p>
              </div>

              <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#2563eb,#1e3a8a)", color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Full deal triage <ArrowRight size={15} />
                </motion.button>
              </Link>
            </motion.div>
          </div>

          <div style={{ marginTop: 40, borderTop: "1px solid #e2e8f0", paddingTop: 28 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["/calculators/dscr-calculator", "/calculators/sme-debt-capacity", "/calculators/stamp-duty", "/calculators/compound-interest-calculator"].map(h => (
                <Link key={h} href={h} style={{ padding: "8px 16px", borderRadius: 9999, background: "#fff", border: "1px solid #e2e8f0", color: "#475569", fontSize: 13, textDecoration: "none" }}>
                  {h.split("/").pop()!.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
