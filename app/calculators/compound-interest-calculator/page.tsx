"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/app/components/SiteNav";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Compound Interest Return Calculator",
  "applicationCategory": "FinanceApplication",
  "description": "Model compounding equity returns on a UK business acquisition over a 5-10 year hold period, including annual distributions and exit multiple sensitivity.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" },
};

export default function CompoundInterestPage() {
  const [initial, setInitial]           = useState("");
  const [annualReturn, setAnnualReturn] = useState("");
  const [annualDist, setAnnualDist]     = useState("");
  const [years, setYears]               = useState("");

  const initialVal      = Number(initial)      || 0;
  const annualReturnVal = Number(annualReturn) || 0;
  const annualDistVal   = Number(annualDist)   || 0;
  const yearsVal        = Number(years)        || 1;

  const schedule = useMemo(() => {
    const rows: { year: number; value: number; growth: number; distribution: number; total: number }[] = [];
    let value = initialVal;
    let totalDist = 0;
    for (let y = 1; y <= yearsVal; y++) {
      const growth = value * (annualReturnVal / 100);
      const newValue = value + growth - annualDistVal;
      totalDist += annualDistVal;
      rows.push({ year: y, value: Math.max(0, newValue), growth, distribution: annualDistVal, total: Math.max(0, newValue) + totalDist });
      value = Math.max(0, newValue);
    }
    return rows;
  }, [initialVal, annualReturnVal, annualDistVal, yearsVal]);

  const finalRow   = schedule[schedule.length - 1];
  const totalReturn = finalRow ? finalRow.total - initialVal : 0;
  const moic       = finalRow && initialVal > 0 ? finalRow.total / initialVal : 1;
  const totalDist  = annualDistVal * yearsVal;

  const inputStyle: React.CSSProperties = { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit" };
  const inputStylePound: React.CSSProperties = { ...inputStyle, paddingLeft: 28 };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <div style={{ background: "#f8fafc", minHeight: "100vh", color: "#0f172a", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.12) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#f8fafc 80%)", WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#f8fafc 80%)" }} />
        <SiteNav />

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px 80px", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EXPO }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Free Calculator · Acquisition ROI Modelling</p>
            <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 16px", color: "#0f172a" }}>
              Compound Interest Return Calculator
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 620, lineHeight: 1.75, marginBottom: 24 }}>
              Model compounding equity returns on your personal investment in a UK business acquisition. Includes annual distributions (your levered free cash flow take-home) and a terminal exit value.
            </p>
          </motion.div>

          <div className="grid-2col" style={{ gap: 20, alignItems: "start" }}>
            {/* Inputs */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55, ease: EXPO }}
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em" }}>Inputs</p>
              {[
                { label: "Initial Equity Investment", val: initial, set: setInitial, pound: true, step: 5000, hint: "Your personal equity stake" },
                { label: "Annual Return Rate (%)", val: annualReturn, set: setAnnualReturn, pound: false, step: 1, hint: "IRR target or historical growth" },
                { label: "Annual Distribution (£)", val: annualDist, set: setAnnualDist, pound: true, step: 1000, hint: "Levered FCF you take home annually" },
                { label: "Hold Period (years)", val: years, set: setYears, pound: false, step: 1, hint: "Typical ETA hold: 3–7 years" },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 4 }}>{f.label}</label>
                  {f.hint && <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 6px" }}>{f.hint}</p>}
                  <div style={{ position: "relative" }}>
                    {f.pound && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>£</span>}
                    <input type="number" value={f.val} step={f.step} min={0}
                      onChange={e => f.set(e.target.value)}
                      style={f.pound ? inputStylePound : inputStyle} />
                  </div>
                </div>
              ))}

              {/* Summary metrics */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Total Distributions", val: `£${totalDist.toLocaleString()}`,                           color: "#1e3a8a" },
                  { label: "Final Equity Value",  val: `£${Math.round(finalRow?.value ?? 0).toLocaleString()}`,    color: "#2563eb" },
                  { label: "Total Value",         val: `£${Math.round(finalRow?.total ?? 0).toLocaleString()}`,    color: "#059669" },
                  { label: "MOIC",                val: `${moic.toFixed(2)}×`,                                      color: "#d97706" },
                  { label: "Net Gain",            val: `£${Math.round(totalReturn).toLocaleString()}`,             color: "#059669" },
                ].map(m => (
                  <div key={m.label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{m.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Year-by-year table + visual */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.55, ease: EXPO }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Bar chart */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 20 }}>Total Value Over Time</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
                  {[{ year: 0, total: initialVal }, ...schedule].map((r, i) => {
                    const maxVal = Math.max(initialVal, ...(schedule.map(s => s.total)));
                    const heightPct = maxVal > 0 ? (r.total / maxVal) * 100 : 0;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: "#64748b" }}>£{r.total >= 1000000 ? (r.total / 1000000).toFixed(1) + "m" : Math.round(r.total / 1000) + "k"}</span>
                        <div style={{ width: "100%", height: `${heightPct}%`, background: i === 0 ? "#e2e8f0" : `linear-gradient(180deg, #2563eb, #1e3a8a)`, borderRadius: "4px 4px 0 0", minHeight: 4, transition: "height 0.3s" }} />
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>Y{r.year}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Year table */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                  {["Year", "Growth", "Distribution", "Equity Value", "Total Value"].map(h => (
                    <span key={h} style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
                  ))}
                </div>
                {schedule.map((r, i) => (
                  <div key={r.year} style={{
                    display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr 1fr",
                    padding: "12px 20px",
                    borderBottom: i < schedule.length - 1 ? "1px solid #f1f5f9" : "none",
                    background: i % 2 === 0 ? "transparent" : "#fafafa",
                  }}>
                    <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 700 }}>Y{r.year}</span>
                    <span style={{ fontSize: 13, color: "#059669" }}>+£{Math.round(r.growth).toLocaleString()}</span>
                    <span style={{ fontSize: 13, color: "#1e3a8a" }}>£{r.distribution.toLocaleString()}</span>
                    <span style={{ fontSize: 13, color: "#64748b" }}>£{Math.round(r.value).toLocaleString()}</span>
                    <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>£{Math.round(r.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#2563eb,#1e3a8a)", color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Model an acquisition <ArrowRight size={15} />
                </motion.button>
              </Link>
            </motion.div>
          </div>

          <div style={{ marginTop: 40, borderTop: "1px solid #e2e8f0", paddingTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["/calculators/dscr-calculator", "/calculators/sme-debt-capacity", "/calculators/sde-to-ebitda", "/calculators/stamp-duty"].map(h => (
              <Link key={h} href={h} style={{ padding: "8px 16px", borderRadius: 9999, background: "#fff", border: "1px solid #e2e8f0", color: "#475569", fontSize: 13, textDecoration: "none" }}>
                {h.split("/").pop()!.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
