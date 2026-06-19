"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, ArrowRight, CheckCircle, ChevronDown,
  Target, FileText, Users, Wallet, TrendingUp,
  DollarSign, Shield, Zap, BookOpen, AlertTriangle,
} from "lucide-react";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EXPO } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ─── Live arbitrage calculator ─────────────────────────────────────────── */
function ArbitrageCalc() {
  const [sde, setSde] = useState(200000);
  const [multiple, setMultiple] = useState(3.0);
  const [feeRate, setFeeRate] = useState(3);
  const [sweatEquity, setSweatEquity] = useState(20);

  const askingPrice = Math.round(sde * multiple);
  const totalCost = Math.round(askingPrice * 1.05);
  const bankLoan = Math.round(totalCost * 0.60);
  const vendorFinance = Math.round(totalCost * 0.20);
  const investorEquity = totalCost - bankLoan - vendorFinance;
  const annualDebt = bankLoan * (0.12 / (1 - Math.pow(1.06, -5)));
  const vendorAnnual = vendorFinance * (0.06 / (1 - Math.pow(1 + 0.06, -3)));
  const totalDebt = annualDebt + vendorAnnual;
  const dscr = totalDebt > 0 ? sde / totalDebt : 99;
  const dscrOk = dscr >= 1.25;
  const sourcingFee = Math.round(investorEquity * (feeRate / 100));
  const equityValue = Math.round(investorEquity * (sweatEquity / 100));

  // Simplified IRR: 5yr hold, exit at same multiple, annual FCF ≈ SDE - total debt
  const annualFCF = Math.max(0, sde - totalDebt);
  const exitValue = Math.round(sde * multiple * (sweatEquity / 100));
  const irr = exitValue > 0 ? (Math.pow((exitValue + annualFCF * 5) / investorEquity, 1 / 5) - 1) : 0;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#0f172a",
    outline: "none", fontFamily: "inherit",
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
      <div style={{ padding: "10px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8, background: "#f8fafc" }}>
        <div style={{ display: "flex", gap: 5 }}>{["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.8 }} />)}</div>
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, marginLeft: 4 }}>Deal Arbitrage Calculator</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {/* Inputs */}
        <div style={{ padding: "28px 24px", borderRight: "1px solid #f1f5f9" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 20 }}>Deal Inputs</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Annual SDE", val: sde, set: setSde, prefix: "£", step: 10000, min: 50000, max: 2000000 },
              { label: "SDE Multiple", val: multiple, set: setMultiple, prefix: "×", step: 0.1, min: 1.5, max: 6.0 },
              { label: "Sourcing Fee %", val: feeRate, set: setFeeRate, prefix: "%", step: 0.5, min: 1, max: 5 },
              { label: "Your Sweat Equity %", val: sweatEquity, set: setSweatEquity, prefix: "%", step: 5, min: 5, max: 49 },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 5 }}>{f.label}</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>{f.prefix}</span>
                  <input type="number" value={f.val} step={f.step} min={f.min} max={f.max}
                    onChange={e => f.set(Number(e.target.value) as never)}
                    style={{ ...inputStyle, paddingRight: 28 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ padding: "28px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 20 }}>Deal Outputs</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Asking Price", val: `£${(askingPrice / 1000).toFixed(0)}k`, color: "#0f172a" },
              { label: "Bank Debt (60%)", val: `£${(bankLoan / 1000).toFixed(0)}k`, color: "#4f46e5" },
              { label: "Vendor Finance (20%)", val: `£${(vendorFinance / 1000).toFixed(0)}k`, color: "#7c3aed" },
              { label: "Investor Equity (20%)", val: `£${(investorEquity / 1000).toFixed(0)}k`, color: "#059669" },
              { label: "DSCR", val: `${dscr > 50 ? "∞" : dscr.toFixed(2)}×`, color: dscrOk ? "#059669" : "#dc2626" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.val}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, borderTop: "2px solid #e2e8f0", paddingTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>Your Arbitrage Take</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Day 1 Fee", val: `£${sourcingFee.toLocaleString()}`, color: "#d97706" },
                { label: "Your Equity Stake", val: `£${(equityValue / 1000).toFixed(0)}k`, color: "#7c3aed" },
                { label: "Your Capital In", val: "£0", color: "#059669" },
                { label: "Est. 5yr IRR", val: irr > 0 ? `${(irr * 100).toFixed(0)}%` : "—", color: "#4f46e5" },
              ].map(m => (
                <div key={m.label} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.09em" }}>{m.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: m.color, margin: 0, letterSpacing: "-0.02em" }}>{m.val}</p>
                </div>
              ))}
            </div>
          </div>

          <Link href="/dashboard/triage" style={{ textDecoration: "none", display: "block", marginTop: 16 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              Audit a real deal with this structure <ArrowRight size={13} />
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Callout box ────────────────────────────────────────────────────────── */
function Callout({ icon, title, body, color, bg, border }: {
  icon: React.ReactNode; title: string; body: string; color: string; bg: string; border: string;
}) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: "18px 20px", display: "flex", gap: 14 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color, margin: "0 0 5px" }}>{title}</p>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.65 }}>{body}</p>
      </div>
    </div>
  );
}

/* ─── Section heading ────────────────────────────────────────────────────── */
function SectionHead({ step, title, sub }: { step: string; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: "#4f46e5", letterSpacing: "0.12em", textTransform: "uppercase" }}>{step}</span>
      <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0f172a", margin: "8px 0 12px", lineHeight: 1.15 }}>{title}</h2>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, margin: 0, maxWidth: 600 }}>{sub}</p>
    </div>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #f1f5f9" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", textAlign: "left" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, marginLeft: 12 }}>
          <ChevronDown size={15} color="#94a3b8" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: EXPO }} style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.75, paddingBottom: 16, margin: 0 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function DealSourcingGuidePage() {

  const STEPS = [
    {
      n: "01", icon: <Target size={22} />, accent: "#4f46e5",
      title: "Source: Find the Right Retirement Sale",
      sub: "The best deals are boring, profitable, and owner-dependent. You're looking for a retiring founder who has built a stable cash machine — not a growth story.",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.75 }}>
            Target businesses with <strong style={{ color: "#0f172a" }}>£150k–£400k SDE</strong> in sectors with recurring demand: engineering consultancies, accounting practices, day nurseries, logistics businesses, and specialist manufacturing. These sectors command 3.0–4.2× SDE multiples and have predictable, recurring revenue that banks love.
          </p>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.75 }}>
            The ideal seller is a 60+ founder who built the business over 20 years and wants a clean exit. They typically have <strong style={{ color: "#0f172a" }}>no interest in a protracted sale process</strong> — and will seriously consider vendor finance if it gets a deal done at their target price.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { title: "Where to find deals", items: ["Rightbiz.co.uk", "Daltons Business", "Business Transfer Agents", "Local accountants & solicitors", "LinkedIn (retiring directors)", "Christie & Co (sector-specific)"] },
              { title: "Green flag signals", items: ["Recurring B2B client base", "Owner wants full exit (not partial)", "10+ year trading history", "Business runs without the owner daily", "Lease secured (5+ years remaining)", "Accounts show consistent SDE growth"] },
            ].map(c => (
              <div key={c.title} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 12px" }}>{c.title}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {c.items.map(i => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <CheckCircle size={11} color="#059669" />
                      <span style={{ fontSize: 13, color: "#64748b" }}>{i}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      n: "02", icon: <BarChart3 size={22} />, accent: "#7c3aed",
      title: "Structure: Map the Capital Stack",
      sub: "The deal structure is the core of the arbitrage. You're building a debt-heavy, low-equity acquisition that the business's own cash flow repays — with your capital in at zero.",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.75 }}>
            The standard arbitrage structure uses three funding layers. The key constraint is maintaining a DSCR above 1.25×. This is the primary metric every UK commercial lender will check before approving the bank loan.
          </p>
          <div style={{ background: "#0f172a", borderRadius: 16, padding: "28px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Standard Arbitrage Capital Stack — £600k Deal Example</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "60% Bank Debt", amt: "£360,000", rate: "12% APR / 5yr term", note: "OakNorth, ThinCats, HSBC SME, Barclays", color: "#818cf8" },
                { label: "20% Vendor Finance", amt: "£120,000", rate: "6% / 3yr earn-out", note: "Negotiate with seller. Tied to performance milestones.", color: "#c084fc" },
                { label: "20% Investor Equity", amt: "£120,000", rate: "20–30% common equity", note: "Raised from HNW angels. You raise this — zero of your own cash.", color: "#4ade80" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", gap: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ width: 4, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.02em" }}>{s.amt}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 3px" }}>{s.rate}</p>
                    <p style={{ fontSize: 11, color: "#52525b", margin: 0, fontStyle: "italic" }}>{s.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 10, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)" }}>
              <p style={{ fontSize: 12, color: "#4ade80", margin: 0, fontWeight: 600 }}>
                ✓  At £200k SDE: Annual bank debt service ≈ £99k + vendor ≈ £44k = £143k total. DSCR = 200k ÷ 143k = <strong>1.40×</strong> — comfortably above the 1.25× lender minimum.
              </p>
            </div>
          </div>
          <Callout icon={<AlertTriangle size={15} />} title="Vendor Finance Negotiation" color="#d97706" bg="#fffbeb" border="#fde68a"
            body="Most retiring owners haven't heard of vendor finance. Frame it as: 'I want to pay your full asking price. I just need you to receive 20% of it over 3 years rather than all at once. This is standard in professional acquisitions and you'll receive 6% interest on the deferred amount.'" />
        </div>
      ),
    },
    {
      n: "03", icon: <FileText size={22} />, accent: "#059669",
      title: "Prove: Generate the Institutional Credit Memo",
      sub: "Your Deal Credit Memo is the proof-of-concept document that unlocks both your bank loan and your equity raise. Without it, you're asking lenders and investors to trust your word. With it, you're presenting institutional-grade underwriting.",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.75 }}>
            Triage Finance generates a 3-page PDF containing everything a UK commercial lender or angel investor needs to make a decision. It's the same structure used by mid-market PE firms — adapted for UK SME acquisitions.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { page: "Page 1", title: "Executive Summary", items: ["Deal overview paragraph", "Capital allocation table", "Investment thesis bullets", "SDE & key metrics"] },
              { page: "Page 2", title: "Financial Underwriting", items: ["9-row metrics table", "Sensitivity matrix (−10% to −30% SDE)", "5-year amortisation schedule", "DSCR at each stress scenario"] },
              { page: "Page 3", title: "Risk & Routing", items: ["3 key risk flags with mitigants", "Lender routing metadata", "Deal reference number", "Broker commission disclosure"] },
            ].map(p => (
              <div key={p.page} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 16px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 4px" }}>{p.page}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>{p.title}</p>
                {p.items.map(i => (
                  <div key={i} style={{ display: "flex", gap: 7, marginBottom: 6 }}>
                    <CheckCircle size={11} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: "#64748b" }}>{i}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <Callout icon={<Zap size={15} />} title="Why the Credit Memo is your unfair advantage" color="#4f46e5" bg="#eef2ff" border="#c7d2fe"
            body="Most first-time UK buyers approach lenders with a spreadsheet and a hope. You'll arrive with a professionally structured 3-page document that mirrors the format lenders see from PE firms. This alone positions you as a serious buyer and accelerates the approval process by weeks." />
          <div style={{ textAlign: "center" }}>
            <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ padding: "13px 28px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
                Generate your Credit Memo free <ArrowRight size={15} />
              </motion.button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      n: "04", icon: <Users size={22} />, accent: "#d97706",
      title: "Capitalise: Pitch the Passive Investor",
      sub: "Armed with an institutional credit memo, you're now approaching passive investors not as a startup asking for faith — but as a deal architect presenting a pre-underwritten asset with a defined return profile.",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 16 }}>The Investor Pitch — Verbatim Script</p>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "20px 22px", borderLeft: "3px solid #d97706" }}>
              <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>
                "I've sourced and pre-underwritten a profitable UK engineering consultancy that's been trading for 18 years. The owner is retiring and wants a clean exit at £630k.
                <br /><br />
                The business generates £200k in Seller's Discretionary Earnings annually. I've structured a deal using 60% bank debt and 20% vendor finance. I need <strong style={{ color: "#d97706", fontStyle: "normal" }}>£120,000 in equity</strong> from a single passive investor.
                <br /><br />
                The bank loan and vendor earn-out are serviced entirely by the business's cash flow — DSCR is 1.40×. The business pays itself off. You receive a 20% equity stake in a profitable, cash-generating UK business in exchange for the £120k cheque.
                <br /><br />
                I'm bringing the deal, the structure, the legal team, and the operational transition plan. Here's the credit memo."
              </p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 12px" }}>Where to find investors</p>
              {["LinkedIn (search: angel investor UK SME)", "Angel Investment Network UK", "Seed Legal investor database", "ETA / search fund community groups", "Local accountants' referral networks", "SEIS / EIS investment club forums"].map(i => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                  <CheckCircle size={11} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>{i}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 12px" }}>What investors want to hear</p>
              {["Stable, recurring revenue (not growth bets)", "DSCR above 1.30× (the business pays itself)", "Defined exit route (5–7yr horizon)", "Institutional credit memo — not a spreadsheet", "Deal architect (you) taking operational risk", "SEIS / EIS eligibility for tax relief"].map(i => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                  <CheckCircle size={11} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>{i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      n: "05", icon: <Wallet size={22} />, accent: "#dc2626",
      title: "Reap: Pocket the Arbitrage",
      sub: "This is the payoff. You've structured a deal, raised the equity, secured the bank loan, and completed the acquisition — with zero personal capital deployed. Here's exactly what you walk away with on Day 1 and over the hold period.",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "22px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 16px" }}>Day 1 — Completion</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Deal Sourcing Fee (3% of £120k raise)", val: "£3,600", note: "Paid from raised funds at completion" },
                  { label: "Or: Deal Fee (3% of total deal value)", val: "£18,000", note: "Alternative fee structure on total consideration" },
                  { label: "Your Capital Deployed", val: "£0", note: "Zero personal funds required" },
                  { label: "Sweat Equity Received", val: "20%", note: "Common equity for deal architecture + transition" },
                ].map(r => (
                  <div key={r.label} style={{ padding: "11px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{r.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{r.val}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, fontStyle: "italic" }}>{r.note}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "22px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 16px" }}>5-Year Hold — Ongoing</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Annual salary (as MD / operator)", val: "£60–80k", note: "Market rate management salary from business P&L" },
                  { label: "Annual levered FCF dividend", val: "Variable", note: "Residual cash after debt service — paid to you + investors" },
                  { label: "Exit: business sale at Year 5", val: "20% of exit", note: "Your equity stake at year-5 sale multiplied by exit value" },
                  { label: "Target 5yr equity IRR", val: "35–45%", color: "#4f46e5", note: "On investors' capital (they brought the risk, not you)" },
                ].map(r => (
                  <div key={r.label} style={{ padding: "11px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{r.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: (r as { color?: string }).color ?? "#0f172a", letterSpacing: "-0.02em" }}>{r.val}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, fontStyle: "italic" }}>{r.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Callout icon={<Shield size={15} />} title="Legal note" color="#64748b" bg="#f8fafc" border="#e2e8f0"
            body="Deal sourcing fees and equity arrangements must be documented in a legally binding shareholders' agreement and deal completion certificate. Always engage a specialist M&A solicitor. Typical legal costs for a UK SME transaction run £8,000–£15,000." />
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", color: "#0f172a", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.12) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%,transparent 20%,#f8fafc 75%)", WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 0%,transparent 20%,#f8fafc 75%)" }} />

      {/* Nav */}
      <nav style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", border: "1px solid #e2e8f0", borderRadius: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none" }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart3 size={12} color="#fff" /></div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Triage Finance</span>
        </Link>
        <span style={{ color: "#e2e8f0" }}>·</span>
        <BookOpen size={13} color="#64748b" />
        <span style={{ fontSize: 12, color: "#64748b" }}>Deal Sourcing Guide</span>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "100px 24px 80px", position: "relative", zIndex: 1 }}>

        {/* Hero */}
        <motion.div variants={stagger} initial="hidden" animate="visible" style={{ marginBottom: 72 }}>
          <motion.div variants={fadeUp} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9999, padding: "6px 16px" }}>
            <DollarSign size={12} color="#d97706" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706", letterSpacing: "0.08em", textTransform: "uppercase" }}>The Golden Angle · Deal Arbitrage Playbook</span>
          </motion.div>
          <motion.h1 variants={fadeUp} style={{ fontSize: "clamp(32px,5vw,60px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 18px", lineHeight: 1.1 }}>
            How to Acquire a UK Business<br />
            <span style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>With Zero Personal Capital.</span>
          </motion.h1>
          <motion.p variants={fadeUp} style={{ fontSize: 17, color: "#64748b", maxWidth: 640, lineHeight: 1.75, marginBottom: 32 }}>
            The Deal Arbitrage framework is a 5-step system for sourcing, structuring, and completing UK SME acquisitions using bank debt, vendor finance, and raised equity — with your own cash input at precisely zero. This is not theory. This is the mechanics behind every ETA deal that closes without a personal cheque.
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["Source → Structure → Prove → Capitalise → Reap"].map(s => (
              <div key={s} style={{ background: "#0f172a", color: "#f4f4f5", padding: "10px 20px", borderRadius: 9999, fontSize: 13, fontWeight: 700, letterSpacing: "0.02em", fontFamily: "monospace" }}>{s}</div>
            ))}
            <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.03 }} style={{ padding: "10px 20px", borderRadius: 9999, border: "1px solid #e2e8f0", background: "#fff", color: "#4f46e5", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                Try the platform <ArrowRight size={13} />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Live calculator */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EXPO }} style={{ marginBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 2, height: 20, background: "linear-gradient(180deg,#4f46e5,#7c3aed)", borderRadius: 2 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", margin: 0 }}>Live Arbitrage Calculator — Adjust the inputs to model your deal</p>
          </div>
          <ArbitrageCalc />
        </motion.div>

        {/* 5 steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 80 }}>
          {STEPS.map((s, idx) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, ease: EXPO }}>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                {/* Step number column */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 4 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: `${s.accent}12`, border: `1px solid ${s.accent}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: s.accent }}>{s.icon}</span>
                  </div>
                  {idx < STEPS.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 40, background: "linear-gradient(180deg,#e2e8f0,transparent)", marginTop: 12 }} />}
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <SectionHead step={`Step ${s.n}`} title={s.title} sub={s.sub} />
                  {s.content}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EXPO }} style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: "clamp(24px,3.5vw,36px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0f172a", margin: "0 0 32px" }}>Common questions on deal arbitrage.</h2>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "0 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {[
              { q: "Is this legal?", a: "Yes. Acquisition fee structures, sweat equity arrangements, and vendor finance are all standard commercial practices in UK M&A. Deal sourcing fees (2–4%) are legal and common, though they must be disclosed to all parties and documented in a completion statement. Always engage a specialist corporate solicitor." },
              { q: "Do I need M&A experience?", a: "No prior M&A experience is required. The platform handles the financial modelling and credit memo generation. You need the ability to source the deal (relationship building, broker contacts), negotiate vendor finance terms, and project-manage the legal completion process. Many first-time buyers complete ETA deals with no prior corporate finance background." },
              { q: "What if the bank rejects the deal?", a: "If a high-street bank rejects, escalate to specialist SME lenders: OakNorth, ThinCats, Funding Circle, or SFC Commercial. These lenders have higher risk tolerance for acquisition finance. A DSCR above 1.30× is accepted by most specialist lenders even if Barclays or HSBC declines. The credit memo is specifically formatted to maximise approval likelihood." },
              { q: "Can I do this if I keep my day job?", a: "Yes — this is the core ETA (Entrepreneurship Through Acquisition) model. You source the deal, complete the acquisition, hire an operational manager to run the business on Day 1, and oversee it as a part-time director. Your day job income funds your living costs while the acquired business generates passive income. The MD salary comes after the deal closes." },
              { q: "What's the risk if the business underperforms?", a: "The bank loan and vendor finance are secured against the business's assets and cash flow — not against your personal assets (if structured correctly with limited liability). The key risk mitigation is ensuring vendor finance has a performance-linked element: if SDE drops below projections, the vendor payment reduces proportionally. This is negotiable and standard in professional earn-outs." },
            ].map(f => <FAQ key={f.q} {...f} />)}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EXPO }} style={{ marginTop: 72 }}>
          <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", borderRadius: 24, padding: "52px 44px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(99,102,241,0.15)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(168,85,247,0.1)", pointerEvents: "none" }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16, position: "relative" }}>Ready to start?</p>
            <h2 style={{ fontSize: "clamp(24px,4vw,44px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#f4f4f5", margin: "0 0 16px", lineHeight: 1.15, position: "relative" }}>
              Audit your first deal.<br />
              <span style={{ background: "linear-gradient(135deg,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Generate your Credit Memo free.</span>
            </h2>
            <p style={{ fontSize: 15, color: "#71717a", marginBottom: 36, maxWidth: 440, margin: "0 auto 36px", lineHeight: 1.7, position: "relative" }}>
              Paste any UK business listing into the Triage engine. Structure your capital stack. Download the institutional credit memo in under 60 seconds.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
              <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  style={{ padding: "14px 28px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}>
                  Audit a Deal — Free <ArrowRight size={16} />
                </motion.button>
              </Link>
              <Link href="/" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.03 }} style={{ padding: "14px 28px", borderRadius: 12, cursor: "pointer", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#a1a1aa", fontSize: 15, fontWeight: 600 }}>
                  Back to homepage
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer note */}
        <div style={{ marginTop: 48, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
            This guide is for educational purposes only. Deal structuring, equity arrangements, and fee agreements require independent legal and financial advice. Triage Finance is not authorised by the FCA and does not provide financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
