"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Info } from "lucide-react";

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
  const [netProfit, setNetProfit] = useState(120000);
  const [ownerSalary, setOwnerSalary] = useState(55000);
  const [ownerPerks, setOwnerPerks] = useState(12000);
  const [oneOffCosts, setOneOffCosts] = useState(8000);
  const [depreciation, setDepreciation] = useState(15000);
  const [amortisation, setAmortisation] = useState(5000);
  const [interest, setInterest] = useState(6000);
  const [replacementMgrSalary, setReplacementMgrSalary] = useState(65000);

  const sde = netProfit + ownerSalary + ownerPerks + oneOffCosts;
  const ebitda = netProfit + depreciation + amortisation + interest;
  const adjustedEbitda = sde - replacementMgrSalary;
  const sdeMultiple = 3.5;
  const ebitdaMultiple = 5.0;
  const sdeValuation = sde * sdeMultiple;
  const ebitdaValuation = ebitda * ebitdaMultiple;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 10, padding: "11px 14px 11px 28px", fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit",
  };

  const fields: [string, number, (n: number) => void][] = [
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
        <nav style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", border: "1px solid #e2e8f0", borderRadius: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart3 size={12} color="#fff" /></div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Triage Finance</span>
          </Link>
          <span style={{ color: "#e2e8f0" }}>·</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>SDE → EBITDA Bridge</span>
        </nav>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px 80px", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EXPO }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Free Calculator · ETA & Search Fund Tool</p>
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
              {fields.map(([label, val, set]) => (
                <div key={label}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>{label}</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>£</span>
                    <input type="number" value={val} step={1000} min={0} onChange={e => set(Number(e.target.value))} style={inputStyle} />
                  </div>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#d97706", display: "block", marginBottom: 6 }}>Replacement Manager Salary</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>£</span>
                  <input type="number" value={replacementMgrSalary} step={1000} min={0} onChange={e => setReplacementMgrSalary(Number(e.target.value))} style={inputStyle} />
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
                  { label: "Net Profit",         val: netProfit,                                    color: "#334155" },
                  { label: "+ Owner Salary",      val: ownerSalary,                                  color: "#059669" },
                  { label: "+ Owner Perks",       val: ownerPerks,                                   color: "#059669" },
                  { label: "+ One-off Costs",     val: oneOffCosts,                                  color: "#059669" },
                  { label: "= SDE",               val: sde,                                          color: "#4f46e5", bold: true },
                  { label: "− Replacement Mgr",   val: -replacementMgrSalary,                        color: "#dc2626" },
                  { label: "= Adjusted SDE",      val: adjustedEbitda,                               color: "#7c3aed", bold: true },
                  { label: "+ D&A + Interest",    val: depreciation + amortisation + interest,       color: "#d97706" },
                  { label: "= EBITDA",            val: ebitda,                                       color: "#d97706", bold: true },
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
                  { label: `SDE Valuation (${sdeMultiple}×)`,    val: `£${(sdeValuation / 1000).toFixed(0)}k`,   color: "#4f46e5", bg: "#eef2ff",  border: "#c7d2fe", sub: "Owner-operator model" },
                  { label: `EBITDA Valuation (${ebitdaMultiple}×)`, val: `£${(ebitdaValuation / 1000).toFixed(0)}k`, color: "#d97706", bg: "#fffbeb",  border: "#fde68a", sub: "Hired-management model" },
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
                  The gap between SDE and EBITDA valuation (£{Math.abs((sdeValuation - ebitdaValuation) / 1000).toFixed(0)}k) represents the value you capture by working in the business vs hiring a manager.
                </p>
              </div>

              <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
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
