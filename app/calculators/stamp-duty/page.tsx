"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { SiteNav } from "@/app/components/SiteNav";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FinancialProduct",
  "name": "UK Stamp Duty Business Acquisition Calculator",
  "description": "Calculate Stamp Duty Land Tax (SDLT) and other transfer taxes for UK business acquisitions. Covers share purchases vs asset purchases and mixed-use transactions.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" },
};

function calcSDLT(price: number, isResidential: boolean): number {
  if (!isResidential) {
    // Non-residential SDLT rates (unchanged 2025)
    if (price <= 150000) return 0;
    if (price <= 250000) return (price - 150000) * 0.02;
    return (250000 - 150000) * 0.02 + (price - 250000) * 0.05;
  } else {
    // Residential SDLT rates from April 2025 (nil-rate band reverted to £125k)
    if (price <= 125000) return 0;
    if (price <= 250000) return (price - 125000) * 0.02;
    if (price <= 925000) return (250000 - 125000) * 0.02 + (price - 250000) * 0.05;
    if (price <= 1500000) return (250000 - 125000) * 0.02 + (925000 - 250000) * 0.05 + (price - 925000) * 0.10;
    return (250000 - 125000) * 0.02 + (925000 - 250000) * 0.05 + (1500000 - 925000) * 0.10 + (price - 1500000) * 0.12;
  }
}

export default function StampDutyPage() {
  const [price, setPrice] = useState("");
  const [dealType, setDealType] = useState<"shares" | "assets">("assets");
  const [includesProperty, setIncludesProperty] = useState(true);
  const [propertyValue, setPropertyValue] = useState("");
  const [isResidential, setIsResidential] = useState(false);

  const priceVal         = Number(price)         || 0;
  const propertyValueVal = Number(propertyValue) || 0;

  const sharesDuty  = dealType === "shares" ? priceVal * 0.005 : 0;
  const propertyDuty = dealType === "assets" && includesProperty ? calcSDLT(propertyValueVal, isResidential) : 0;
  const totalDuty   = sharesDuty + propertyDuty;
  const effectiveRate = priceVal > 0 ? (totalDuty / priceVal) * 100 : 0;
  const totalCost   = priceVal + totalDuty;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 10, padding: "11px 14px 11px 28px", fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <div style={{ background: "#f8fafc", minHeight: "100vh", color: "#0f172a", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(148,163,184,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.12) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#f8fafc 80%)", WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 0%,transparent 20%,#f8fafc 80%)" }} />
        <SiteNav />

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 80px", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EXPO }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Free Calculator · 2025 UK Tax Rates</p>
            <h1 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 16px", color: "#0f172a" }}>
              UK Stamp Duty Business Acquisition Calculator
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 620, lineHeight: 1.75, marginBottom: 24 }}>
              Calculate Stamp Duty Land Tax (SDLT) and Stamp Duty Reserve Tax (SDRT) on a UK business acquisition. The tax treatment differs significantly between share deals and asset deals.
            </p>
          </motion.div>

          <div className="grid-2col" style={{ gap: 20, alignItems: "start" }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55, ease: EXPO }}
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em" }}>Deal Parameters</p>

              {/* Deal type toggle */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 8 }}>Deal Structure</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {(["assets", "shares"] as const).map(t => (
                    <button key={t} onClick={() => setDealType(t)}
                      style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${dealType === t ? "#bfdbfe" : "#e2e8f0"}`, background: dealType === t ? "#eff6ff" : "#f8fafc", color: dealType === t ? "#2563eb" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                      {t === "assets" ? "Asset Purchase" : "Share Purchase"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total price */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>Total Purchase Price</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>£</span>
                  <input type="number" value={price} step={10000} min={0} onChange={e => setPrice(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {dealType === "assets" && (
                <>
                  <div style={{ padding: "16px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Includes Property / Lease</label>
                      <button onClick={() => setIncludesProperty(!includesProperty)}
                        style={{ width: 40, height: 22, borderRadius: 11, border: "none", background: includesProperty ? "#2563eb" : "#e2e8f0", cursor: "pointer", position: "relative", transition: "background 0.15s" }}>
                        <span style={{ position: "absolute", top: 2, left: includesProperty ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                      </button>
                    </div>
                    {includesProperty && (
                      <div>
                        <div style={{ position: "relative", marginBottom: 10 }}>
                          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>£</span>
                          <input type="number" value={propertyValue} step={10000} min={0} onChange={e => setPropertyValue(e.target.value)} style={{ ...inputStyle, padding: "10px 14px 10px 28px" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {(["commercial", "residential"] as const).map(t => (
                            <button key={t} onClick={() => setIsResidential(t === "residential")}
                              style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${(!isResidential && t === "commercial") || (isResidential && t === "residential") ? "#bfdbfe" : "#e2e8f0"}`, background: (!isResidential && t === "commercial") || (isResidential && t === "residential") ? "#eff6ff" : "#f8fafc", color: (!isResidential && t === "commercial") || (isResidential && t === "residential") ? "#2563eb" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "14px 16px", borderRadius: 12, background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                    <p style={{ fontSize: 12, color: "#065f46", margin: 0 }}>✓ Asset deals: Goodwill, IP, and plant & machinery attract <strong>zero stamp duty</strong>. Only land/property elements incur SDLT.</p>
                  </div>
                </>
              )}

              {dealType === "shares" && (
                <div style={{ padding: "14px 16px", borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a" }}>
                  <p style={{ fontSize: 12, color: "#92400e", margin: 0 }}>⚠ Share deals incur 0.5% Stamp Duty Reserve Tax (SDRT) on the total consideration, but inherit all liabilities of the target company.</p>
                </div>
              )}
            </motion.div>

            {/* Results */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.55, ease: EXPO }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "linear-gradient(135deg,#eff6ff,#eff6ff)", border: "1px solid #bfdbfe", borderRadius: 16, padding: "28px", textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Total Tax Liability</p>
                <p style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.05em", color: "#0f172a", margin: "0 0 4px", lineHeight: 1 }}>
                  £{totalDuty.toLocaleString()}
                </p>
                <p style={{ fontSize: 13, color: "#64748b" }}>Effective rate: {effectiveRate.toFixed(2)}%</p>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 16 }}>Breakdown</p>
                {[
                  { label: "Purchase Price", val: `£${priceVal.toLocaleString()}`, color: "#334155" },
                  ...(dealType === "shares" ? [{ label: "SDRT (0.5% on shares)", val: `£${sharesDuty.toLocaleString()}`, color: "#d97706" }] : []),
                  ...(dealType === "assets" && includesProperty ? [{ label: `SDLT (${isResidential ? "residential" : "commercial"} property)`, val: `£${propertyDuty.toLocaleString()}`, color: "#d97706" }] : []),
                  { label: "Goodwill / IP", val: "£0 (exempt)", color: "#059669" },
                  { label: "Total Tax Due", val: `£${totalDuty.toLocaleString()}`, color: "#2563eb", bold: true },
                  { label: "All-in Acquisition Cost", val: `£${totalCost.toLocaleString()}`, color: "#0f172a", bold: true },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: (r as { bold?: boolean }).bold ? 700 : 600, color: (r as { color?: string }).color ?? "#334155" }}>{r.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: "14px 16px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", gap: 10 }}>
                <AlertTriangle size={13} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: "#991b1b", margin: 0, lineHeight: 1.65 }}>
                  This calculator provides indicative estimates only. SDLT is complex — always engage a specialist solicitor before completion.
                </p>
              </div>

              <Link href="/dashboard/triage" style={{ textDecoration: "none" }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#2563eb,#1e3a8a)", color: "#fff", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  Run full deal triage <ArrowRight size={15} />
                </motion.button>
              </Link>
            </motion.div>
          </div>

          <div style={{ marginTop: 40, borderTop: "1px solid #e2e8f0", paddingTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["/calculators/dscr-calculator", "/calculators/sme-debt-capacity", "/calculators/sde-to-ebitda", "/calculators/compound-interest-calculator"].map(h => (
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
