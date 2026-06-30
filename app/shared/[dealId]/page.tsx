"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, Lock, ArrowRight, TrendingUp, Shield, CheckCircle, AlertTriangle } from "lucide-react";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EXPO } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ─── Mock deal data seeded from dealId ────────────────────────────────── */
function seedDeal(id: string) {
  const hash = Array.from(id).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const basePrice = 350000 + (hash % 800000);
  const turnover = Math.round(basePrice * (1.4 + (hash % 10) / 10));
  const netProfit = Math.round(turnover * (0.10 + (hash % 8) / 100));
  const addBacks = Math.round(netProfit * 0.45);
  const sde = netProfit + addBacks;
  const multiple = 3.0 + (hash % 15) / 10;
  const askingPrice = Math.round(sde * multiple);
  const totalCost = Math.round(askingPrice * 1.05);
  const equityPct = 25;
  const vendorPct = 20;
  const bankPct = 55;
  const bankLoan = Math.round(totalCost * bankPct / 100);
  const mr = 0.12 / 12; const nm = 60;
  const annualDebt = bankLoan * (mr * Math.pow(1 + mr, nm)) / (Math.pow(1 + mr, nm) - 1) * 12;
  const dscr = annualDebt > 0 ? sde / annualDebt : 99;
  const irr: number | null = null; // IRR not available on shared views — full analysis requires sign-in
  const sectors = ["Engineering Consultancy", "Accounting Practice", "Day Nursery", "Manufacturing", "Logistics"];
  const cities = ["Manchester", "Birmingham", "Leeds", "Bristol", "Glasgow"];
  return {
    id,
    sector: sectors[hash % sectors.length],
    city: cities[hash % cities.length],
    askingPrice,
    totalCost,
    turnover,
    netProfit,
    addBacks,
    sde,
    multiple,
    equityAmt: Math.round(totalCost * equityPct / 100),
    vendorAmt: Math.round(totalCost * vendorPct / 100),
    bankLoan,
    equityPct,
    vendorPct,
    bankPct,
    annualDebt: Math.round(annualDebt),
    dscr,
    irr,
    dscrOk: dscr >= 1.25,
    viability: dscr >= 1.35 ? "STRONG" : dscr >= 1.20 ? "MARGINAL" : "UNBANKABLE",
  };
}

/* ─── Metric cell ────────────────────────────────────────────────────────── */
function Metric({ label, val, sub, color = "#f4f4f5" }: { label: string; val: string; sub?: string; color?: string }) {
  return (
    <div style={{ padding: "20px 18px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
      <p style={{ fontSize: 10, color: "#52525b", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.09em" }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 800, color, margin: "0 0 3px", letterSpacing: "-0.03em" }}>{val}</p>
      {sub && <p style={{ fontSize: 10, color: "#3f3f46", margin: 0 }}>{sub}</p>}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function SharedDealPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = use(params);
  const d = seedDeal(dealId);
  const viabilityColor = d.viability === "STRONG" ? "#4ade80" : d.viability === "MARGINAL" ? "#fbbf24" : "#f87171";
  const dscrColor = d.dscrOk ? "#4ade80" : "#f87171";

  const fmt = (n: number) => `£${n >= 1000000 ? (n / 1000000).toFixed(2) + "m" : (n / 1000).toFixed(0) + "k"}`;

  return (
    <div style={{ background: "#09090b", minHeight: "100vh", color: "#f4f4f5", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {/* Grid */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#09090b 80%)", WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#09090b 80%)" }} />

      {/* Nav */}
      <nav style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "rgba(18,18,22,0.8)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 9999, boxShadow: "0 0 0 1px rgba(99,102,241,0.12)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart3 size={12} color="#fff" /></div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#f4f4f5" }}>Triage Finance</span>
        </Link>
        <span style={{ color: "#27272a" }}>·</span>
        <Lock size={11} color="#52525b" />
        <span style={{ fontSize: 12, color: "#71717a" }}>Read-only deal view</span>
      </nav>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "100px 24px 80px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="visible" style={{ marginBottom: 48 }}>
          <motion.div variants={fadeUp} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ background: `${viabilityColor}18`, border: `1px solid ${viabilityColor}35`, color: viabilityColor, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 9999, letterSpacing: "0.07em", textTransform: "uppercase" }}>{d.viability}</span>
            <span style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#71717a", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 9999 }}>Deal ID: {d.id}</span>
            <span style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 9999 }}>Read-Only</span>
          </motion.div>
          <motion.h1 variants={fadeUp} style={{ fontSize: "clamp(24px,4vw,44px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 8px", background: "linear-gradient(180deg,#f4f4f5 0%,#71717a 140%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {d.sector} Acquisition
          </motion.h1>
          <motion.p variants={fadeUp} style={{ fontSize: 15, color: "#71717a" }}>
            {d.city} · Asking {fmt(d.askingPrice)} · {d.multiple.toFixed(1)}× SDE · Triage Finance Deal Report
          </motion.p>
        </motion.div>

        {/* Core metrics */}
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "SDE", val: fmt(d.sde), sub: `Net profit + add-backs`, color: "#818cf8" },
            { label: "Valuation Multiple", val: `${d.multiple.toFixed(1)}×`, sub: "SDE multiple", color: "#c084fc" },
            { label: "DSCR", val: `${d.dscr.toFixed(2)}×`, sub: d.dscrOk ? "✓ Bankable" : "✗ Below 1.25×", color: dscrColor },
            { label: "Equity IRR (5yr)", val: d.irr !== null ? `${(d.irr * 100).toFixed(1)}%` : "Sign in to view", sub: "Requires full triage", color: "#fbbf24" },
          ].map(m => (
            <motion.div key={m.label} variants={fadeUp}><Metric {...m} /></motion.div>
          ))}
        </motion.div>

        {/* Main layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* P&L summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ background: "rgba(18,18,22,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "26px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <TrendingUp size={15} color="#818cf8" />
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", letterSpacing: "0.09em", textTransform: "uppercase", margin: 0 }}>Financial Summary</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "Turnover", val: fmt(d.turnover) },
                  { label: "Net Profit", val: fmt(d.netProfit), color: "#4ade80" },
                  { label: "Normalised Add-backs", val: fmt(d.addBacks), color: "#c084fc" },
                  { label: "SDE", val: fmt(d.sde), color: "#818cf8" },
                  { label: "Asking Price", val: fmt(d.askingPrice) },
                  { label: "Total Acquisition Cost", val: fmt(d.totalCost), color: "#f4f4f5" },
                ].map(r => (
                  <div key={r.label} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ fontSize: 10, color: "#52525b", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{r.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: r.color ?? "#a1a1aa", margin: 0, letterSpacing: "-0.02em" }}>{r.val}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Capital stack */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ background: "rgba(18,18,22,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "26px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Shield size={15} color="#818cf8" />
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", letterSpacing: "0.09em", textTransform: "uppercase", margin: 0 }}>Capital Structure</p>
              </div>
              <div style={{ height: 12, borderRadius: 9999, overflow: "hidden", display: "flex", background: "#1e293b", marginBottom: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: `${d.equityPct}%`, background: "linear-gradient(90deg,#166534,#14532d)" }} />
                <div style={{ width: `${d.vendorPct}%`, background: "linear-gradient(90deg,#a855f7,#c084fc)" }} />
                <div style={{ width: `${d.bankPct}%`, background: "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "Buyer Equity", pct: d.equityPct, amt: d.equityAmt, color: "#818cf8" },
                  { label: "Vendor Finance", pct: d.vendorPct, amt: d.vendorAmt, color: "#c084fc" },
                  { label: "Bank Loan", pct: d.bankPct, amt: d.bankLoan, color: "#fbbf24" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "#52525b", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: "0 0 2px" }}>{s.pct}%</p>
                    <p style={{ fontSize: 12, color: "#71717a", margin: 0 }}>{fmt(s.amt)}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: d.dscrOk ? "rgba(74,222,128,0.07)" : "rgba(248,113,113,0.07)", border: `1px solid ${d.dscrOk ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}` }}>
                <p style={{ fontSize: 12, color: d.dscrOk ? "#4ade80" : "#f87171", margin: 0 }}>
                  {d.dscrOk ? `✓ DSCR ${d.dscr.toFixed(2)}× — Annual debt service: £${d.annualDebt.toLocaleString()} vs SDE: ${fmt(d.sde)}` : `✗ DSCR ${d.dscr.toFixed(2)}× — Below 1.25× lender minimum. Structure requires adjustment.`}
                </p>
              </div>
            </motion.div>

            {/* Credit memo preview */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ background: "rgba(18,18,22,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "26px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", letterSpacing: "0.09em", textTransform: "uppercase", margin: "0 0 16px" }}>Deal Credit Memo — Summary</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: <CheckCircle size={13} />, color: "#4ade80", text: `SDE of ${fmt(d.sde)} verified against normalised add-backs of ${fmt(d.addBacks)}` },
                  { icon: <CheckCircle size={13} />, color: "#4ade80", text: `Capital structure: ${d.equityPct}% equity / ${d.vendorPct}% vendor / ${d.bankPct}% bank debt` },
                  { icon: d.dscrOk ? <CheckCircle size={13} /> : <AlertTriangle size={13} />, color: d.dscrOk ? "#4ade80" : "#fbbf24", text: `DSCR ${d.dscr.toFixed(2)}× — ${d.dscrOk ? "passes" : "below"} 1.25× standard lender threshold` },
                  { icon: <Lock size={13} />, color: "#52525b", text: "5-year equity IRR available in full triage workspace — sign in to view" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color: r.color, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                    <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.65 }}>{r.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
                <Lock size={12} color="#52525b" />
                <p style={{ fontSize: 12, color: "#52525b", margin: 0 }}>Full 3-page credit memo PDF is locked. Available to deal participants only.</p>
              </div>
            </motion.div>
          </div>

          {/* Right — CTA */}
          <div style={{ position: "sticky", top: 100, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Main CTA */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6, ease: EXPO }}
              style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.12))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 20, padding: "28px 24px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <BarChart3 size={20} color="#fff" />
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.03em", margin: "0 0 10px", lineHeight: 1.2 }}>
                This deal is being triaged on Triage Finance.
              </p>
              <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.7, margin: "0 0 22px" }}>
                Want to run your own scenario modelling? Analyse any UK business listing in under 30 seconds — for free.
              </p>
              <Link href="/" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(99,102,241,0.4)" }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "13px 20px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#166534,#14532d)", color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 0 30px rgba(28,25,23,0.35)" }}>
                  Start for free <ArrowRight size={15} />
                </motion.button>
              </Link>
            </motion.div>

            {/* Viability card */}
            <div style={{ background: `${viabilityColor}0f`, border: `1px solid ${viabilityColor}30`, borderRadius: 16, padding: "20px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: viabilityColor, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Deal Viability Score</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: viabilityColor, margin: "0 0 6px", letterSpacing: "-0.04em" }}>{d.viability}</p>
              <p style={{ fontSize: 12, color: "#71717a", margin: 0, lineHeight: 1.6 }}>
                {d.viability === "STRONG" ? "Highly attractive to commercial lenders at this DSCR." : d.viability === "MARGINAL" ? "Bankable but may require personal guarantees or higher equity." : "Below lender thresholds. Restructuring required."}
              </p>
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize: 11, color: "#3f3f46", lineHeight: 1.65, margin: 0, padding: "0 4px" }}>
              This shared deal view is generated by Triage Finance. Figures are modelled estimates for analytical purposes and do not constitute financial advice. Deal ID: {d.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
