"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, ArrowRight, Target, Layers, Wallet, Briefcase,
  BookOpen, LineChart, Shield, DollarSign,
} from "lucide-react";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const CALC_LINKS = [
  { href: "/calculators/dscr-calculator",              label: "DSCR Calculator",     sub: "Debt service coverage ratio" },
  { href: "/calculators/sme-debt-capacity",            label: "SME Debt Capacity",    sub: "Max supportable loan amount" },
  { href: "/calculators/sde-to-ebitda",                label: "SDE → EBITDA Bridge",  sub: "Owner-operator vs hired GM" },
  { href: "/calculators/stamp-duty",                   label: "Stamp Duty",           sub: "SDLT & SDRT on acquisitions" },
  { href: "/calculators/compound-interest-calculator", label: "Compound Return",      sub: "Equity ROI over hold period" },
];

function CalcDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <motion.button
        whileHover={{ scale: 1.04 }}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
        aria-haspopup="true"
        aria-expanded={open}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 13px", borderRadius: 9999, fontSize: 13, color: open ? "#0f172a" : "#64748b", fontWeight: 500, cursor: "pointer", background: "none", border: "none" }}
      >
        Calculators
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18, ease: EXPO }}
            style={{ position: "absolute", top: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid #e2e8f0", borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.12)", width: 280, padding: "8px", zIndex: 200 }}
          >
            {CALC_LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ display: "block", textDecoration: "none", padding: "10px 14px", borderRadius: 10, transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 2px" }}>{l.label}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{l.sub}</p>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SiteNav() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      {/* Skip to main content — keyboard accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Floating pill nav */}
      <div style={{ position: "fixed", top: 16, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center", padding: "0 12px", pointerEvents: "none", overflow: "hidden" }}>
        <motion.nav
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease: EXPO }}
          style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid #e2e8f0", borderRadius: 9999, padding: "8px 12px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: "calc(100vw - 24px)", pointerEvents: "all" }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 4px 4px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#1e3a8a,#2563eb)", flexShrink: 0 }}>
              <BarChart3 size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>Triage Finance</span>
          </Link>

          {/* Desktop links */}
          <div className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 6px" }} />
            {[{ label: "Features", href: "/#features" }, { label: "Pricing", href: "/#pricing" }].map(l => (
              <motion.a key={l.label} href={l.href} whileHover={{ scale: 1.04 }} style={{ padding: "6px 13px", borderRadius: 9999, fontSize: 13, color: "#64748b", fontWeight: 500, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")} onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>{l.label}</motion.a>
            ))}
            <CalcDropdown />
            {[{ label: "Valuation Guide", href: "/guide" }, { label: "Deal Guide", href: "/deal-sourcing-guide" }].map(l => (
              <Link key={l.href} href={l.href} style={{ textDecoration: "none" }}>
                <motion.span whileHover={{ scale: 1.04 }} style={{ display: "inline-block", padding: "6px 13px", borderRadius: 9999, fontSize: 13, color: "#64748b", fontWeight: 500, cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")} onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>{l.label}</motion.span>
              </Link>
            ))}
            <motion.a href="/#faq" whileHover={{ scale: 1.04 }} style={{ padding: "6px 13px", borderRadius: 9999, fontSize: 13, color: "#64748b", fontWeight: 500, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")} onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>FAQ</motion.a>
            <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 6px" }} />
            <Link href="/sell" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ padding: "7px 14px", borderRadius: 9999, border: "1px solid #e2e8f0", cursor: "pointer", background: "#f8fafc", color: "#334155", fontSize: 13, fontWeight: 600 }}>Sell a Business</motion.button>
            </Link>
          </div>

          {/* Dashboard CTA — desktop only */}
          <div className="nav-desktop-links" style={{ marginLeft: 4 }}>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                style={{ padding: "7px 16px", borderRadius: 9999, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#1e3a8a,#2563eb)", color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                Dashboard
              </motion.button>
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="nav-mobile-btn"
            onClick={() => setMobileNavOpen(o => !o)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
            style={{ marginLeft: 6, width: 44, height: 44, borderRadius: 10, border: "1px solid #e2e8f0", background: mobileNavOpen ? "#0f172a" : "#f8fafc", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, alignItems: "center", justifyContent: "center", transition: "background 0.2s", flexShrink: 0 }}
          >
            <span style={{ width: 14, height: 1.5, background: mobileNavOpen ? "#fff" : "#334155", borderRadius: 1, transform: mobileNavOpen ? "rotate(45deg) translate(4px, 4px)" : "none", transition: "transform 0.22s, background 0.2s" }} />
            <span style={{ width: 14, height: 1.5, background: mobileNavOpen ? "#fff" : "#334155", borderRadius: 1, opacity: mobileNavOpen ? 0 : 1, transition: "opacity 0.18s, background 0.2s" }} />
            <span style={{ width: 14, height: 1.5, background: mobileNavOpen ? "#fff" : "#334155", borderRadius: 1, transform: mobileNavOpen ? "rotate(-45deg) translate(4px, -4px)" : "none", transition: "transform 0.22s, background 0.2s" }} />
          </button>
        </motion.nav>
      </div>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            id="mobile-nav"
            role="dialog"
            aria-label="Navigation menu"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: EXPO }}
            style={{ position: "fixed", inset: 0, zIndex: 98, background: "#07070f", display: "flex", flexDirection: "column", padding: "100px 32px 48px", overflowY: "auto" }}
          >
            <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 500, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 18 }}>Platform</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 40 }}>
              {[
                { href: "/dashboard/triage", label: "Triage a Deal",   sub: "Analyse any UK business acquisition", icon: <Target size={16} /> },
                { href: "/#features",         label: "Features",        sub: "What the platform does",             icon: <Layers size={16} /> },
                { href: "/#pricing",          label: "Pricing",         sub: "Plans from free to institutional",   icon: <Wallet size={16} /> },
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
                { href: "/#faq",                 label: "FAQ",                 sub: "Common questions answered",         icon: <Shield size={16} /> },
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
                <div style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)", borderRadius: 16, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 0 40px rgba(37,99,235,0.3)" }}>
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
    </>
  );
}
