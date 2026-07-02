"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import type { SectorData, CityData, MockCompany, Sector, City } from "@/config/seoData";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EXPO } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ─── Mini capital playground ────────────────────────────────────────────── */
function CapitalPlayground({ defaultPrice, avgMultiple, avgNetProfit, avgAddBacks }: {
  defaultPrice: number; avgMultiple: number; avgNetProfit: number; avgAddBacks: number;
}) {
  const [equity, setEquity] = useState(25);
  const [vendor, setVendor] = useState(20);
  const bank = 100 - equity - vendor;
  const totalCost = Math.round(defaultPrice * 1.05);
  const equityAmt = Math.round(totalCost * equity / 100);
  const vendorAmt = Math.round(totalCost * vendor / 100);
  const bankAmt = Math.round(totalCost * bank / 100);
  const sde = avgNetProfit + avgAddBacks;
  const annualDebt = bankAmt * (0.12 / (1 - Math.pow(1.06, -5)));
  const dscr = annualDebt > 0 ? sde / annualDebt : 99;
  const dscrOk = dscr >= 1.25;

  const handleEquity = (v: number) => {
    const newVendor = Math.min(vendor, 100 - v - 10);
    setEquity(v);
    setVendor(Math.max(0, newVendor));
  };
  const handleVendor = (v: number) => {
    setVendor(Math.min(v, 100 - equity - 10));
  };

  const fmt = (n: number) => `£${n >= 1000000 ? (n / 1000000).toFixed(2) + "m" : (n / 1000).toFixed(0) + "k"}`;

  return (
    <div style={{ background: "#1c1917", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 6 }}>
        {["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
        <span style={{ fontSize: 11, color: "#475569", fontWeight: 500, marginLeft: 6 }}>Capital Structure Modeller</span>
      </div>
      <div style={{ padding: "24px 24px 20px" }}>
        {/* Stack bar */}
        <div style={{ height: 10, borderRadius: 9999, overflow: "hidden", display: "flex", background: "#1e293b", marginBottom: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: `${equity}%`, background: "linear-gradient(90deg,#166534,#14532d)", transition: "width 0.15s" }} />
          <div style={{ width: `${vendor}%`, background: "linear-gradient(90deg,#a855f7,#c084fc)", transition: "width 0.15s" }} />
          <div style={{ width: `${bank}%`, background: "linear-gradient(90deg,#f59e0b,#fbbf24)", transition: "width 0.15s" }} />
        </div>

        {/* Sliders */}
        {[
          { label: "Buyer Equity", val: equity, set: handleEquity, color: "#818cf8", min: 10, max: 70 },
          { label: "Vendor Finance", val: vendor, set: handleVendor, color: "#c084fc", min: 0, max: 50 },
        ].map(s => (
          <div key={s.label} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{s.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.val}% · {fmt(s.val === equity ? equityAmt : vendorAmt)}</span>
            </div>
            <div style={{ position: "relative", height: 6 }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: 9999,
                background: `linear-gradient(90deg, ${s.color} ${((s.val - s.min) / (s.max - s.min)) * 100}%, #1e293b ${((s.val - s.min) / (s.max - s.min)) * 100}%)`,
              }} />
              <input type="range" min={s.min} max={s.max} value={s.val}
                onChange={e => s.set(Number(e.target.value))}
                style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%" }}
              />
            </div>
          </div>
        ))}

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 20 }}>
          {[
            { label: "Bank Loan", val: fmt(bankAmt), color: "#fbbf24" },
            { label: "Total Cost", val: fmt(totalCost), color: "#94a3b8" },
            { label: "SDE", val: fmt(sde), color: "#c084fc" },
            { label: "DSCR", val: dscr > 50 ? "∞" : `${dscr.toFixed(2)}×`, color: dscrOk ? "#4ade80" : "#f87171" },
          ].map(m => (
            <div key={m.label} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "10px 12px", textAlign: "center",
            }}>
              <p style={{ fontSize: 10, color: "#475569", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: m.color, margin: 0 }}>{m.val}</p>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 14, padding: "10px 14px", borderRadius: 10,
          background: dscrOk ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.07)",
          border: `1px solid ${dscrOk ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
        }}>
          <span style={{ fontSize: 11, color: dscrOk ? "#4ade80" : "#f87171", fontWeight: 600 }}>
            {dscrOk
              ? `✓  DSCR ${dscr.toFixed(2)}× — Structure is bankable. Mainstream lenders will accept this.`
              : `✗  DSCR ${dscr.toFixed(2)}× — Below 1.25× minimum. Increase equity or vendor finance.`}
          </span>
        </div>

        <Link href="/dashboard/triage" style={{ textDecoration: "none", display: "block", marginTop: 16 }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#166534,#14532d)", color: "#fff",
              fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          >
            Run full triage analysis <ArrowRight size={14} />
          </motion.button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function BuyPageClient({
  sector, city, sectorData: sd, cityData: cd, companies, adjustedPrice,
}: {
  sector: Sector; city: City; sectorData: SectorData; cityData: CityData;
  companies: MockCompany[]; adjustedPrice: number;
}) {
  const conditionColor = { hot: "#4ade80", stable: "#fbbf24", cooling: "#f87171" }[sd.marketCondition];
  const conditionLabel = { hot: "Hot Market", stable: "Stable Market", cooling: "Cooling Market" }[sd.marketCondition];

  return (
    <div style={{ background: "#09090b", minHeight: "100vh", color: "#f4f4f5", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {/* Grid bg */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%,transparent 20%,#09090b 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 0%,transparent 20%,#09090b 75%)",
      }} />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100,
        display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
        background: "rgba(18,18,22,0.8)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.09)", borderRadius: 9999,
        boxShadow: "0 0 0 1px rgba(99,102,241,0.12)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={12} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f4f4f5" }}>Acquisition Exchange</span>
        </Link>
        <span style={{ color: "#27272a", fontSize: 12 }}>·</span>
        <span style={{ fontSize: 12, color: "#71717a" }}>{sd.displayName} · {cd.displayName}</span>
      </nav>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "100px 24px 80px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="visible" style={{ marginBottom: 56 }}>
          <motion.div variants={fadeUp} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{
              background: `${conditionColor}18`, border: `1px solid ${conditionColor}40`,
              color: conditionColor, fontSize: 11, fontWeight: 700, padding: "3px 10px",
              borderRadius: 9999, letterSpacing: "0.06em", textTransform: "uppercase",
            }}>{conditionLabel}</span>
            <span style={{
              background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
              color: "#818cf8", fontSize: 11, fontWeight: 700, padding: "3px 10px",
              borderRadius: 9999, letterSpacing: "0.06em", textTransform: "uppercase",
            }}>{sd.avgSdeMultiple}× avg SDE multiple</span>
          </motion.div>
          <motion.h1 variants={fadeUp} style={{
            fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em",
            lineHeight: 1.1, margin: "0 0 20px",
          }}>
            <span style={{
              background: "linear-gradient(180deg, #f4f4f5 0%, #71717a 140%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Buy a {sd.displayName} Business in {cd.displayName}
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} style={{ fontSize: 16, color: "#71717a", lineHeight: 1.7, maxWidth: 640 }}>
            Deal Valuation & Debt Analysis — {cd.region}. Average asking price{" "}
            <strong style={{ color: "#a1a1aa" }}>£{(adjustedPrice / 1000).toFixed(0)}k</strong>,
            SDE multiple <strong style={{ color: "#a1a1aa" }}>{sd.avgSdeMultiple}×</strong>,
            net margin <strong style={{ color: "#a1a1aa" }}>{(sd.avgProfitMargin * 100).toFixed(1)}%</strong>.
          </motion.p>
        </motion.div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 24, alignItems: "start" }}>
          {/* Left col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Market summary card */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{ background: "rgba(18,18,22,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <TrendingUp size={16} color="#818cf8" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", letterSpacing: "0.09em", textTransform: "uppercase" }}>UK M&A Market Conditions · {cd.displayName}</span>
              </div>
              <p style={{ fontSize: 14, color: "#a1a1aa", lineHeight: 1.8, margin: "0 0 20px" }}>{sd.marketSummary}</p>
              <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.7, margin: 0 }}>{cd.marketNote}</p>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "24px 0" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>Key Drivers</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {sd.keyDrivers.map(d => (
                      <div key={d} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <CheckCircle size={12} color="#4ade80" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>Risk Factors</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {sd.riskFactors.map(r => (
                      <div key={r} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <AlertTriangle size={12} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <span style={{ fontSize: 12, color: "#818cf8" }}>
                  <strong>Lender appetite:</strong> {sd.lenderAppetite}
                </span>
              </div>
            </motion.div>

            {/* Market benchmarks */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{ background: "rgba(18,18,22,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 20 }}>Market Benchmarks · {cd.displayName} {sd.displayName}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {[
                  { label: "Avg Asking Price", val: `£${(adjustedPrice / 1000).toFixed(0)}k`, sub: `${cd.premiumPct >= 0 ? "+" : ""}${(cd.premiumPct * 100).toFixed(0)}% vs national avg` },
                  { label: "SDE Multiple", val: `${sd.avgSdeMultiple}×`, sub: "Based on 2024 completions" },
                  { label: "Avg Turnover", val: `£${(sd.avgTurnover / 1000).toFixed(0)}k`, sub: "Gross revenue" },
                  { label: "Net Profit Margin", val: `${(sd.avgProfitMargin * 100).toFixed(1)}%`, sub: "After owner salary" },
                  { label: "Avg SDE", val: `£${((sd.avgNetProfit + sd.avgAddBacks) / 1000).toFixed(0)}k`, sub: "Net profit + add-backs" },
                  { label: "Typical Lease", val: `${sd.leaseYearsRemaining} yrs`, sub: "Remaining term" },
                ].map(m => (
                  <div key={m.label} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ fontSize: 10, color: "#52525b", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: "#f4f4f5", margin: "0 0 3px", letterSpacing: "-0.03em" }}>{m.val}</p>
                    <p style={{ fontSize: 10, color: "#3f3f46", margin: 0 }}>{m.sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Companies House records */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{ background: "rgba(18,18,22,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Building2 size={15} color="#818cf8" />
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", letterSpacing: "0.09em", textTransform: "uppercase", margin: 0 }}>Active Businesses · Companies House · {cd.displayName}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {companies.map(c => (
                  <div key={c.number} style={{
                    padding: "16px 18px", borderRadius: 12,
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#f4f4f5", margin: "0 0 3px" }}>{c.name}</p>
                      <p style={{ fontSize: 11, color: "#52525b", margin: 0 }}>
                        No. {c.number} · Incorporated {c.incorporated} · {c.employees} employees
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)", padding: "3px 10px", borderRadius: 9999, fontWeight: 600 }}>{c.status}</span>
                      <span style={{ fontSize: 11, background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)", padding: "3px 10px", borderRadius: 9999, fontWeight: 600 }}>T/O {c.turnover}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: "#27272a", margin: "16px 0 0" }}>* Indicative company data for illustrative purposes only. Not sourced from the live Companies House API.</p>
            </motion.div>
          </div>

          {/* Right col — sticky playground */}
          <div style={{ position: "sticky", top: 100 }}>
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <p style={{ fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 14 }}>
                Interactive Capital Modeller — Pre-loaded with {sd.displayName} Averages
              </p>
              <CapitalPlayground
                defaultPrice={adjustedPrice}
                avgMultiple={sd.avgSdeMultiple}
                avgNetProfit={sd.avgNetProfit}
                avgAddBacks={sd.avgAddBacks}
              />
              {/* Calculator links */}
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { href: "/calculators/dscr-calculator", label: "DSCR Calculator" },
                  { href: "/calculators/sme-debt-capacity", label: "SME Debt Capacity" },
                  { href: "/calculators/stamp-duty", label: "Stamp Duty Calculator" },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 16px", borderRadius: 10,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    textDecoration: "none", color: "#71717a", fontSize: 13, fontWeight: 500,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.color = "#a1a1aa"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#71717a"; }}
                  >
                    {l.label} <ArrowRight size={13} />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "32px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 11, color: "#27272a", maxWidth: 560, margin: "0 auto" }}>
          Market data is indicative only and based on 2024 UK SME M&A benchmarks. Not financial advice. Always engage qualified advisors.{" "}
          <Link href="/" style={{ color: "#3f3f46", textDecoration: "underline" }}>Acquisition Exchange</Link>
        </p>
      </footer>
    </div>
  );
}
