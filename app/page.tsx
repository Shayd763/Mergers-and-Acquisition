"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Shield, Zap, FileText, TrendingUp, Users,
  ChevronDown, ArrowRight, CheckCircle, Star, Building2,
  Lock, Globe, Layers, Activity, BookOpen, DollarSign,
  Target, Wallet, Briefcase, LineChart,
} from "lucide-react";

/* ─── Mobile detection ───────────────────────────────────────────────────── */
function subscribe(cb: () => void) {
  const mq = typeof window !== "undefined" ? window.matchMedia("(hover: none)") : null;
  mq?.addEventListener("change", cb);
  return () => mq?.removeEventListener("change", cb);
}
function useIsTouch() {
  return useSyncExternalStore(
    subscribe,
    () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches,
    () => false,
  );
}

/* ─── Variants ───────────────────────────────────────────────────────────── */
const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EXPO } },
};
const stagger = { visible: { transition: { staggerChildren: 0.14 } } };

/* ─── Spotlight card ─────────────────────────────────────────────────────── */
function SpotlightCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [inside, setInside] = useState(false);
  const isTouch = useIsTouch();
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);
  return (
    <motion.div ref={ref}
      onMouseMove={isTouch ? undefined : onMove}
      onMouseEnter={isTouch ? undefined : () => setInside(true)}
      onMouseLeave={isTouch ? undefined : () => setInside(false)}
      whileHover={isTouch ? undefined : { scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{ position: "relative", overflow: "hidden", borderRadius: 24, border: "1px solid #d6d3d1", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...style }}>
      {inside && !isTouch && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(260px circle at ${pos.x}px ${pos.y}px, rgba(28,25,23,0.05), transparent 70%)`, zIndex: 0 }} />}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

/* ─── Mini deal slider ───────────────────────────────────────────────────── */
function DealSlider() {
  const [equity, setEquity] = useState(25);
  const ASKING = 450000;
  const vendor = Math.max(0, Math.min(40, 100 - equity - 35));
  const bank = 100 - equity - vendor;
  const equityAmt = Math.round((ASKING * equity) / 100);
  const bankAmt = Math.round((ASKING * bank) / 100);
  const vendorAmt = Math.round((ASKING * vendor) / 100);
  const mr = 0.12 / 12;
  const nm = 60;
  const annualDebt = bankAmt * (mr * Math.pow(1 + mr, nm)) / (Math.pow(1 + mr, nm) - 1) * 12;
  const sde = 183000;
  const dscr = annualDebt > 0 ? sde / annualDebt : 99;
  const dscrOk = dscr >= 1.25;
  const pct = ((equity - 10) / 60) * 100;
  return (
    <div style={{ padding: "20px 24px" }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#a8a29e", textTransform: "uppercase", marginBottom: 14 }}>Live Preview — Manchester Consultancy · £450k</p>
      <div style={{ height: 7, borderRadius: 9999, overflow: "hidden", display: "flex", background: "#e7e5e4", marginBottom: 18, border: "1px solid #d6d3d1" }}>
        <div style={{ width: `${equity}%`, background: "linear-gradient(90deg,#166534,#14532d)", transition: "width 0.2s" }} />
        <div style={{ width: `${vendor}%`, background: "linear-gradient(90deg,#292524,#a855f7)", transition: "width 0.2s" }} />
        <div style={{ width: `${bank}%`, background: "linear-gradient(90deg,#d97706,#f59e0b)", transition: "width 0.2s" }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#78716c" }}>Buyer Equity</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1c1917" }}>{equity}% · £{equityAmt.toLocaleString()}</span>
        </div>
        <div style={{ position: "relative", height: 5 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 9999, background: `linear-gradient(90deg, #1c1917 ${pct}%, #d6d3d1 ${pct}%)` }} />
          <input type="range" min={10} max={70} value={equity} onChange={e => setEquity(Number(e.target.value))} style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%" }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[{ label: "Bank Loan", val: `£${(bankAmt/1000).toFixed(0)}k`, color: "#d97706" }, { label: "Vendor Finance", val: `£${(vendorAmt/1000).toFixed(0)}k`, color: "#292524" }, { label: "DSCR", val: dscr > 50 ? "∞" : `${dscr.toFixed(2)}×`, color: dscrOk ? "#059669" : "#dc2626" }].map(s => (
          <div key={s.label} style={{ background: "#faf9f7", border: "1px solid #d6d3d1", borderRadius: 10, padding: "9px 10px", textAlign: "center" }}>
            <p style={{ fontSize: 9, color: "#a8a29e", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: 0 }}>{s.val}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 9, background: dscrOk ? "#ecfdf5" : "#fef2f2", border: `1px solid ${dscrOk ? "#a7f3d0" : "#fecaca"}` }}>
        <span style={{ fontSize: 11, color: dscrOk ? "#059669" : "#dc2626", fontWeight: 600 }}>
          {dscrOk ? `✓  DSCR ${dscr.toFixed(2)}× — Bankable. Lenders will accept this.` : `✗  DSCR ${dscr.toFixed(2)}× — Below 1.25×. Increase equity.`}
        </span>
      </div>
    </div>
  );
}

/* ─── Calculators dropdown ───────────────────────────────────────────────── */
const CALC_LINKS = [
  { href: "/calculators/dscr-calculator",             label: "DSCR Calculator",      sub: "Debt service coverage ratio" },
  { href: "/calculators/sme-debt-capacity",           label: "SME Debt Capacity",     sub: "Max supportable loan amount" },
  { href: "/calculators/sde-to-ebitda",               label: "SDE → EBITDA Bridge",   sub: "Owner-operator vs hired GM" },
  { href: "/calculators/stamp-duty",                  label: "Stamp Duty",            sub: "SDLT & SDRT on acquisitions" },
  { href: "/calculators/compound-interest-calculator",label: "Compound Return",       sub: "Equity ROI over hold period" },
];
function CalcDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 9999, fontSize: 13, color: open ? "#1c1917" : "#78716c", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#1c1917")} onMouseLeave={e => { if (!open) e.currentTarget.style.color = "#78716c"; }}>
        Calculators
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} style={{ display: "flex" }}><ChevronDown size={13} /></motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.18, ease: EXPO }}
            style={{ position: "absolute", top: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid #d6d3d1", borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.12)", width: 280, padding: "8px", zIndex: 200 }}>
            {CALC_LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ display: "block", textDecoration: "none", padding: "10px 14px", borderRadius: 10, transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#faf9f7")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1c1917", margin: "0 0 2px" }}>{l.label}</p>
                <p style={{ fontSize: 11, color: "#a8a29e", margin: 0 }}>{l.sub}</p>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #e7e5e4" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", textAlign: "left" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#1c1917" }}>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={16} color="#a8a29e" /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EXPO }} style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 14, color: "#78716c", lineHeight: 1.75, paddingBottom: 16, margin: 0 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Pricing card ───────────────────────────────────────────────────────── */
function PricingCard({ name, price, desc, features, cta, highlight = false, href, isCurrent = false }: { name: string; price: string; desc: string; features: string[]; cta: string; highlight?: boolean; href: string; isCurrent?: boolean }) {
  return (
    <SpotlightCard style={{ position: "relative", padding: "32px 28px", display: "flex", flexDirection: "column", height: "100%", background: highlight ? "#1c1917" : "#ffffff", border: isCurrent ? "2px solid #059669" : highlight ? "1px solid #0c0a09" : "1px solid #d6d3d1", boxShadow: isCurrent ? "0 0 0 4px rgba(5,150,105,0.1), 0 4px 16px rgba(0,0,0,0.08)" : highlight ? "0 20px 60px rgba(28,25,23,0.25)" : "0 1px 3px rgba(0,0,0,0.06)" }}>
      {/* Current plan badge */}
      {isCurrent && (
        <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#059669", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 9999, textTransform: "uppercase", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(5,150,105,0.35)" }}>
          ✓ Your Current Plan
        </div>
      )}
      {highlight && !isCurrent && <div style={{ alignSelf: "flex-start", marginBottom: 16, background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", padding: "4px 10px", borderRadius: 9999, textTransform: "uppercase" }}>Most Popular</div>}
      <p style={{ fontSize: 12, fontWeight: 600, color: highlight ? "rgba(255,255,255,0.7)" : "#1c1917", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{name}</p>
      <p style={{ fontSize: 36, fontWeight: 800, color: highlight ? "#fff" : "#1c1917", margin: "0 0 4px", letterSpacing: "-0.03em" }}>{price}</p>
      <p style={{ fontSize: 13, color: highlight ? "rgba(255,255,255,0.6)" : "#78716c", marginBottom: 28 }}>{desc}</p>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {features.map(f => (
          <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <CheckCircle size={14} color={highlight ? "rgba(255,255,255,0.8)" : "#059669"} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: highlight ? "rgba(255,255,255,0.75)" : "#78716c" }}>{f}</span>
          </div>
        ))}
      </div>
      <Link href={isCurrent ? "/dashboard/account" : href} style={{ textDecoration: "none" }}>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: isCurrent ? "none" : highlight ? "none" : "1px solid #d6d3d1", cursor: "pointer", fontWeight: 700, fontSize: 14, background: isCurrent ? "#059669" : highlight ? "#ffffff" : "#faf9f7", color: isCurrent ? "#fff" : highlight ? "#1c1917" : "#44403c" }}>
          {isCurrent ? "Manage Plan →" : cta}
        </motion.button>
      </Link>
    </SpotlightCard>
  );
}

/* ─── Bento cell ─────────────────────────────────────────────────────────── */
function BentoCell({ icon, label, value, sub, iconBg }: { icon: React.ReactNode; label: string; value: string; sub: string; iconBg: string }) {
  return (
    <SpotlightCard style={{ padding: "28px 24px" }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>{icon}</div>
      <p style={{ fontSize: 12, color: "#a8a29e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: "#1c1917", letterSpacing: "-0.03em", margin: "0 0 4px" }}>{value}</p>
      <p style={{ fontSize: 12, color: "#a8a29e", margin: 0 }}>{sub}</p>
    </SpotlightCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* DATA                                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

const FAQS = [
  { q: "Who is Acquisition Exchange built for?", a: "ETA buyers, search fund operators, independent sponsors, and first-time acquirers in the UK SME market. We also serve business owners wanting to understand their buyability score, and deal syndicators structuring acquisitions on behalf of passive investors." },
  { q: "How does the AI extraction work?", a: "Paste raw listing text — broker PDFs, Rightbiz/Daltons descriptions, or CIM summaries — and Claude extracts structured financials in under a second: asking price, revenue, net profit, lease data, and add-backs. These feed directly into our deterministic financial model." },
  { q: "What is the Deal Arbitrage model?", a: "Deal Arbitrage is a framework where you source and structure a UK business acquisition using bank debt (60%), vendor finance (20%), and raised equity (20%) — with zero personal capital required. You export an institutional credit memo to attract passive investors, charge a 2–4% deal sourcing fee at completion, and retain 15–30% sweat equity as the deal architect." },
  { q: "How does the lender referral work?", a: "We maintain relationships with SME-focused UK commercial lenders. When you submit a deal, we package your credit memo and send it to matched lenders. We receive a standard referral commission upon successful loan origination — at no additional cost to you." },
  { q: "Is this advice?", a: "Acquisition Exchange is a rapid screening tool, not financial advice. Our outputs are directional indicators. Always verify financials with a qualified accountant and solicitor before proceeding with any acquisition." },
  { q: "Can I use this as a business seller?", a: "Yes — our sell-side funnel lets you input your own financials and receive a Bankability Score: an institutional assessment of how easy it would be for a buyer to get a high-street bank loan to acquire your business. You can export a buyer prospectus and register to be matched with our network of pre-vetted, high-value UK acquirers." },
  { q: "What is the Debt Offset Guarantee?", a: "Active Searcher and Deal Broker subscribers who successfully raise acquisition debt through our licensed commercial partner network receive a 100% refund of their subscription fees paid over the preceding 12 months — up to £588 (Searcher) or £1,788 (Broker) — credited directly to their account upon loan completion. Pro literally pays for itself the moment you close." },
];

const TESTIMONIALS = [
  { name: "James Hartley", role: "Search Fund Principal, London", quote: "I screened 40 deals in a month using Acquisition Exchange. The DSCR and levered FCF outputs saved me hours of spreadsheet work per deal. It's become essential to my process.", rating: 5 },
  { name: "Sophie Chen", role: "ETA Buyer, Birmingham", quote: "The credit memo PDF alone is worth the subscription. I sent it directly to my broker — they said it was more polished than most buyers they see at Series A stage.", rating: 5 },
  { name: "Marcus Webb", role: "Independent Sponsor, Manchester", quote: "I used the Deal Arbitrage model to structure my first acquisition with £0 personal capital. The credit memo convinced two angel investors to contribute the 20% equity in under a week.", rating: 5 },
];

/* ─── Hero tab content ───────────────────────────────────────────────────── */
const BUYER_PHRASES = [
  "UK Business Acquisitions.",
  "SME Deal Intelligence.",
  "Lender-Ready Credit Memos.",
  "Zero-Capital Structuring.",
  "Institutional Deal Packaging.",
];
const SELLER_PHRASES = [
  "Your UK Business.",
  "Your Enterprise Value.",
  "A Buyer-Ready Prospectus.",
  "Serious UK Acquirers.",
  "Your Exit, Structured.",
];

const HERO_CONTENT = {
  buyer: {
    badge: "Buy-Side Engine · UK M&A",
    headline1: "End-to-End Deal Intelligence for",
    sub: "Analyse and audit any target for validity and assurance — from Companies House registry checks and credit scoring to deal structuring and direct financing with our lender partners. One platform, every step.",
    cta1: { label: "Audit a Deal — Free", href: "/dashboard/triage" },
    cta2: { label: "Read the Deal Sourcing Guide", href: "/deal-sourcing-guide" },
    accent: "#292524",
    accentEnd: "#1c1917",
    phrases: BUYER_PHRASES,
  },
  seller: {
    badge: "Sell-Side Engine · Valuation & Exit",
    headline1: "Unlock Serious Buyers for",
    sub: "Determine your enterprise value and generate an industry-approved prospectus to attract qualified buyers. Pre-arrange deal structures for incoming offers — and register your business to be matched with our network of pre-vetted, high-value UK acquirers.",
    cta1: { label: "Value My Business", href: "/sell" },
    cta2: { label: "See how buyers model deals", href: "/dashboard/triage" },
    accent: "#059669",
    accentEnd: "#10b981",
    phrases: SELLER_PHRASES,
  },
};

/* ─── Arbitrage step card ────────────────────────────────────────────────── */
function ArbitrageStep({ n, icon, title, body, accent }: { n: number; icon: React.ReactNode; title: string; body: string; accent: string }) {
  return (
    <SpotlightCard style={{ padding: "28px 24px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: "0.1em" }}>STEP {n}</span>
      </div>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: "#1c1917", margin: "0 0 10px", letterSpacing: "-0.02em" }}>{title}</h4>
      <p style={{ fontSize: 13, color: "#78716c", lineHeight: 1.7, margin: 0 }}>{body}</p>
    </SpotlightCard>
  );
}

/* ─── Count-up stat ─────────────────────────────────────────────────────── */
function StatNumber({ val, suffix = "", prefix = "" }: { val: number; suffix?: string; prefix?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start: number | null = null;
      const duration = 1200;
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayed(Math.round(eased * val));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [val]);
  return <p ref={ref} style={{ fontSize: 30, fontWeight: 800, color: "#1c1917", letterSpacing: "-0.04em", margin: "0 0 6px" }}>{prefix}{displayed}{suffix}</p>;
}

/* ─── Ticker / marquee ───────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Companies House Registry Verified",
  "FCA Financial Services Register",
  "Credit Score · Band A–E",
  "EV / SDE Multiples",
  "DSCR Analysis",
  "4-Page Institutional Credit Memo",
  "HMRC VAT Validation",
  "PSC Concentration Risk",
  "Lender-Ready Deal Packaging",
  "Forensic P&L Audit",
  "Capital Stack Modelling",
  "Stress-Tested Cashflows",
  "OpenCorporates Director Check",
  "Valuation Estimate · Credit-Adjusted",
  "Postcodes.io Deprivation Index",
  "Vendor Finance Structuring",
];

function Ticker() {
  return (
    <div style={{
      overflow: "hidden",
      borderTop: "1px solid #d6d3d1",
      borderBottom: "1px solid #d6d3d1",
      background: "#faf9f7",
      padding: "11px 0",
      position: "relative",
    }}>
      {/* Fade edges */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(90deg, #faf9f7, transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(-90deg, #faf9f7, transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div className="ticker-inner" style={{
        display: "flex",
        gap: 0,
        animation: "ticker-scroll 22s linear infinite",
        width: "max-content",
      }}>
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} style={{
            fontSize: 11.5, fontWeight: 600,
            color: i % 4 === 0 ? "#1c1917" : i % 4 === 1 ? "#0891b2" : i % 4 === 2 ? "#059669" : "#78716c",
            whiteSpace: "nowrap",
            padding: "0 28px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor", display: "inline-block", opacity: 0.5 }} />
            {item}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes hero-gradient-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (hover: none) {
          .ticker-inner { animation: none !important; }
          .hero-phrase-gradient { animation: none !important; background-position: 0% 50% !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-inner { animation: none !important; }
          .hero-phrase-gradient { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Portal button — session-aware ──────────────────────────────────────── */
function PortalLoginButton() {
  const { data: session, status } = useSession();
  const [toast, setToast] = useState(false);
  const isSignedIn = status === "authenticated" && !!session?.user;

  const handleClick = () => {
    window.location.href = "/dashboard";
    if (!isSignedIn) setTimeout(() => setToast(true), 15_000);
  };

  const displayName = session?.user?.name ?? session?.user?.email ?? "";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 6 }}>
        {/* Avatar pill when signed in — hidden on mobile to prevent nav overflow */}
        {isSignedIn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="nav-desktop-links"
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 10px 4px 4px", borderRadius: 9999, background: "#f0fdf4", border: "1px solid #bbf7d0", cursor: "default" }}
          >
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {initials || "U"}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#15803d", whiteSpace: "nowrap" }}>Signed in</span>
          </motion.div>
        )}

        <motion.button
          onClick={handleClick}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{ padding: "7px 16px", borderRadius: 9999, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#166534,#14532d)", color: "#fff", fontSize: 13, fontWeight: 700, boxShadow: "0 0 16px rgba(28,25,23,0.3)", whiteSpace: "nowrap" }}
        >
          {isSignedIn ? "Portal →" : "Portal Login →"}
        </motion.button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              position: "fixed", bottom: 24, right: 24, zIndex: 9999,
              background: "#1c1917", border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: 14, padding: "16px 20px", maxWidth: 320,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            <button
              onClick={() => setToast(false)}
              style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
            >×</button>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Save your deal analysis</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>
                Create a free account to save unlimited deal audits and pick up where you left off.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/signup" style={{ flex: 1, textDecoration: "none" }}>
                <button style={{ width: "100%", padding: "8px 0", background: "linear-gradient(135deg,#166534,#14532d)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Create free account →
                </button>
              </Link>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <button style={{ padding: "8px 14px", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Sign in
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* PAGE                                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [track, setTrack] = useState<"buyer" | "seller">("buyer");
  const [phraseIdx, setPhraseIdx] = useState(0);


  // Reset phrase on track switch, then cycle every 3.5s
  useEffect(() => {
    setPhraseIdx(0);
    const id = setInterval(() => setPhraseIdx(i => (i + 1) % HERO_CONTENT[track].phrases.length), 5000);
    return () => clearInterval(id);
  }, [track]);

  const hero = HERO_CONTENT[track];

  const NAV_LINKS = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <div style={{ background: "#efece6", minHeight: "100vh", color: "#1c1917", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>

      {/* ── Aurora background ──────────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        {/* Only 2 orbs on mobile; 5 on desktop. All use will-change:transform for GPU promotion. */}
        <div className="aurora-orb orb1" style={{
          position: "absolute", width: 900, height: 900, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%)",
          top: "-20%", left: "-15%",
          willChange: "transform",
        }} />
        <div className="aurora-orb orb2" style={{
          position: "absolute", width: 750, height: 750, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 65%)",
          top: "-10%", right: "-10%",
          willChange: "transform",
        }} />
        <div className="aurora-orb orb3 desktop-orb" style={{
          position: "absolute", width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 65%)",
          top: "40%", left: "-5%",
          willChange: "transform",
        }} />
        <div className="aurora-orb orb4 desktop-orb" style={{
          position: "absolute", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 65%)",
          bottom: "-10%", right: "-5%",
          willChange: "transform",
        }} />
        <div className="aurora-orb orb5 desktop-orb" style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244,114,182,0.05) 0%, transparent 65%)",
          bottom: "15%", left: "20%",
          willChange: "transform",
        }} />
      </div>

      <style>{`
        /* Desktop: full blur + animation */
        @media (hover: hover) {
          .orb1 { filter: blur(60px); animation: orb1 18s ease-in-out infinite; }
          .orb2 { filter: blur(70px); animation: orb2 22s ease-in-out infinite; }
          .orb3 { filter: blur(80px); animation: orb3 26s ease-in-out infinite; }
          .orb4 { filter: blur(90px); animation: orb4 30s ease-in-out infinite; }
          .orb5 { filter: blur(80px); animation: orb5 20s ease-in-out infinite; }
        }
        /* Mobile: lighter blur, no animation, hide extra orbs */
        @media (hover: none) {
          .orb1 { filter: blur(30px); }
          .orb2 { filter: blur(35px); }
          .desktop-orb { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora-orb { animation: none !important; }
        }
        @keyframes orb1 {
          0%,100% { transform: translate(0,   0)   scale(1);    }
          33%      { transform: translate(80px, 60px) scale(1.08); }
          66%      { transform: translate(-40px,100px) scale(0.95); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,   0)    scale(1);    }
          40%      { transform: translate(-90px, 80px) scale(1.10); }
          70%      { transform: translate(50px, -50px) scale(0.93); }
        }
        @keyframes orb3 {
          0%,100% { transform: translate(0,   0)    scale(1);    }
          30%      { transform: translate(60px,-80px) scale(1.06); }
          65%      { transform: translate(120px,40px) scale(0.97); }
        }
        @keyframes orb4 {
          0%,100% { transform: translate(0,   0)     scale(1);    }
          35%      { transform: translate(-70px,-60px) scale(1.12); }
          70%      { transform: translate(-20px, 80px) scale(0.96); }
        }
        @keyframes orb5 {
          0%,100% { transform: translate(0,   0)    scale(1);    }
          50%      { transform: translate(100px,-70px) scale(1.15); }
        }
      `}</style>

      {/* ── Floating nav ─────────────────────────────────────────────────── */}
      {/* Plain fixed wrapper centres the pill; Framer Motion only animates y  */}
      <div style={{ position: "fixed", top: 16, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center", padding: "0 12px", pointerEvents: "none" }}>
        <motion.nav
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: EXPO }}
          style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid #d6d3d1", borderRadius: 9999, padding: "8px 12px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: "calc(100vw - 24px)", pointerEvents: "all" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#166534,#14532d)", flexShrink: 0 }}><BarChart3 size={13} color="#fff" /></div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1c1917", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>Acquisition Exchange</span>
          </Link>
          {/* Desktop links */}
          <div className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <div style={{ width: 1, height: 20, background: "#d6d3d1", margin: "0 6px" }} />
            {[{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }].map(l => (
              <motion.a key={l.label} href={l.href} whileHover={{ scale: 1.04 }} style={{ padding: "6px 13px", borderRadius: 9999, fontSize: 13, color: "#78716c", fontWeight: 500, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#1c1917")} onMouseLeave={e => (e.currentTarget.style.color = "#78716c")}>{l.label}</motion.a>
            ))}
            <CalcDropdown />
            {[{ label: "Valuation Guide", href: "/guide" }, { label: "Deal Guide", href: "/deal-sourcing-guide" }].map(l => (
              <Link key={l.href} href={l.href} style={{ textDecoration: "none" }}>
                <motion.span whileHover={{ scale: 1.04 }} style={{ display: "inline-block", padding: "6px 13px", borderRadius: 9999, fontSize: 13, color: "#78716c", fontWeight: 500, cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#1c1917")} onMouseLeave={e => (e.currentTarget.style.color = "#78716c")}>{l.label}</motion.span>
              </Link>
            ))}
            <motion.a href="#faq" whileHover={{ scale: 1.04 }} style={{ padding: "6px 13px", borderRadius: 9999, fontSize: 13, color: "#78716c", fontWeight: 500, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#1c1917")} onMouseLeave={e => (e.currentTarget.style.color = "#78716c")}>FAQ</motion.a>
            <div style={{ width: 1, height: 20, background: "#d6d3d1", margin: "0 6px" }} />
            <Link href="/sell" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ padding: "7px 14px", borderRadius: 9999, border: "1px solid #d6d3d1", cursor: "pointer", background: "#faf9f7", color: "#44403c", fontSize: 13, fontWeight: 600 }}>Sell a Business</motion.button>
            </Link>
          </div>
          {/* Primary CTA — always visible */}
          <PortalLoginButton />
          {/* Hamburger */}
          <button className="nav-mobile-btn" onClick={() => setMobileNavOpen(o => !o)}
            style={{ marginLeft: 6, width: 36, height: 36, borderRadius: 10, border: "1px solid #d6d3d1", background: mobileNavOpen ? "#1c1917" : "#faf9f7", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, alignItems: "center", justifyContent: "center", transition: "background 0.2s", flexShrink: 0 }}>
            <span style={{ width: 14, height: 1.5, background: mobileNavOpen ? "#fff" : "#44403c", borderRadius: 1, transform: mobileNavOpen ? "rotate(45deg) translate(4px, 4px)" : "none", transition: "transform 0.22s, background 0.2s" }} />
            <span style={{ width: 14, height: 1.5, background: mobileNavOpen ? "#fff" : "#44403c", borderRadius: 1, opacity: mobileNavOpen ? 0 : 1, transition: "opacity 0.18s, background 0.2s" }} />
            <span style={{ width: 14, height: 1.5, background: mobileNavOpen ? "#fff" : "#44403c", borderRadius: 1, transform: mobileNavOpen ? "rotate(-45deg) translate(4px, -4px)" : "none", transition: "transform 0.22s, background 0.2s" }} />
          </button>
        </motion.nav>
      </div>

      {/* ── Mobile menu — outside centering wrapper so pointer-events work ── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: EXPO }}
            style={{ position: "fixed", inset: 0, zIndex: 98, background: "#07070f", display: "flex", flexDirection: "column", padding: "100px 32px 48px", overflowY: "auto" }}>
            <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 500, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(28,25,23,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 18 }}>Platform</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 40 }}>
              {[
                { href: "/dashboard/triage", label: "Triage a Deal",   sub: "Analyse any UK business acquisition", icon: <Target size={16} /> },
                { href: "#features",          label: "Features",        sub: "What the platform does",             icon: <Layers size={16} /> },
                { href: "#pricing",           label: "Pricing",         sub: "Plans from free to institutional",   icon: <Wallet size={16} /> },
                { href: "/sell",              label: "Sell a Business", sub: "Value, prospect and find buyers",    icon: <Briefcase size={16} /> },
              ].map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 + i * 0.055, duration: 0.35, ease: EXPO }}>
                  <Link href={l.href} onClick={() => setMobileNavOpen(false)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8", flexShrink: 0 }}>{l.icon}</div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: "0 0 2px" }}>{l.label}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>{l.sub}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 18 }}>Resources</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 40 }}>
              {[
                { href: "/guide",               label: "Valuation Guide",     sub: "How UK SME businesses are valued",  icon: <BookOpen size={16} /> },
                { href: "/deal-sourcing-guide",  label: "Deal Sourcing Guide", sub: "Find, screen and structure deals",  icon: <LineChart size={16} /> },
                { href: "#faq",                  label: "FAQ",                 sub: "Common questions answered",         icon: <Shield size={16} /> },
                ...CALC_LINKS.map(l => ({ href: l.href, label: l.label, sub: l.sub, icon: <DollarSign size={16} /> })),
              ].map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.045, duration: 0.35, ease: EXPO }}>
                  <Link href={l.href} onClick={() => setMobileNavOpen(false)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", borderRadius: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>{l.icon}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.75)", margin: "0 0 1px" }}>{l.label}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", margin: 0 }}>{l.sub}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4, ease: EXPO }} style={{ marginTop: "auto" }}>
              <Link href="/dashboard" onClick={() => setMobileNavOpen(false)} style={{ textDecoration: "none", display: "block" }}>
                <div style={{ background: "linear-gradient(135deg,#166534,#14532d)", borderRadius: 16, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 0 40px rgba(28,25,23,0.3)" }}>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 3px" }}>Start for free</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>Triage your first deal in 60 seconds</p>
                  </div>
                  <ArrowRight size={20} color="rgba(255,255,255,0.8)" />
                </div>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 20px 60px", position: "relative", zIndex: 1, textAlign: "center" }}>
        {/* Breathing ambient glow behind the headline */}
        <div className="hero-glow" style={{ position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 420, borderRadius: "50%", background: `radial-gradient(ellipse, ${track === "buyer" ? "rgba(28,25,23,0.13)" : "rgba(5,150,105,0.10)"} 0%, transparent 70%)`, pointerEvents: "none", transition: "background 0.6s", animation: "hero-glow-breathe 5s ease-in-out infinite" }} />
        <style>{`
          @keyframes hero-glow-breathe {
            0%, 100% { opacity: 0.7; transform: translate(-50%,-50%) scale(1); }
            50%       { opacity: 1;   transform: translate(-50%,-50%) scale(1.18); }
          }
          @media (hover: none) {
            .hero-glow { animation: none !important; opacity: 0.8; }
          }
        `}</style>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* ── Buyer / Seller toggle ─────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05, duration: 0.45 }}
            style={{ display: "inline-flex", background: "#fff", border: "1px solid #d6d3d1", borderRadius: 9999, padding: 4, marginBottom: 36, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: "calc(100vw - 48px)" }}>
            {(["buyer", "seller"] as const).map(t => (
              <button key={t} onClick={() => setTrack(t)} style={{
                padding: "9px 22px", borderRadius: 9999, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                background: track === t ? (t === "buyer" ? "linear-gradient(135deg,#166534,#14532d)" : "linear-gradient(135deg,#059669,#10b981)") : "transparent",
                color: track === t ? "#fff" : "#78716c",
                boxShadow: track === t ? "0 2px 10px rgba(0,0,0,0.15)" : "none",
              }}>
                {t === "buyer" ? <><span className="nav-desktop-links">🔍 </span>Buy a business</> : <><span className="nav-desktop-links">🏢 </span>Sell my business</>}
              </button>
            ))}
          </motion.div>

          {/* Badge */}
          <AnimatePresence mode="popLayout">
            <motion.div key={track + "-badge"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28, background: track === "buyer" ? "#e7e5e4" : "#ecfdf5", border: `1px solid ${track === "buyer" ? "#d6d3d1" : "#a7f3d0"}`, borderRadius: 9999, padding: "6px 14px" }}>
              <Activity size={12} color={track === "buyer" ? "#1c1917" : "#059669"} />
              <span style={{ fontSize: 12, color: track === "buyer" ? "#1c1917" : "#059669", fontWeight: 600, letterSpacing: "0.04em" }}>{hero.badge}</span>
            </motion.div>
          </AnimatePresence>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: EXPO }}
            style={{ fontSize: "clamp(40px, 6.5vw, 80px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 22px", maxWidth: 820 }}>
            {/* Static first line */}
            <span style={{ color: "#1c1917" }}>{hero.headline1}</span>
            <br />
            {/* Fixed-height container prevents layout shift when phrases swap */}
            <span style={{
              display: "block",
              position: "relative",
              height: "1.15em",
              overflow: "hidden",
            }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={track + "-" + phraseIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="hero-phrase-gradient"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    background: `linear-gradient(110deg, ${hero.accent} 0%, ${hero.accentEnd} 40%, #a78bfa 70%, ${hero.accent} 100%)`,
                    backgroundSize: "300% 100%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "hero-gradient-shift 4s ease-in-out infinite",
                  }}
                >
                  {hero.phrases[phraseIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          {/* Sub */}
          <AnimatePresence mode="popLayout">
            <motion.p key={track + "-sub"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: EXPO }}
              style={{ fontSize: "clamp(15px, 2vw, 19px)", color: "#78716c", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
              {hero.sub}
            </motion.p>
          </AnimatePresence>

          {/* CTAs */}
          <AnimatePresence mode="popLayout">
            <motion.div key={track + "-ctas"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, delay: 0.08 }}
              style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href={hero.cta1.href} style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.04, boxShadow: `0 8px 30px ${track === "buyer" ? "rgba(28,25,23,0.35)" : "rgba(5,150,105,0.3)"}` }} whileTap={{ scale: 0.97 }}
                  style={{ padding: "14px 28px", borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${hero.accent},${track === "buyer" ? "#1c1917" : "#10b981"})`, color: "#fff", fontSize: 15, fontWeight: 700, boxShadow: `0 4px 20px ${track === "buyer" ? "rgba(28,25,23,0.25)" : "rgba(5,150,105,0.2)"}`, display: "flex", alignItems: "center", gap: 8 }}>
                  {hero.cta1.label} <ArrowRight size={16} />
                </motion.button>
              </Link>
              <Link href={hero.cta2.href} style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ padding: "14px 28px", borderRadius: 12, cursor: "pointer", background: "#ffffff", border: "1px solid #d6d3d1", color: "#44403c", fontSize: 15, fontWeight: 600, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
                  {hero.cta2.label}
                </motion.button>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Trust strip */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.6 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, marginTop: 48, flexWrap: "wrap" }}>
            {[{ icon: <Building2 size={13} />, text: "240+ deals triaged" }, { icon: <Lock size={13} />, text: "Bank-grade encryption" }, { icon: <Globe size={13} />, text: "UK SME market focused" }].map(s => (
              <div key={s.text} style={{ display: "flex", alignItems: "center", gap: 7, color: "#a8a29e", fontSize: 12, fontWeight: 500 }}>{s.icon}<span>{s.text}</span></div>
            ))}
          </motion.div>
        </div>

        {/* Hero card */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.8, ease: EXPO }}
          className="hero-demo-card"
          style={{ width: "100%", maxWidth: 440, marginTop: 56, position: "relative", zIndex: 2 }}>
          <div style={{ position: "absolute", inset: -24, borderRadius: 48, background: "radial-gradient(ellipse at center, rgba(28,25,23,0.12) 0%, transparent 70%)", filter: "blur(20px)", pointerEvents: "none" }} />
          <SpotlightCard style={{ overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid #e7e5e4", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>{["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.8 }} />)}</div>
              <span style={{ fontSize: 11, color: "#a8a29e", fontWeight: 500, marginLeft: 4 }}>Triage — Capital Structure</span>
            </div>
            <DealSlider />
          </SpotlightCard>
        </motion.div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <motion.section variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} style={{ padding: "0 24px 80px", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 1, maxWidth: 860, width: "100%", background: "#d6d3d1", borderRadius: 16, border: "1px solid #d6d3d1", overflow: "hidden" }}>
          {[
            { val: "< 1s",     label: "AI extraction speed",    num: null },
            { val: "19",       label: "IB-grade metrics",        num: 19 },
            { val: "1%",       label: "referral on debt closure", num: 1, suffix: "%" },
            { val: "4 lenders",label: "in the network",          num: 4, suffix: " lenders" },
          ].map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} style={{ padding: "28px 24px", textAlign: "center", background: "#fff", borderRight: i < 3 ? "1px solid #d6d3d1" : "none" }}>
              {s.num !== null && s.num !== undefined
                ? <StatNumber val={s.num} suffix={s.suffix ?? ""} />
                : <p style={{ fontSize: 30, fontWeight: 800, color: "#1c1917", letterSpacing: "-0.04em", margin: "0 0 6px" }}>{s.val}</p>
              }
              <p style={{ fontSize: 12, color: "#a8a29e", fontWeight: 500, margin: 0 }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Deal Arbitrage section ────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px", maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} style={{ textAlign: "center", marginBottom: 64 }}>
          <motion.div variants={fadeUp} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9999, padding: "6px 16px" }}>
            <DollarSign size={13} color="#d97706" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706", letterSpacing: "0.08em", textTransform: "uppercase" }}>The Golden Angle</span>
          </motion.div>
          <motion.h2 variants={fadeUp} style={{ fontSize: "clamp(28px, 4.5vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1917", margin: "0 0 16px", lineHeight: 1.1 }}>
            The Deal Arbitrage Playbook.
          </motion.h2>
          <motion.p variants={fadeUp} style={{ fontSize: 16, color: "#78716c", maxWidth: 580, margin: "0 auto 48px", lineHeight: 1.7 }}>
            Acquire UK businesses with zero personal capital. Structure acquisitions using bank debt, vendor finance, and raised equity — then keep the difference.
          </motion.p>

          {/* OPM callout box */}
          <motion.div variants={fadeUp}>
            <div className="opm-callout" style={{ display: "inline-flex", flexWrap: "wrap", gap: 20, justifyContent: "center", background: "#fff", border: "1px solid #d6d3d1", borderRadius: 20, padding: "24px 36px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 48 }}>
              {[
                { label: "Bank Debt", pct: "60%", amt: "£360k", color: "#1c1917" },
                { label: "Vendor Finance", pct: "20%", amt: "£120k", color: "#292524" },
                { label: "Investor Equity", pct: "20%", amt: "£120k", color: "#059669" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", minWidth: 120 }}>
                  <p style={{ fontSize: 10, color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 4px", fontWeight: 600 }}>{s.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: "0 0 2px", letterSpacing: "-0.03em" }}>{s.pct}</p>
                  <p style={{ fontSize: 12, color: "#a8a29e", margin: 0 }}>of {s.amt}</p>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", padding: "0 8px", color: "#a8a29e" }}>
                <span style={{ fontSize: 24, fontWeight: 300 }}>=</span>
              </div>
              <div style={{ textAlign: "center", minWidth: 140 }}>
                <p style={{ fontSize: 10, color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 4px", fontWeight: 600 }}>Your Capital In</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#dc2626", margin: "0 0 2px", letterSpacing: "-0.03em" }}>£0</p>
                <p style={{ fontSize: 12, color: "#a8a29e", margin: 0 }}>personal cash required</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* 5-step grid */}
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {[
            { n: 1, icon: <Target size={16} />, title: "Source the Target", body: "Find a UK retirement-sale business with stable SDE (e.g., engineering firm at £200k SDE, asking £600k from a retiring founder).", accent: "#1c1917" },
            { n: 2, icon: <BarChart3 size={16} />, title: "Audit the Deal", body: "Drop the numbers into Acquisition Exchange. Structure 60% bank / 20% vendor / 20% investor equity. Verify DSCR ≥ 1.35× and IRR ≥ 30%.", accent: "#292524" },
            { n: 3, icon: <FileText size={16} />, title: "Export Credit Memo", body: "Download the 3-page institutional-grade Deal Credit Memo PDF. This is your proof of concept — lender and investor ready on Day 1.", accent: "#059669" },
            { n: 4, icon: <Users size={16} />, title: "Pitch Passive Investors", body: "Approach HNWs: 'I have a pre-underwritten UK deal with an institutional credit memo. I need £120k equity — the business pays it off.' Close in days.", accent: "#d97706" },
            { n: 5, icon: <Wallet size={16} />, title: "Pocket the Arbitrage", body: "Take a 2–4% deal sourcing fee (£12k–£24k cash on Day 1). Retain 15–30% sweat equity as deal architect. Zero personal capital deployed.", accent: "#dc2626" },
          ].map(s => (
            <motion.div key={s.n} variants={fadeUp}><ArbitrageStep {...s} /></motion.div>
          ))}
        </motion.div>

        {/* Outcome strip */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="outcome-strip"
          style={{ marginTop: 24, background: "linear-gradient(135deg,#1c1917,#1e293b)", borderRadius: 20, padding: "32px 36px", display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#a8a29e", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>The Numbers on a £600k Deal</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
              {[
                { label: "Day 1 sourcing fee", val: "£12–24k", color: "#fbbf24" },
                { label: "Sweat equity retained", val: "15–30%", color: "#818cf8" },
                { label: "Personal capital", val: "£0", color: "#4ade80" },
                { label: "Projected 5yr IRR", val: "35–45%", color: "#c084fc" },
              ].map(m => (
                <div key={m.label}>
                  <p style={{ fontSize: 10, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>{m.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: m.color, margin: 0, letterSpacing: "-0.03em" }}>{m.val}</p>
                </div>
              ))}
            </div>
          </div>
          <Link href="/deal-sourcing-guide" style={{ textDecoration: "none" }}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{ padding: "13px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", background: "rgba(255,255,255,0.07)", color: "#f4f4f5", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <BookOpen size={15} /> Read the Full Deal Guide
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ── Data sources ticker ──────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Ticker />
      </div>

      {/* ── Features bento ───────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "80px 24px 120px", maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} style={{ textAlign: "center", marginBottom: 64 }}>
          <motion.p variants={fadeUp} style={{ fontSize: 12, fontWeight: 600, color: "#1c1917", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Platform Features</motion.p>
          <motion.h2 variants={fadeUp} style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1917", margin: "0 0 16px", lineHeight: 1.1 }}>Everything a serious buyer needs.</motion.h2>
          <motion.p variants={fadeUp} style={{ fontSize: 16, color: "#78716c", maxWidth: 520, margin: "0 auto" }}>From raw listing text to a credit memo ready for your lender — in under a minute.</motion.p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
          className="bento-12">
          {[
            { col: "1 / 8", icon: <Zap size={20} color="#1c1917" />, iconBg: "#e7e5e4", title: "AI-Powered Extraction", desc: "Paste any broker listing and our AI strips out the numbers instantly — asking price, SDE, turnover, add-backs, and lease data — with zero manual entry.", badge: "< 1 second" },
            { col: "8 / 13", icon: <TrendingUp size={20} color="#292524" />, iconBg: "#e7e5e4", title: "19 IB-Grade Metrics", desc: "DSCR, 5-year Equity IRR, Levered FCF, CoC ROI, DSCR bands, total acquisition cost — the full suite institutional buyers expect.", badge: "Goldman-standard" },
          ].map(c => (
            <motion.div key={c.title} variants={fadeUp} style={{ gridColumn: c.col }}>
              <SpotlightCard style={{ padding: "36px 32px", height: "100%" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>{c.icon}</div>
                <div style={{ display: "inline-block", marginBottom: 16, background: "#e7e5e4", border: "1px solid #d6d3d1", borderRadius: 9999, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#1c1917", letterSpacing: "0.06em", textTransform: "uppercase" }}>{c.badge}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1c1917", margin: "0 0 12px", letterSpacing: "-0.02em" }}>{c.title}</h3>
                <p style={{ fontSize: 14, color: "#78716c", lineHeight: 1.7, margin: 0 }}>{c.desc}</p>
              </SpotlightCard>
            </motion.div>
          ))}
          {[
            { col: "1 / 5", icon: <FileText size={18} color="#059669" />, iconBg: "#ecfdf5", label: "3-Page Credit Memo", val: "PDF", sub: "Institutional lender-ready output" },
            { col: "5 / 9", icon: <Shield size={18} color="#d97706" />, iconBg: "#fffbeb", label: "Deal Viability Score", val: "STRONG", sub: "Real-time DSCR threshold rating" },
            { col: "9 / 13", icon: <Users size={18} color="#1c1917" />, iconBg: "#e7e5e4", label: "Lender Network", val: "4", sub: "Pre-approved UK commercial lenders" },
          ].map(c => (
            <motion.div key={c.label} variants={fadeUp} style={{ gridColumn: c.col }}>
              <BentoCell icon={c.icon} label={c.label} value={c.val} sub={c.sub} iconBg={c.iconBg} />
            </motion.div>
          ))}
          <motion.div variants={fadeUp} style={{ gridColumn: "1 / 13" }}>
            <SpotlightCard style={{ padding: "36px 40px" }}>
              <div className="grid-2col" style={{ gap: 48, alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <Layers size={18} color="#1c1917" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", letterSpacing: "0.1em", textTransform: "uppercase" }}>Document Upload</span>
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1c1917", margin: "0 0 12px" }}>PDF & CIM parsing built in.</h3>
                  <p style={{ fontSize: 14, color: "#78716c", lineHeight: 1.75, margin: "0 0 24px" }}>Upload PDFs, DOCX, or PPTX files directly. The platform populates your triage workspace from raw CIM documents automatically.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["PDF Confidential Information Memorandums","Word document broker packs","PowerPoint investor presentations"].map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}><CheckCircle size={13} color="#059669" /><span style={{ fontSize: 13, color: "#78716c" }}>{f}</span></div>
                    ))}
                  </div>
                </div>
                <div style={{ background: "#faf9f7", borderRadius: 14, padding: "20px 24px", border: "1px solid #d6d3d1", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[{ tag: "SCANNING", text: "Reading document structure…", color: "#a8a29e" }, { tag: "EXTRACTED", text: "Turnover: £820,000  |  Net Profit: £120,000", color: "#1c1917" }, { tag: "VERIFIED", text: "DSCR: 2.90×  ✓  Passes 1.25× threshold", color: "#059669" }, { tag: "SUCCESS", text: "Triage workspace populated in 0.4s.", color: "#059669" }].map((l, i) => (
                    <motion.div key={l.tag} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }} style={{ display: "flex", gap: 10 }}>
                      <span style={{ fontSize: 10, color: "#1c1917", fontWeight: 700, fontFamily: "monospace", minWidth: 72 }}>{l.tag}</span>
                      <span style={{ fontSize: 12, color: l.color, fontFamily: "monospace" }}>{l.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        </motion.div>

        {/* Calculator links */}
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginTop: 24 }}>
          <motion.div variants={fadeUp} style={{ background: "#fff", border: "1px solid #d6d3d1", borderRadius: 20, padding: "28px 32px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 16 }}>Free M&A Calculators</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {CALC_LINKS.map(l => (
                <Link key={l.href} href={l.href} style={{ padding: "9px 18px", borderRadius: 9999, background: "#faf9f7", border: "1px solid #d6d3d1", color: "#1c1917", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>{l.label}</Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Monetisation proof points ─────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px", maxWidth: 1100, margin: "0 auto" }}>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} style={{ textAlign: "center", marginBottom: 56 }}>
          <motion.div variants={fadeUp} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 9999, padding: "6px 16px" }}>
            <LineChart size={13} color="#059669" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#059669", letterSpacing: "0.08em", textTransform: "uppercase" }}>How We Generate Revenue</span>
          </motion.div>
          <motion.h2 variants={fadeUp} style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1917", margin: "0 0 16px" }}>Free at the top. High-value at the bottom.</motion.h2>
          <motion.p variants={fadeUp} style={{ fontSize: 16, color: "#78716c", maxWidth: 540, margin: "0 auto" }}>No paywalls. Unlimited top-of-funnel volume. Revenue generated only when we create real value for the user.</motion.p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {[
            { icon: <Briefcase size={20} color="#1c1917" />, iconBg: "#e7e5e4", title: "Lender Referral Commission", body: "When a buyer's deal closes with one of our lending partners, we receive a 1% referral fee on the originated loan. A typical UK acquisition loan of £200k–£500k generates £2,000–£5,000 per transaction from a user who used our free tool for 15 minutes.", tag: "1% per loan originated" },
            { icon: <Users size={20} color="#059669" />, iconBg: "#ecfdf5", title: "Buy-Side Buyer Database", body: "Every business seller who uses our tool opts into our proprietary buyer network — a live database of active UK searchers and ETA buyers. Brokers and M&A advisors pay a premium subscription to access this curated deal-flow pipeline.", tag: "Proprietary data asset" },
            { icon: <Activity size={20} color="#d97706" />, iconBg: "#fffbeb", title: "The Transaction Data Moat", body: "Every free triage logs target sectors, price ranges, and financial margins. We are building the largest proprietary database of active UK micro-cap M&A activity — a data asset with significant independent value.", tag: "Largest UK micro-cap dataset" },
          ].map(m => (
            <motion.div key={m.title} variants={fadeUp}>
              <SpotlightCard style={{ padding: "32px 28px", height: "100%" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: m.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>{m.icon}</div>
                <div style={{ display: "inline-block", marginBottom: 14, fontSize: 10, fontWeight: 700, color: "#78716c", letterSpacing: "0.09em", textTransform: "uppercase", background: "#faf9f7", border: "1px solid #d6d3d1", padding: "3px 10px", borderRadius: 9999 }}>{m.tag}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1c1917", margin: "0 0 12px", letterSpacing: "-0.02em" }}>{m.title}</h3>
                <p style={{ fontSize: 14, color: "#78716c", lineHeight: 1.7, margin: 0 }}>{m.body}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px", maxWidth: 1100, margin: "0 auto" }}>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} style={{ textAlign: "center", marginBottom: 56 }}>
          <motion.p variants={fadeUp} style={{ fontSize: 12, fontWeight: 600, color: "#1c1917", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Testimonials</motion.p>
          <motion.h2 variants={fadeUp} style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1917", margin: 0 }}>Trusted by acquisition professionals.</motion.h2>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {TESTIMONIALS.map(t => (
            <motion.div key={t.name} variants={fadeUp}>
              <SpotlightCard style={{ padding: "28px 24px", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>{Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={13} color="#f59e0b" fill="#f59e0b" />)}</div>
                <p style={{ fontSize: 14, color: "#78716c", lineHeight: 1.75, margin: "0 0 20px", flex: 1 }}>"{t.quote}"</p>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", margin: "0 0 2px" }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: "#a8a29e", margin: 0 }}>{t.role}</p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Dual CTA ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 120px", maxWidth: 1100, margin: "0 auto" }}>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          className="grid-2col" style={{ gap: 16 }}>
          {/* Buyer CTA */}
          <motion.div variants={fadeUp}>
            <div style={{ background: "linear-gradient(135deg,#166534,#14532d)", borderRadius: 24, padding: "52px 40px", position: "relative", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>For Buyers</p>
              <h3 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "#fff", margin: "0 0 14px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>Audit a deal in under 30 seconds.</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: "0 0 32px", flex: 1 }}>No spreadsheets. No manual modelling. Paste a listing, adjust sliders, get bank-grade metrics and a credit memo instantly.</p>
              <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ padding: "13px 24px", borderRadius: 12, border: "none", cursor: "pointer", background: "#fff", color: "#1c1917", fontSize: 14, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  Audit a Deal — Free <ArrowRight size={15} />
                </motion.button>
              </Link>
            </div>
          </motion.div>
          {/* Seller CTA */}
          <motion.div variants={fadeUp}>
            <div style={{ background: "linear-gradient(135deg,#059669,#10b981)", borderRadius: 24, padding: "52px 40px", position: "relative", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", bottom: -60, left: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>For Sellers</p>
              <h3 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, color: "#fff", margin: "0 0 14px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>See your business through a buyer's eyes.</h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: "0 0 32px", flex: 1 }}>Input your financials and receive an institutional Bankability Score — plus a buyer-ready prospectus and access to our pre-vetted acquirer network.</p>
              <Link href="/sell" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ padding: "13px 24px", borderRadius: 12, border: "none", cursor: "pointer", background: "#fff", color: "#059669", fontSize: 14, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  Value My Business <ArrowRight size={15} />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "0 24px 120px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} style={{ textAlign: "center", marginBottom: 56 }}>
          <motion.p variants={fadeUp} style={{ fontSize: 12, fontWeight: 600, color: "#1c1917", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Pricing</motion.p>
          <motion.h2 variants={fadeUp} style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1917", margin: "0 0 12px" }}>Aligned with every stage of the deal journey.</motion.h2>
          <motion.p variants={fadeUp} style={{ fontSize: 15, color: "#78716c", maxWidth: 540, margin: "0 auto" }}>Start free. Upgrade when you need more firepower — and get every subscription fee back when you close.</motion.p>
        </motion.div>

        {/* Debt Offset Guarantee banner */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{
          background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)",
          borderRadius: 16, padding: "20px 28px",
          display: "flex", alignItems: "center", gap: 18,
          marginBottom: 28, flexWrap: "wrap",
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔄</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#c4b5fd", margin: "0 0 3px", letterSpacing: "0.04em" }}>THE DEBT OFFSET GUARANTEE — UP TO £588 CASHBACK</p>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
              Raise your acquisition debt through our licensed partner network and we'll <strong style={{ color: "#a5b4fc" }}>refund 100% of your subscription fees</strong> paid over the last 12 months — direct to your account upon loan completion.
            </p>
          </div>
          <Link href="/dashboard/triage" style={{ textDecoration: "none", flexShrink: 0 }}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#166534,#14532d)", color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
              Start Free →
            </motion.button>
          </Link>
        </motion.div>

        {/* Founding Member urgency */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 12, padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 12,
          marginBottom: 28, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 16 }}>🎉</span>
          <p style={{ margin: 0, fontSize: 13, color: "#92400e", flex: 1 }}>
            <strong>Founding Member pricing</strong> — Active Searcher locked at <strong>£49/mo forever.</strong>{" "}
            Price rises to <strong>£79/mo on 1 August 2026.</strong> Lock it in now.
          </p>
          <Link href="/signup?plan=searcher" style={{ textDecoration: "none", flexShrink: 0 }}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "#d97706", color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
              Claim £49/mo →
            </motion.button>
          </Link>
        </motion.div>

        <PricingCards />
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: "80px 24px 120px", maxWidth: 720, margin: "0 auto" }}>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} style={{ textAlign: "center", marginBottom: 56 }}>
          <motion.p variants={fadeUp} style={{ fontSize: 12, fontWeight: 600, color: "#1c1917", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>FAQ</motion.p>
          <motion.h2 variants={fadeUp} style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1917", margin: 0 }}>Common questions.</motion.h2>
        </motion.div>
        <div style={{ border: "1px solid #d6d3d1", borderRadius: 20, padding: "0 28px", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {FAQS.map(f => <FAQ key={f.q} {...f} />)}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #d6d3d1", padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#166534,#14532d)" }}><BarChart3 size={13} color="#fff" /></div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1c1917" }}>Acquisition Exchange</span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {[{ href: "/dashboard/triage", label: "Audit a Deal" }, { href: "/sell", label: "Value My Business" }, { href: "/deal-sourcing-guide", label: "Deal Sourcing Guide" }, { href: "/calculators/dscr-calculator", label: "DSCR Calculator" }, { href: "#pricing", label: "Pricing" }].map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: 13, color: "#78716c", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#1c1917")} onMouseLeave={e => (e.currentTarget.style.color = "#78716c")}>{l.label}</Link>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#a8a29e", maxWidth: 520, textAlign: "center", lineHeight: 1.65 }}>
          Acquisition Exchange is a deal screening utility for educational and analytical purposes. Not authorised by the FCA. Not financial advice. Always engage a qualified accountant and solicitor before proceeding with any acquisition.
        </p>
        <p style={{ fontSize: 11, color: "#d6d3d1", margin: 0 }}>© {new Date().getFullYear()} Acquisition Exchange Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}

function PricingCards() {
  const { data: session, status } = useSession();
  const tier = status === "authenticated"
    ? ((session as unknown as Record<string, unknown>)?.tier as string | undefined) ?? "explorer"
    : null;

  return (
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, alignItems: "start" }}>
          <motion.div variants={fadeUp}><PricingCard
            name="Explorer"
            price="£0"
            desc="Structure deals and run credit checks for free — no card required."
            features={[
              "Dynamic deal structuring with live sliders (equity, debt, vendor finance)",
              "DSCR, levered FCF & equity IRR calculated instantly",
              "Proprietary credit score linked to live UK databases",
              "Companies House registry lookup on any UK business",
              "1 institutional Credit Memo export per month",
            ]}
            cta="Start Free"
            href="/signup"
            isCurrent={tier === "explorer"}
          /></motion.div>
          <motion.div variants={fadeUp}><PricingCard
            name="Active Searcher"
            price="£49/mo"
            desc="Unlimited deal analysis with AI parsing and full enrichment."
            features={[
              "Unlimited simultaneous deal workspaces",
              "AI extraction — paste a listing or upload a PDF, numbers populate instantly",
              "Full credit score breakdown with per-factor risk flags",
              "FCA register, VAT, PSC & director enrichment from live sources",
              "Sector valuation multiples with EV/SDE estimate",
              "Unlimited Credit Memo PDF exports — lender and investor ready",
              "Annual Subscription Rebate on Closing (up to £588 cashback)",
            ]}
            cta="Upgrade — £49/mo"
            highlight
            href="/signup?plan=searcher"
            isCurrent={tier === "searcher"}
          /></motion.div>
          <motion.div variants={fadeUp}><PricingCard
            name="Deal Broker"
            price="£149/mo"
            desc="Present deals under your own brand and route directly to lenders."
            features={[
              "Everything in Active Searcher",
              "White-labelled Credit Memo PDF — your logo, your brand",
              "Shared investor pipeline dashboards for co-investors",
              "Priority routing to our pre-approved UK lender network",
              "Remove all Acquisition Exchange branding from client-facing outputs",
              "Annual Rebate on Closing (up to £1,788)",
            ]}
            cta="Upgrade — £149/mo"
            href="/signup?plan=broker"
            isCurrent={tier === "broker"}
          /></motion.div>
          <motion.div variants={fadeUp}><PricingCard
            name="Institutional"
            price="Custom"
            desc="For search funds, family offices and multi-seat teams."
            features={[
              "Everything in Deal Broker",
              "Bulk regional multiples index via API",
              "Institutional-grade spreadsheet underwriting exports",
              "Dedicated account manager and onboarding",
              "Multi-seat team access with role permissions",
              "Custom SLA and uptime guarantee",
            ]}
            cta="Contact Us"
            href="mailto:hello@acquisition.exchange"
            isCurrent={tier === "institutional"}
          /></motion.div>
        </motion.div>
  );
}

