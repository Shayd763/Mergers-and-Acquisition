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
  "name": "SME DSCR Calculator",
  "applicationCategory": "FinanceApplication",
  "description": "Calculate the Debt Service Coverage Ratio (DSCR) for a UK SME acquisition. Instantly assess whether a business generates enough cash to service its acquisition debt.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" },
  "operatingSystem": "Web",
};

function InputRow({ label, value, onChange, prefix = "£", min = 0, max = 10000000, step = 1000, hint }: {
  label: string; value: number; onChange: (n: number) => void;
  prefix?: string; min?: number; max?: number; step?: number; hint?: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: "#94a3b8" }}>{hint}</span>}
      </div>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>{prefix}</span>}
        <input
          type="number" value={value} min={min} max={max} step={step}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0",
            borderRadius: 10, padding: prefix ? "11px 14px 11px 28px" : "11px 14px",
            fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit",
          }}
        />
      </div>
    </div>
  );
}

export default function DSCRCalculatorPage() {
  const [sde, setSde] = useState(180000);
  const [annualDebt, setAnnualDebt] = useState(95000);
  const [corpTax, setCorpTax] = useState(25);

  const taxCharge = sde * (corpTax / 100);
  const netCashAfterTax = sde - taxCharge;
  const dscr = annualDebt > 0 ? netCashAfterTax / annualDebt : 99;
  const dscrRaw = annualDebt > 0 ? sde / annualDebt : 99;

  const band =
    dscr >= 1.5  ? { label: "STRONG",     color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", text: "Excellent debt service. Most mainstream commercial lenders will approve at this level." }
    : dscr >= 1.25 ? { label: "ACCEPTABLE", color: "#d97706", bg: "#fffbeb", border: "#fde68a", text: "Meets the standard 1.25× lender minimum. Bankable with most UK commercial banks." }
    : dscr >= 1.0  ? { label: "MARGINAL",   color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", text: "Below lender minimum. Will require additional security, personal guarantees, or vendor finance." }
    : { label: "UNBANKABLE", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", text: "The business cannot service this level of debt. Reduce borrowing or increase SDE." };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <div style={{ background: "#f8fafc", minHeight: "100vh", color: "#0f172a", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.12) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#f8fafc 80%)", WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#f8fafc 80%)" }} />

        <SiteNav />

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "80px 24px 80px", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EXPO }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Free Calculator · No account required</p>
            <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 16px", color: "#0f172a" }}>
              SME DSCR Calculator
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 560, lineHeight: 1.75, marginBottom: 24 }}>
              Debt Service Coverage Ratio (DSCR) is the primary metric UK commercial lenders use to assess whether a business can comfortably repay acquisition debt. A DSCR above 1.25× is the standard minimum.
            </p>
          </motion.div>

          <div className="grid-2col" style={{ gap: 20, alignItems: "start" }}>
            {/* Inputs */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55, ease: EXPO }}
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 24 }}>Inputs</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <InputRow label="Annual SDE (Seller's Discretionary Earnings)" value={sde} onChange={setSde} step={5000} hint="Net profit + add-backs" />
                <InputRow label="Total Annual Debt Service" value={annualDebt} onChange={setAnnualDebt} step={1000} hint="Bank repayments + vendor payments" />
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Corporation Tax Rate (%)</label>
                  <input type="number" value={corpTax} min={0} max={50} step={1} onChange={e => setCorpTax(Number(e.target.value))}
                    style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit" }} />
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>UK main rate is 25% for profits above £250k</p>
                </div>
              </div>
            </motion.div>

            {/* Results */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.55, ease: EXPO }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* DSCR badge */}
              <div style={{ background: band.bg, border: `1px solid ${band.border}`, borderRadius: 16, padding: "28px", textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: band.color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>DSCR (Post-Tax)</p>
                <p style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-0.05em", color: band.color, margin: "0 0 6px", lineHeight: 1 }}>
                  {dscr > 50 ? "∞" : dscr.toFixed(2)}×
                </p>
                <p style={{ fontSize: 12, fontWeight: 700, color: band.color, margin: "0 0 12px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{band.label}</p>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65, margin: 0 }}>{band.text}</p>
              </div>

              {/* Breakdown */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 16 }}>Breakdown</p>
                {[
                  { label: "SDE (pre-tax)", val: `£${sde.toLocaleString()}`, color: "#334155" },
                  { label: `Corp. Tax (${corpTax}%)`, val: `−£${Math.round(taxCharge).toLocaleString()}`, color: "#dc2626" },
                  { label: "Net Cash Available", val: `£${Math.round(netCashAfterTax).toLocaleString()}`, color: "#059669" },
                  { label: "Annual Debt Service", val: `£${annualDebt.toLocaleString()}`, color: "#d97706" },
                  { label: "DSCR (pre-tax)", val: `${dscrRaw.toFixed(2)}×`, color: "#4f46e5" },
                  { label: "DSCR (post-tax)", val: `${dscr > 50 ? "∞" : dscr.toFixed(2)}×`, color: band.color, bold: true },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: r.bold ? 700 : 600, color: r.color }}>{r.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: "14px 16px", borderRadius: 12, background: "#eef2ff", border: "1px solid #c7d2fe", display: "flex", gap: 10 }}>
                <Info size={13} color="#4f46e5" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: "#4f46e5", margin: 0, lineHeight: 1.65 }}>
                  UK commercial lenders (OakNorth, ThinCats, HSBC) require a minimum 1.25× DSCR. Conservative lenders prefer 1.35×+.
                </p>
              </div>

              <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Run full deal triage <ArrowRight size={15} />
                </motion.button>
              </Link>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            style={{ marginTop: 48, borderTop: "1px solid #e2e8f0", paddingTop: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 16 }}>Related Calculators</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { href: "/calculators/sme-debt-capacity", label: "SME Debt Capacity" },
                { href: "/calculators/sde-to-ebitda", label: "SDE → EBITDA Bridge" },
                { href: "/calculators/stamp-duty", label: "Stamp Duty" },
                { href: "/calculators/compound-interest-calculator", label: "Compound Return" },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ padding: "8px 16px", borderRadius: 9999, background: "#fff", border: "1px solid #e2e8f0", color: "#475569", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
