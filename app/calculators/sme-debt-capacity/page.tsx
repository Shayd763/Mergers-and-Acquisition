"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/app/components/SiteNav";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FinancialProduct",
  "name": "UK SME Debt Capacity Calculator",
  "description": "Calculate how much acquisition debt a UK business can comfortably support based on target SDE and DSCR constraints.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" },
};

function Num({ label, val, color = "#0f172a", sub, bg = "#f8fafc", border = "#e2e8f0" }: { label: string; val: string; color?: string; sub?: string; bg?: string; border?: string }) {
  return (
    <div style={{ padding: "18px 16px", borderRadius: 12, background: bg, border: `1px solid ${border}`, textAlign: "center" }}>
      <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: "0 0 3px", letterSpacing: "-0.03em" }}>{val}</p>
      {sub && <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{sub}</p>}
    </div>
  );
}

const DEMO_SME = { sde: 180000, minDscr: 1.25, apr: 12, termYears: 5 };

export default function SMEDebtCapacityPage() {
  const [sde, setSde] = useState("");
  const [minDscr, setMinDscr] = useState("");
  const [apr, setApr] = useState("");
  const [termYears, setTermYears] = useState("");

  const sdeVal      = sde      === "" ? DEMO_SME.sde      : Number(sde);
  const minDscrVal  = minDscr  === "" ? DEMO_SME.minDscr  : Number(minDscr);
  const aprVal      = apr      === "" ? DEMO_SME.apr      : Number(apr);
  const termYearsVal = termYears === "" ? DEMO_SME.termYears : Number(termYears);

  const maxAnnualService = sdeVal / minDscrVal;
  const r = aprVal / 100;
  const maxLoan = r > 0 ? maxAnnualService * (1 - Math.pow(1 + r, -termYearsVal)) / r : maxAnnualService * termYearsVal;
  const monthlyPayment = maxAnnualService / 12;
  const totalRepaid = maxAnnualService * termYearsVal;
  const totalInterest = totalRepaid - maxLoan;

  const inputStyle: React.CSSProperties = { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit" };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <div style={{ background: "#f8fafc", minHeight: "100vh", color: "#0f172a", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.12) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#f8fafc 80%)", WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#f8fafc 80%)" }} />
        <SiteNav />

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "80px 24px 80px", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EXPO }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Free Calculator · UK SME M&A</p>
            <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 16px", color: "#0f172a" }}>
              UK SME Debt Capacity Calculator
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 580, lineHeight: 1.75, marginBottom: 24 }}>
              Find the maximum acquisition loan a UK business can support at a given SDE, target DSCR, and bank lending rate. Used by ETA buyers to reverse-engineer deal structures from a given income statement.
            </p>
          </motion.div>

          <div className="grid-2col" style={{ gap: 20, alignItems: "start" }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55, ease: EXPO }}
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 24 }}>Inputs</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { label: "Annual SDE / EBITDA", val: sde, set: setSde, step: 5000, demo: DEMO_SME.sde, pound: true },
                  { label: "Minimum DSCR Required", val: minDscr, set: setMinDscr, step: 0.05, min: 0.5, max: 5, demo: DEMO_SME.minDscr, pound: false },
                  { label: "Bank APR (%)", val: apr, set: setApr, step: 0.5, min: 1, max: 25, demo: DEMO_SME.apr, pound: false },
                  { label: "Loan Term (years)", val: termYears, set: setTermYears, step: 1, min: 1, max: 25, demo: DEMO_SME.termYears, pound: false },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>{f.label}</label>
                    <div style={{ position: "relative" }}>
                      {f.pound && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>£</span>}
                      <input type="number" value={f.val} step={f.step} min={f.min ?? 0} max={f.max ?? 10000000}
                        placeholder={String(f.demo)}
                        onChange={e => f.set(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: f.pound ? 28 : 14 }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.55, ease: EXPO }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "linear-gradient(135deg,#eef2ff,#f5f3ff)", border: "1px solid #c7d2fe", borderRadius: 16, padding: "28px", textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Maximum Supportable Loan</p>
                <p style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.05em", color: "#0f172a", margin: "0 0 4px", lineHeight: 1 }}>
                  £{maxLoan >= 1000000 ? (maxLoan / 1000000).toFixed(2) + "m" : Math.round(maxLoan / 1000) + "k"}
                </p>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>At DSCR {minDscr}× · {apr}% APR · {termYears}yr term</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Num label="Max Annual Service"  val={`£${Math.round(maxAnnualService).toLocaleString()}`} color="#4f46e5" bg="#eef2ff" border="#c7d2fe" />
                <Num label="Monthly Payment"     val={`£${Math.round(monthlyPayment).toLocaleString()}`}   color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" />
                <Num label="Total Repaid"        val={`£${Math.round(totalRepaid).toLocaleString()}`}      color="#334155" />
                <Num label="Total Interest"      val={`£${Math.round(totalInterest).toLocaleString()}`}    color="#dc2626" bg="#fef2f2" border="#fecaca" />
              </div>

              <div style={{ padding: "14px 16px", borderRadius: 12, background: "#eef2ff", border: "1px solid #c7d2fe" }}>
                <p style={{ fontSize: 12, color: "#4338ca", margin: 0, lineHeight: 1.65 }}>
                  <strong>How to use:</strong> If the seller is asking more than £{Math.round(maxLoan / 1000)}k, you need additional vendor finance or buyer equity to bridge the gap while staying above your DSCR floor.
                </p>
              </div>

              <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Model a full deal <ArrowRight size={15} />
                </motion.button>
              </Link>
            </motion.div>
          </div>

          <div style={{ marginTop: 40, borderTop: "1px solid #e2e8f0", paddingTop: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 14 }}>Related Calculators</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["/calculators/dscr-calculator", "/calculators/sde-to-ebitda", "/calculators/stamp-duty", "/calculators/compound-interest-calculator"].map(h => (
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
