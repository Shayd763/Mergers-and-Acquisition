"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, TrendingUp, Shield, Users, AlertTriangle, Info } from "lucide-react";
import { SiteNav } from "@/app/components/SiteNav";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EXPO } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ─── Sector multiples ───────────────────────────────────────────────────── */
const SECTOR_MULTIPLES: Record<string, number> = {
  "Dental Practice": 4.2, "Accounting Practice": 4.0, "Day Nursery": 3.6,
  "Engineering Consultancy": 3.5, "Manufacturing": 3.2, "Logistics": 2.9,
  "E-Commerce": 2.8, "Pub / Restaurant": 2.5,
};

/* ─── Bankability score ──────────────────────────────────────────────────── */
function bankabilityScore(dscr: number): { grade: string; score: number; color: string; bg: string; border: string; label: string; advice: string } {
  if (dscr >= 1.5)  return { grade: "A+", score: 95, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", label: "HIGHLY BANKABLE", advice: "Exceptional. Mainstream high-street banks (HSBC, Barclays, Lloyds) will actively compete for this deal. Expect competitive rates and minimal personal guarantee requirements." };
  if (dscr >= 1.35) return { grade: "A",  score: 82, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", label: "BANKABLE",        advice: "Strong. All major SME lenders will fund this acquisition comfortably. You can expect a straightforward process with mainstream commercial lenders." };
  if (dscr >= 1.25) return { grade: "B+", score: 68, color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "ACCEPTABLE",      advice: "Meets the standard 1.25× lender minimum. Bankable with specialist SME lenders (OakNorth, ThinCats). Personal guarantees may be required." };
  if (dscr >= 1.10) return { grade: "B",  score: 52, color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "MARGINAL",        advice: "Below mainstream lender appetite. A buyer would need to increase equity contribution or negotiate vendor finance to bridge the gap." };
  return { grade: "C", score: 28, color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "DIFFICULT TO BANK", advice: "A buyer would struggle to secure high-street bank financing at current profitability. Consider improving margins or adjusting your asking price before going to market." };
}

export default function SellPage() {
  const [step, setStep] = useState(1);
  const [sector, setSector] = useState("Engineering Consultancy");
  const [turnover, setTurnover] = useState("");
  const [netProfit, setNetProfit] = useState("");
  const [addBacks, setAddBacks] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [leaseYears, setLeaseYears] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const turnoverVal    = Number(turnover)    || 0;
  const netProfitVal   = Number(netProfit)   || 0;
  const addBacksVal    = Number(addBacks)    || 0;
  const askingPriceVal = Number(askingPrice) || 0;
  const leaseYearsVal  = Number(leaseYears)  || 0;

  const sde = netProfitVal + addBacksVal;
  const multiple = askingPriceVal > 0 && sde > 0 ? askingPriceVal / sde : 0;
  const totalCost = askingPriceVal * 1.05;
  const bankLoan = totalCost * 0.55;
  const mr = 0.12 / 12;
  const nm = 5 * 12;
  const annualDebt = bankLoan * (mr * Math.pow(1 + mr, nm)) / (Math.pow(1 + mr, nm) - 1) * 12;
  const dscr = annualDebt > 0 ? sde / annualDebt : 99;
  const bscore = bankabilityScore(dscr);
  const sectorMultiple = SECTOR_MULTIPLES[sector] ?? 3.2;
  const suggestedValuation = Math.round(sde * sectorMultiple);

  const inputStyle: React.CSSProperties = { width: "100%", background: "#faf9f7", border: "1px solid #d6d3d1", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#1c1917", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s" };
  const inputPound: React.CSSProperties = { ...inputStyle, paddingLeft: 28 };

  return (
    <div style={{ background: "#faf9f7", minHeight: "100vh", color: "#1c1917", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(148,163,184,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.15) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%,transparent 20%,#faf9f7 75%)", WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 0%,transparent 20%,#faf9f7 75%)" }} />

      <SiteNav />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "100px 24px 80px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div variants={stagger} initial="hidden" animate="visible" style={{ textAlign: "center", marginBottom: 56 }}>
          <motion.div variants={fadeUp} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 9999, padding: "6px 16px" }}>
            <TrendingUp size={12} color="#059669" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#059669", letterSpacing: "0.08em", textTransform: "uppercase" }}>Sell-Side Engine · Free Valuation</span>
          </motion.div>
          <motion.h1 variants={fadeUp} style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 18px", lineHeight: 1.1 }}>
            Find Out How Bankable<br />
            <span style={{ background: "linear-gradient(135deg,#059669,#10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Your UK Business Is.</span>
          </motion.h1>
          <motion.p variants={fadeUp} style={{ fontSize: 17, color: "#78716c", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
            See your company through the eyes of an institutional acquirer. Discover your Bankability Score — and what a buyer could raise from a high-street bank to buy your business today.
          </motion.p>
        </motion.div>

        {/* Step indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 48 }}>
          {[{ n: 1, label: "Your Financials" }, { n: 2, label: "Your Score" }, { n: 3, label: "Get Prospectus" }].map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, transition: "all 0.2s", background: step >= s.n ? "linear-gradient(135deg,#059669,#10b981)" : "#d6d3d1", color: step >= s.n ? "#fff" : "#a8a29e" }}>{s.n}</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: step >= s.n ? "#059669" : "#a8a29e" }}>{s.label}</span>
              </div>
              {s.n < 3 && <div style={{ width: 40, height: 1, background: step > s.n ? "#059669" : "#d6d3d1", transition: "background 0.3s" }} />}
            </div>
          ))}
        </div>

        <div className="sell-main-grid" style={{ display: "grid", gridTemplateColumns: step < 2 ? "1fr" : "1fr 380px", gap: 24, alignItems: "start" }}>
          {/* Left: Input form */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.35, ease: EXPO }}>
                <div className="sell-card" style={{ background: "#fff", border: "1px solid #d6d3d1", borderRadius: 20, padding: "36px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 28 }}>Your Business Details</p>
                  <div className="sell-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {/* Sector */}
                    <div style={{ gridColumn: "1 / 3" }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#44403c", display: "block", marginBottom: 6 }}>Sector</label>
                      <select value={sector} onChange={e => setSector(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                        {Object.keys(SECTOR_MULTIPLES).map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    {/* Financials */}
                    {[
                      { label: "Annual Turnover", val: turnover, set: setTurnover, step: 10000 },
                      { label: "Net Profit (after tax)", val: netProfit, set: setNetProfit, step: 5000 },
                      { label: "Owner Add-backs / Perks", val: addBacks, set: setAddBacks, step: 1000 },
                      { label: "Asking Price", val: askingPrice, set: setAskingPrice, step: 10000 },
                    ].map(f => (
                      <div key={f.label}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#44403c", display: "block", marginBottom: 6 }}>{f.label}</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#a8a29e", fontSize: 14, fontWeight: 600 }}>£</span>
                          <input
                            type="number" value={f.val} step={f.step} min={0}
                            onChange={e => f.set(e.target.value)}
                            style={inputPound}
                            onFocus={e => { e.currentTarget.style.borderColor = "#059669"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.1)"; }}
                            onBlur={e => { e.currentTarget.style.borderColor = "#d6d3d1"; e.currentTarget.style.boxShadow = "none"; }}
                          />
                        </div>
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#44403c", display: "block", marginBottom: 6 }}>Lease Years Remaining</label>
                      <input
                        type="number" value={leaseYears} step={1} min={0} max={25}
                        onChange={e => setLeaseYears(e.target.value)}
                        style={inputStyle}
                        onFocus={e => { e.currentTarget.style.borderColor = "#059669"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.1)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "#d6d3d1"; e.currentTarget.style.boxShadow = "none"; }}
                      />
                    </div>
                  </div>

                  {/* Quick preview */}
                  <div style={{ marginTop: 28, padding: "18px 20px", background: "#faf9f7", border: "1px solid #d6d3d1", borderRadius: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                    {[
                      { label: "SDE", val: `£${((netProfitVal + addBacksVal) / 1000).toFixed(0)}k`, color: "#1c1917" },
                      { label: "Implied Multiple", val: sde > 0 ? `${multiple.toFixed(1)}×` : "—", color: "#292524" },
                      { label: "Sector Avg Multiple", val: `${sectorMultiple}×`, color: "#059669" },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 10, color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 4px" }}>{m.label}</p>
                        <p style={{ fontSize: 20, fontWeight: 800, color: m.color, margin: 0, letterSpacing: "-0.03em" }}>{m.val}</p>
                      </div>
                    ))}
                  </div>

                  {suggestedValuation > 0 && Math.abs(suggestedValuation - askingPriceVal) / askingPriceVal > 0.15 && (
                    <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", gap: 10 }}>
                      <Info size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.65 }}>
                        Based on sector benchmarks, {sector} businesses typically trade at {sectorMultiple}× SDE — suggesting a valuation of <strong>£{(suggestedValuation / 1000).toFixed(0)}k</strong>. Your asking price is {askingPriceVal > suggestedValuation ? "above" : "below"} this benchmark.
                      </p>
                    </div>
                  )}

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setStep(2)}
                    style={{ marginTop: 28, width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    Calculate My Bankability Score <ArrowRight size={16} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step >= 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: EXPO }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Summary card */}
                  <div style={{ background: "#fff", border: "1px solid #d6d3d1", borderRadius: 20, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 20 }}>Financial Summary</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                      {[
                        { label: "Turnover", val: `£${(turnoverVal / 1000).toFixed(0)}k` },
                        { label: "Net Profit", val: `£${(netProfitVal / 1000).toFixed(0)}k`, color: "#059669" },
                        { label: "SDE", val: `£${(sde / 1000).toFixed(0)}k`, color: "#1c1917" },
                        { label: "Asking Price", val: `£${(askingPriceVal / 1000).toFixed(0)}k` },
                        { label: "Your Multiple", val: `${multiple.toFixed(1)}×`, color: multiple <= sectorMultiple ? "#059669" : "#d97706" },
                        { label: "Sector Benchmark", val: `${sectorMultiple}×`, color: "#78716c" },
                      ].map(m => (
                        <div key={m.label} style={{ padding: "12px 14px", background: "#faf9f7", border: "1px solid #d6d3d1", borderRadius: 10, textAlign: "center" }}>
                          <p style={{ fontSize: 10, color: "#a8a29e", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{m.label}</p>
                          <p style={{ fontSize: 17, fontWeight: 700, color: m.color ?? "#1c1917", margin: 0, letterSpacing: "-0.02em" }}>{m.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Debt stress card */}
                  <div style={{ background: "#fff", border: "1px solid #d6d3d1", borderRadius: 20, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                      <Shield size={15} color="#1c1917" />
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", letterSpacing: "0.09em", textTransform: "uppercase", margin: 0 }}>Buyer Debt Stress Test</p>
                    </div>
                    <p style={{ fontSize: 13, color: "#78716c", marginBottom: 18, lineHeight: 1.65 }}>
                      Assuming a buyer structures: <strong>55% bank debt</strong> at 12% APR over 5 years, <strong>20% vendor finance</strong>, and <strong>25% equity</strong>:
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                      {[
                        { label: "Bank Loan Required", val: `£${Math.round(bankLoan / 1000)}k`, color: "#1c1917" },
                        { label: "Annual Debt Service", val: `£${Math.round(annualDebt / 1000)}k`, color: "#292524" },
                        { label: "Buyer's SDE", val: `£${Math.round(sde / 1000)}k`, color: "#059669" },
                        { label: "DSCR", val: `${dscr > 50 ? "∞" : dscr.toFixed(2)}×`, color: dscr >= 1.25 ? "#059669" : "#dc2626" },
                      ].map(m => (
                        <div key={m.label} style={{ padding: "12px 14px", background: "#faf9f7", border: "1px solid #d6d3d1", borderRadius: 10 }}>
                          <p style={{ fontSize: 10, color: "#a8a29e", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{m.label}</p>
                          <p style={{ fontSize: 18, fontWeight: 700, color: m.color, margin: 0, letterSpacing: "-0.02em" }}>{m.val}</p>
                        </div>
                      ))}
                    </div>
                    {leaseYearsVal < 5 && (
                      <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", gap: 8 }}>
                        <AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 12, color: "#92400e", margin: 0 }}>Short lease ({leaseYearsVal} years remaining) will reduce buyer appetite and lender confidence significantly.</p>
                      </div>
                    )}
                  </div>

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setStep(3)}
                    style={{ padding: "14px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    Generate My Buyer Prospectus <ArrowRight size={16} />
                  </motion.button>
                  <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#a8a29e", fontSize: 13, cursor: "pointer" }}>← Edit financials</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right: Bankability score (shown from step 2) */}
          {step >= 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: EXPO }}
              style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 100 }}>

              {/* Score card */}
              <div style={{ background: bscore.bg, border: `1px solid ${bscore.border}`, borderRadius: 20, padding: "32px 28px", textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: bscore.color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Bankability Score</p>
                <div style={{ width: 96, height: 96, borderRadius: "50%", border: `4px solid ${bscore.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", background: "#fff" }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: bscore.color, letterSpacing: "-0.04em" }}>{bscore.grade}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: bscore.color, margin: "0 0 10px", letterSpacing: "0.04em", textTransform: "uppercase" }}>{bscore.label}</p>
                {/* Score bar */}
                <div style={{ height: 6, background: "#d6d3d1", borderRadius: 9999, overflow: "hidden", marginBottom: 16 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${bscore.score}%` }} transition={{ delay: 0.3, duration: 0.8, ease: EXPO }} style={{ height: "100%", background: `linear-gradient(90deg, ${bscore.color}, ${bscore.color}99)`, borderRadius: 9999 }} />
                </div>
                <p style={{ fontSize: 13, color: "#78716c", margin: 0, lineHeight: 1.7 }}>{bscore.advice}</p>
              </div>

              {/* Improve section */}
              <div style={{ background: "#fff", border: "1px solid #d6d3d1", borderRadius: 16, padding: "22px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 14 }}>How to Improve Your Score</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    "Document all owner add-backs clearly in your management accounts",
                    "Extend your commercial lease — lenders want 5+ years remaining",
                    "Reduce owner dependency: demonstrate the business runs without you",
                    "Clean up one-off costs and personal expenses run through P&L",
                  ].map(tip => (
                    <div key={tip} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <CheckCircle size={13} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#78716c", lineHeight: 1.6 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Prospectus form */}
              {step === 3 && !submitted && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                  style={{ background: "#fff", border: "1px solid #d6d3d1", borderRadius: 16, padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Users size={14} color="#059669" />
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#059669", letterSpacing: "0.09em", textTransform: "uppercase", margin: 0 }}>Get Your Buyer Prospectus</p>
                  </div>
                  <p style={{ fontSize: 13, color: "#78716c", marginBottom: 18, lineHeight: 1.65 }}>Receive your free Bankability Report PDF and opt into our network of pre-vetted active UK acquirers.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                    <input type="email" placeholder="Business email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} disabled={!name || !email || submitting}
                      onClick={async () => {
                        setSubmitError("");
                        setSubmitting(true);
                        try {
                          await fetch("/api/sell-lead", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name, email, sector, turnover: turnoverVal, netProfit: netProfitVal,
                              addBacks: addBacksVal, askingPrice: askingPriceVal,
                              sde, dscr: Number(dscr.toFixed(2)), dscrGrade: bscore.grade,
                            }),
                          });
                          setSubmitted(true);
                        } catch {
                          setSubmitError("Something went wrong — please try again.");
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      style={{ padding: "12px", borderRadius: 10, border: "none", cursor: name && email ? "pointer" : "not-allowed", background: name && email ? "linear-gradient(135deg,#059669,#10b981)" : "#d6d3d1", color: name && email ? "#fff" : "#a8a29e", fontSize: 14, fontWeight: 700 }}>
                      {submitting ? "Sending…" : "Send Me the Report"}
                    </motion.button>
                    {submitError && <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{submitError}</p>}
                  </div>
                  <p style={{ fontSize: 10, color: "#d6d3d1", marginTop: 10, lineHeight: 1.6 }}>By submitting, you opt into Triage Finance's pre-vetted buyer network. Unsubscribe at any time.</p>
                </motion.div>
              )}

              {submitted && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}
                  style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 16, padding: "24px", textAlign: "center" }}>
                  <p style={{ fontSize: 28, marginBottom: 10 }}>✅</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#059669", margin: "0 0 8px" }}>Prospectus sent to {email}</p>
                  <p style={{ fontSize: 13, color: "#78716c", margin: 0, lineHeight: 1.65 }}>Your Bankability Report and deal profile are now live in our pre-vetted buyer network.</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 64, borderTop: "1px solid #d6d3d1", paddingTop: 32, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#a8a29e" }}>
            Valuations are indicative only. Based on 2025 UK SME M&A benchmarks. Not financial advice.{" "}
            <Link href="/" style={{ color: "#1c1917", textDecoration: "none" }}>← Back to Triage Finance</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
