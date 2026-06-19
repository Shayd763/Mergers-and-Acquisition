"use client";
import React from "react";
import { GlossaryTerm } from "@/app/components/GlossaryTerm";
import type { CreditProfile } from "@/app/components/CreditProfileBadge";

// ─── Types ────────────────────────────────────────────────────────────────── //

interface CompanyDetails {
  company_name: string;
  company_number: string;
  date_of_creation: string | null;
  company_status: string;
  sic_codes: string[];
  has_charges: boolean;
  outstanding_charges: { description?: string | null; status: string }[];
  officers: { name: string; role: string }[];
  total_charges: number;
}

interface ExtractedDeal {
  asking_price: number | null;
  turnover: number | null;
  net_profit: number | null;
  add_backs: number | null;
  lease_years_remaining?: number | null;
  business_type: string | null;
  location: string | null;
  raw_confidence: "low" | "medium" | "high";
}

interface Props {
  companyDetails: CompanyDetails;
  extracted: ExtractedDeal;
  askingPrice: number;
  netProfit: number;
  addBacks: number;
  imRawText?: string;
  creditProfile?: CreditProfile | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────── //

function yearsActive(dateStr: string | null): number {
  if (!dateStr) return 0;
  try {
    return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 365)));
  } catch { return 0; }
}

function fmtGbp(v: number | null | undefined): string {
  if (v == null) return "—";
  if (Math.abs(v) >= 1_000_000) return `£${(v / 1_000_000).toFixed(2)}m`;
  if (Math.abs(v) >= 1_000) return `£${(v / 1_000).toFixed(0)}k`;
  return `£${v.toFixed(0)}`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// Market benchmark ranges — broker-listed UK SME deals (lower than institutional M&A).
// These align directionally with the backend _SECTOR_MULTIPLES but reflect open-market
// broker pricing for owner-managed businesses, which carries a size/quality discount.
function getBenchmarkMultiple(businessType: string | null, sicCodes: string[]): { min: number; max: number; label: string } {
  const t = (businessType ?? "").toLowerCase();
  const sics = sicCodes.join(",");

  if (t.includes("dental") || t.includes("health") || sics.match(/86|87|88/))
    return { min: 3.0, max: 5.5, label: "Healthcare & Dental" };

  if (t.includes("software") || t.includes("saas") || t.includes("tech") || sics.match(/62|63/))
    return { min: 3.5, max: 7.0, label: "SaaS & Technology" };

  if (t.includes("financial") || t.includes("wealth") || t.includes("insur") || sics.match(/64|65|66/))
    return { min: 3.5, max: 7.5, label: "Financial Services" };

  if (t.includes("engineer") || t.includes("manufactur") || sics.match(/25|28|29|30|31|32|33/))
    return { min: 2.5, max: 4.5, label: "Engineering & Manufacturing" };

  if (t.includes("logistic") || t.includes("transport") || sics.match(/49|50|51|52|53/))
    return { min: 2.0, max: 3.5, label: "Logistics & Transport" };

  if (t.includes("retail") || t.includes("ecommerce") || t.includes("e-commerce") || sics.match(/45|46|47/))
    return { min: 1.5, max: 3.0, label: "Retail & E-commerce" };

  if (t.includes("food") || t.includes("hospitality") || t.includes("restaurant") || sics.match(/56/))
    return { min: 1.5, max: 2.8, label: "Food & Hospitality" };

  if (t.includes("professional") || t.includes("consulting") || t.includes("legal") || t.includes("account") || sics.match(/69|70|71|72|73|74/))
    return { min: 2.5, max: 4.5, label: "Professional Services" };

  if (t.includes("recruit") || t.includes("staffing") || sics.match(/78/))
    return { min: 2.0, max: 3.5, label: "Recruitment" };

  if (t.includes("construct") || t.includes("building") || sics.match(/41|42|43/))
    return { min: 1.5, max: 3.5, label: "Construction & Property" };

  return { min: 2.0, max: 4.0, label: "UK SME (General)" };
}

type Signal = { label: string; verdict: "pass" | "warn" | "fail"; detail: string; sub?: string };

// ─── Signal row ───────────────────────────────────────────────────────────── //

function SignalRow({ signal }: { signal: Signal }) {
  const colors = {
    pass: { icon: "✓", bg: "#f0fdf4", border: "#bbf7d0", iconBg: "#22c55e", text: "#14532d", detail: "#166534" },
    warn: { icon: "!", bg: "#fffbeb", border: "#fde68a", iconBg: "#f59e0b", text: "#78350f", detail: "#92400e" },
    fail: { icon: "✕", bg: "#fef2f2", border: "#fecaca", iconBg: "#ef4444", text: "#7f1d1d", detail: "#991b1b" },
  };
  const c = colors[signal.verdict];
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      padding: "11px 14px",
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 9,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", background: c.iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: 11, fontWeight: 800, color: "#fff",
      }}>
        {c.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: c.text }}>{signal.label}</span>
          {signal.sub && (
            <span style={{ fontSize: 10, fontWeight: 700, color: c.iconBg, flexShrink: 0 }}>{signal.sub}</span>
          )}
        </div>
        <p style={{ fontSize: 11.5, color: c.detail, margin: "3px 0 0", lineHeight: 1.55 }}>{signal.detail}</p>
      </div>
    </div>
  );
}

// ─── Comparison row — 4 columns ───────────────────────────────────────────── //

function CompareRow({ label, imVal, chVal, crVal, conflict }: {
  label: string; imVal: string; chVal: string; crVal?: string; conflict?: boolean;
}) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
      gap: 6, padding: "8px 0",
      borderBottom: "1px solid #f1f5f9",
      alignItems: "center",
    }}>
      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11.5, color: "#0f172a", fontWeight: 600, textAlign: "center" }}>{imVal}</span>
      <span style={{
        fontSize: 11.5, fontWeight: 600, textAlign: "center",
        color: conflict ? "#dc2626" : "#0f172a",
      }}>
        {chVal}
        {conflict && <span style={{ marginLeft: 4, fontSize: 10 }}>⚠</span>}
      </span>
      <span style={{ fontSize: 11.5, color: "#6366f1", fontWeight: 600, textAlign: "center" }}>
        {crVal ?? "—"}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────── //

export function AcquisitionInsightsCard({
  companyDetails, extracted, askingPrice, netProfit, addBacks, imRawText = "", creditProfile,
}: Props) {
  const years = yearsActive(companyDetails.date_of_creation);
  const chargeCount = companyDetails.outstanding_charges?.length ?? 0;
  const officerCount = companyDetails.officers?.length ?? 0;
  const sde = netProfit + addBacks;
  const entryMultiple = sde > 0 && askingPrice > 0 ? askingPrice / sde : null;
  const benchmark = getBenchmarkMultiple(extracted.business_type, companyDetails.sic_codes ?? []);
  const turnover = extracted.turnover ?? 0;
  const leaseYears = extracted.lease_years_remaining ?? null;

  const imClaimsDebtFree = /debt.?free|cash.?free|no liabilities|no charges|unencumbered/i.test(imRawText);
  const hasChargeConflict = chargeCount > 0 && imClaimsDebtFree;

  // Credit report valuation (if available)
  const val = creditProfile?.valuation ?? null;
  const crMultipleRange = val
    ? `${val.adjusted_multiple_low.toFixed(1)}–${val.adjusted_multiple_high.toFixed(1)}×`
    : undefined;
  const crEVRange = val?.ev_low && val?.ev_high
    ? `${fmtGbp(val.ev_low)}–${fmtGbp(val.ev_high)}`
    : undefined;

  // ── Build signals ──
  const signals: Signal[] = [];

  // 1. Entry multiple vs benchmark
  if (entryMultiple !== null) {
    if (entryMultiple <= benchmark.max && entryMultiple >= benchmark.min) {
      signals.push({
        label: "Entry Multiple — Within Benchmark",
        verdict: "pass",
        sub: `${entryMultiple.toFixed(2)}× SDE`,
        detail: `${entryMultiple.toFixed(2)}× SDE is within the ${benchmark.min}–${benchmark.max}× broker benchmark range for ${benchmark.label}. Asking price appears market-aligned.`,
      });
    } else if (entryMultiple > benchmark.max) {
      signals.push({
        label: "Entry Multiple — Above Benchmark",
        verdict: "fail",
        sub: `${entryMultiple.toFixed(2)}× SDE`,
        detail: `${entryMultiple.toFixed(2)}× exceeds the ${benchmark.max}× upper bound for ${benchmark.label}. Negotiate the asking price or validate premium drivers (recurring revenue, long-term contracts, proprietary IP).`,
      });
    } else {
      signals.push({
        label: "Entry Multiple — Below Benchmark",
        verdict: "pass",
        sub: `${entryMultiple.toFixed(2)}× SDE`,
        detail: `${entryMultiple.toFixed(2)}× is below the ${benchmark.min}× floor for ${benchmark.label}. This may represent a discount — verify reasons (short lease, key-person, sector distress) before pricing it as a bargain.`,
      });
    }
  }

  // 2. Asking price vs credit report EV range
  if (val?.ev_low && val?.ev_high && askingPrice > 0) {
    if (askingPrice < val.ev_low) {
      signals.push({
        label: "Asking Price Below Credit-Adjusted EV Range",
        verdict: "pass",
        sub: crEVRange ?? "",
        detail: `At ${fmtGbp(askingPrice)}, the asking price falls below the credit model's estimated EV range of ${crEVRange}. This may indicate a motivated seller or unpriced risk — investigate the gap before assuming upside.`,
      });
    } else if (askingPrice > val.ev_high) {
      signals.push({
        label: "Asking Price Above Credit-Adjusted EV Range",
        verdict: "fail",
        sub: crEVRange ?? "",
        detail: `At ${fmtGbp(askingPrice)}, the asking price exceeds the credit model's estimated EV ceiling of ${fmtGbp(val.ev_high)}. Vendor is pricing at a premium to intrinsic value — substantiate with a defensible earnings quality argument or negotiate down.`,
      });
    } else {
      signals.push({
        label: "Asking Price Within Credit-Adjusted EV Range",
        verdict: "pass",
        sub: crEVRange ?? "",
        detail: `${fmtGbp(askingPrice)} falls within the credit-adjusted EV range of ${crEVRange}, based on the ${val.sector_label} sector multiple (${val.adjusted_multiple_low.toFixed(1)}–${val.adjusted_multiple_high.toFixed(1)}×) applied to reported earnings.`,
      });
    }
  }

  // 3. SDE margin quality
  if (sde > 0 && turnover > 0) {
    const sdeMargin = sde / turnover;
    if (sdeMargin < 0.05) {
      signals.push({
        label: "Very Thin SDE Margin — Earnings Quality Risk",
        verdict: "fail",
        sub: `${(sdeMargin * 100).toFixed(1)}% margin`,
        detail: `SDE margin of ${(sdeMargin * 100).toFixed(1)}% on £${(turnover / 1000).toFixed(0)}k turnover is extremely thin. A minor revenue dip or cost increase could eliminate earnings entirely. Stress-test the P&L before committing to debt financing.`,
      });
    } else if (sdeMargin < 0.12) {
      signals.push({
        label: "Low SDE Margin — Stress Test Required",
        verdict: "warn",
        sub: `${(sdeMargin * 100).toFixed(1)}% margin`,
        detail: `SDE margin of ${(sdeMargin * 100).toFixed(1)}% leaves limited buffer for cost inflation or revenue decline. Model a 10–15% revenue reduction scenario to confirm DSCR holds at current deal structure.`,
      });
    } else if (sdeMargin >= 0.25) {
      signals.push({
        label: "Strong SDE Margin — High Earnings Quality",
        verdict: "pass",
        sub: `${(sdeMargin * 100).toFixed(1)}% margin`,
        detail: `${(sdeMargin * 100).toFixed(1)}% SDE margin indicates lean cost structure and resilient earnings. High-margin businesses command premium multiples and are better positioned for debt service under stress.`,
      });
    }
  }

  // 4. Company age vs claimed stability
  if (years < 3) {
    signals.push({
      label: "Short Trading History — Elevated SDE Risk",
      verdict: "fail",
      sub: `${years} yr${years !== 1 ? "s" : ""} old`,
      detail: `Incorporated ${fmtDate(companyDetails.date_of_creation)}. Under 3 years of registered trading history makes SDE claims harder to substantiate and reduces lender appetite significantly.`,
    });
  } else if (years < 5) {
    signals.push({
      label: "Young Company — Verify Earnings Trend",
      verdict: "warn",
      sub: `${years} yrs old`,
      detail: `${years} years of operating history. Request year-on-year P&L to confirm SDE is stable and growing, not a one-year spike driven by non-recurring revenue.`,
    });
  } else if (years >= 10) {
    signals.push({
      label: "Seasoned Business — Strong Institutional Track Record",
      verdict: "pass",
      sub: `${years} yrs active`,
      detail: `${years} years in operation (since ${fmtDate(companyDetails.date_of_creation)}). Extended trading history through multiple economic cycles supports SDE credibility and enhances lender confidence.`,
    });
  } else {
    signals.push({
      label: "Established Trading History",
      verdict: "pass",
      sub: `${years} yrs active`,
      detail: `${years} years incorporated (since ${fmtDate(companyDetails.date_of_creation)}). Sustained trading history supports SDE credibility and commercial lender confidence.`,
    });
  }

  // 5. Charge conflict
  if (hasChargeConflict) {
    signals.push({
      label: "Debt-Free Claim Conflicts with Registered Charges",
      verdict: "fail",
      sub: `${chargeCount} charge${chargeCount > 1 ? "s" : ""}`,
      detail: `The listing uses "debt-free" language but Companies House shows ${chargeCount} outstanding charge(s). Raise as a red-line disclosure issue — charges must be legally discharged at completion or netted from the consideration.`,
    });
  } else if (chargeCount > 0) {
    signals.push({
      label: "Outstanding Charges Require Discharge",
      verdict: "warn",
      sub: `${chargeCount} charge${chargeCount > 1 ? "s" : ""}`,
      detail: `${chargeCount} active registered charge(s) detected. Factor charge redemption into the deal structure and capital stack. Request full redemption figures from each charge holder before exchanging contracts.`,
    });
  } else {
    signals.push({
      label: "No Registered Charges — Clean Title",
      verdict: "pass",
      detail: `No outstanding charges registered at Companies House. Asset title appears unencumbered. Confirm with a solicitor's official search at completion.`,
    });
  }

  // 6. Add-backs vs directors
  if (addBacks > 0) {
    if (officerCount === 0) {
      signals.push({
        label: "Add-backs Claimed — No Directors on Record",
        verdict: "fail",
        sub: fmtGbp(addBacks),
        detail: `${fmtGbp(addBacks)} in owner salary add-backs claimed but no active directors found on the Companies House registry. Cannot verify compensation claims — treat as unsubstantiated until payroll records are produced.`,
      });
    } else if (addBacks > 150_000 && officerCount === 1) {
      signals.push({
        label: "Large Add-backs — Request P60 Verification",
        verdict: "warn",
        sub: fmtGbp(addBacks),
        detail: `${fmtGbp(addBacks)} add-backs attributed to ${companyDetails.officers[0]?.name ?? "the director"}. Request P60, P11D, and payroll records to confirm quantum before relying on normalised SDE figures.`,
      });
    } else {
      signals.push({
        label: "Add-backs Verifiable Against Registry",
        verdict: "pass",
        sub: fmtGbp(addBacks),
        detail: `${fmtGbp(addBacks)} add-backs claimed against ${officerCount} active director(s) confirmed on the Companies House registry. Request payroll records to validate exact amounts prior to lender submission.`,
      });
    }
  }

  // 7. Key-person concentration risk
  if (officerCount === 1 && sde > 100_000) {
    signals.push({
      label: "Key-Person Concentration Risk",
      verdict: "warn",
      sub: "1 director",
      detail: `Only 1 active director registered with SDE of ${fmtGbp(sde)}. This business is highly dependent on a single individual. Factor handover, gardening leave, and transition risk into pricing and earnout structure. Lenders typically require management retention agreements.`,
    });
  }

  // 8. Lease risk
  if (leaseYears !== null) {
    if (leaseYears < 2) {
      signals.push({
        label: "Critical Lease Risk — Term Expiry Imminent",
        verdict: "fail",
        sub: `${leaseYears} yr${leaseYears !== 1 ? "s" : ""} remaining`,
        detail: `Lease has only ${leaseYears} year(s) remaining. This creates a binary exit risk and will severely restrict lender appetite. Lease renewal or relocation must be resolved pre-completion — treat as a deal-breaker unless contractually guaranteed.`,
      });
    } else if (leaseYears < 5) {
      signals.push({
        label: "Short Lease — Renewal Risk",
        verdict: "warn",
        sub: `${leaseYears} yrs remaining`,
        detail: `${leaseYears} years remaining on the lease. Most lenders require lease terms to extend at least 1 year beyond the loan repayment date. Obtain the landlord's written intention to renew before lender submission.`,
      });
    } else {
      signals.push({
        label: "Lease Term Adequate for Financing",
        verdict: "pass",
        sub: `${leaseYears} yrs remaining`,
        detail: `${leaseYears} years remaining on the lease provides adequate runway for standard acquisition finance (typically 5–7 year term). No immediate lease rollover risk.`,
      });
    }
  }

  // 9. Revenue vs company age anomaly
  if (turnover > 5_000_000 && years < 5) {
    signals.push({
      label: "High Turnover for Company Age — Verify Filed Accounts",
      verdict: "warn",
      sub: fmtGbp(turnover),
      detail: `${fmtGbp(turnover)} turnover for a ${years}-year-old company warrants scrutiny. Cross-reference with Companies House filed accounts before relying on listing figures. Look for evidence of predecessor business or trading name transfer.`,
    });
  }

  // 10. Sector cyclicality flags
  const cycSics = companyDetails.sic_codes.join(",");
  const isCyclical =
    /hospitality|tourism|travel|retail/i.test(extracted.business_type ?? "") ||
    cycSics.match(/55|56|47|79/) != null;
  if (isCyclical && sde > 0) {
    signals.push({
      label: "Cyclical Sector — Stress-Test Against Downturn",
      verdict: "warn",
      sub: "Cyclical risk",
      detail: `This business operates in a sector with historically volatile earnings (hospitality, travel, or retail). Lenders will apply conservative assumptions — model a 20–30% revenue reduction scenario to validate the debt service position.`,
    });
  }

  // 11. FCA regulated premium (if enrichment available)
  const fca = creditProfile?.enrichment?.fca;
  if (fca && !!(fca as Record<string, unknown>).verified && !!(fca as Record<string, unknown>).is_authorised) {
    signals.push({
      label: "FCA Authorised — Regulatory Premium",
      verdict: "pass",
      sub: "FCA regulated",
      detail: `Confirmed FCA-authorised status commands a valuation premium vs unregulated peers. Regulatory goodwill is a transferable intangible that supports the upper end of the multiple range. Verify authorisation transfers cleanly under a share or asset sale.`,
    });
  }

  // 12. Director adverse history (OpenCorporates)
  const oc = creditProfile?.enrichment?.opencorp;
  if (oc) {
    const ocData = oc as Record<string, unknown>;
    const flags = ocData.adverse_flags as { director_name: string; associated_company: string; status: string }[] | undefined;
    if (flags && flags.length > 0) {
      signals.push({
        label: "Director Adverse Corporate History Detected",
        verdict: "fail",
        sub: `${flags.length} flag${flags.length > 1 ? "s" : ""}`,
        detail: `${flags.length} director(s) associated with companies in ${flags[0].status.toLowerCase()} or related adverse status. This may impact lender appetite and personal guarantee strength. Commission a director background report before proceeding to credit committee.`,
      });
    }
  }

  // 13. PSC concentration risk
  const psc = creditProfile?.enrichment?.psc;
  if (psc) {
    const pscData = psc as Record<string, unknown>;
    if (pscData.concentration_risk === "High") {
      signals.push({
        label: "High PSC Concentration — Change of Control Risk",
        verdict: "warn",
        sub: "High concentration",
        detail: `A single shareholder holds 50–75%+ control. In a share sale, this creates single-point-of-failure negotiation dynamics. In an asset sale, the controlling person must approve any restrictive covenants. Confirm who controls the deal and map consent requirements.`,
      });
    } else if (pscData.has_offshore_psc) {
      signals.push({
        label: "Offshore PSC — Enhanced Due Diligence Required",
        verdict: "warn",
        sub: "Offshore ownership",
        detail: `One or more persons with significant control are registered offshore. This triggers AML enhanced due diligence, potential HMRC SDLT implications, and may complicate lender approval. Commission a UBO verification report.`,
      });
    }
  }

  // Overall verdict
  const fails = signals.filter(s => s.verdict === "fail").length;
  const warns = signals.filter(s => s.verdict === "warn").length;
  const verdict = fails > 0 ? "red" : warns > 1 ? "amber" : "green";
  const verdictMap = {
    green: { label: "PROCEED WITH CONFIDENCE", color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", icon: "✓" },
    amber: { label: "PROCEED WITH CAUTION", color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: "!" },
    red:   { label: "MATERIAL ISSUES REQUIRE RESOLUTION", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icon: "✕" },
  };
  const v = verdictMap[verdict];

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: "#0f172a",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", marginBottom: 2 }}>
            ACQUISITION INTELLIGENCE · REGISTRY VS IM ANALYSIS
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
            {companyDetails.company_name}
          </div>
        </div>
        <div style={{
          marginLeft: "auto",
          background: v.bg,
          border: `1px solid ${v.border}`,
          color: v.color,
          fontSize: 10,
          fontWeight: 800,
          padding: "5px 12px",
          borderRadius: 6,
          letterSpacing: "0.06em",
          flexShrink: 0,
        }}>
          {v.icon} {v.label}
        </div>
      </div>

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* ── Four-column comparison table ── */}
        <div>
          <div style={{
            display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
            gap: 6, marginBottom: 10, paddingBottom: 8,
            borderBottom: "2px solid #f1f5f9",
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.09em" }}>METRIC</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.09em", textAlign: "center" }}>
              <GlossaryTerm term="IM">IM</GlossaryTerm> / LISTING
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#0891b2", letterSpacing: "0.09em", textAlign: "center" }}>
              <GlossaryTerm term="CompaniesHouse">COMPANIES HOUSE</GlossaryTerm>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.09em", textAlign: "center",
              opacity: creditProfile ? 1 : 0.35 }}>
              CREDIT REPORT
            </span>
          </div>

          <CompareRow
            label="Asking Price"
            imVal={fmtGbp(askingPrice || extracted.asking_price)}
            chVal="—"
            crVal={crEVRange ? `EV ${crEVRange}` : "—"}
          />
          <CompareRow
            label="Net Profit"
            imVal={fmtGbp(netProfit || extracted.net_profit)}
            chVal="See filed accounts"
            crVal="—"
          />
          <CompareRow
            label="Add-backs"
            imVal={fmtGbp(addBacks || extracted.add_backs)}
            chVal={officerCount > 0 ? `${officerCount} director(s) verified` : "No directors on record"}
            conflict={addBacks > 0 && officerCount === 0}
            crVal="—"
          />
          <CompareRow
            label="SDE / Earnings"
            imVal={sde > 0 ? fmtGbp(sde) : "—"}
            chVal={entryMultiple ? `${entryMultiple.toFixed(2)}× entry` : "—"}
            crVal={val?.earnings_used ? `${fmtGbp(val.earnings_used)} (${val.earnings_label})` : "—"}
          />
          <CompareRow
            label="Valuation Multiple"
            imVal={entryMultiple ? `${entryMultiple.toFixed(2)}× asked` : "—"}
            chVal={`${benchmark.min}–${benchmark.max}× (${benchmark.label})`}
            conflict={entryMultiple !== null && entryMultiple > benchmark.max}
            crVal={crMultipleRange ?? (val ? `${val.base_multiple_low.toFixed(1)}–${val.base_multiple_high.toFixed(1)}× base` : "—")}
          />
          <CompareRow
            label="Sector (Credit Report)"
            imVal={extracted.business_type ?? "Not stated"}
            chVal={years > 0 ? `${years} yrs (est. ${fmtDate(companyDetails.date_of_creation)})` : "—"}
            crVal={val?.sector_label ?? "—"}
          />
          <CompareRow
            label="Debt Status"
            imVal={imClaimsDebtFree ? "Claims debt-free" : "Not stated"}
            chVal={chargeCount > 0 ? `${chargeCount} charge(s)` : "No charges"}
            conflict={hasChargeConflict}
            crVal={creditProfile
              ? (chargeCount > 0 ? "Charges penalise mult." : "Clean — no deduction")
              : "—"}
          />
          <CompareRow
            label="Credit Band"
            imVal="—"
            chVal="—"
            crVal={creditProfile
              ? `Band ${creditProfile.credit_band} · ${creditProfile.open_credit_score}/100`
              : "—"}
          />
        </div>

        {/* ── Multiple methodology note ── */}
        <div style={{
          background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
          padding: "10px 14px", fontSize: 11, color: "#64748b", lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700, color: "#334155" }}>Multiple Methodology: </span>
          <strong>IM/Listing</strong> = entry multiple paid at asking price.&nbsp;
          <strong>Companies House</strong> = broker market benchmark range for this sector (SME open-market pricing).&nbsp;
          <strong>Credit Report</strong> = credit-adjusted EV/SDE range using UK M&A transaction data (Experian/BDO) with company-specific risk adjustments.
          {val && (
            <span style={{ marginLeft: 4, color: "#6366f1", fontWeight: 600 }}>
              Net credit adjustment: {val.total_adjustment_pct >= 0 ? "+" : ""}{val.total_adjustment_pct.toFixed(1)}%.
            </span>
          )}
        </div>

        {/* ── Acquisition signals ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.09em", marginBottom: 10 }}>
            ACQUISITION SIGNALS ({signals.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {signals.map((s, i) => <SignalRow key={i} signal={s} />)}
          </div>
        </div>

        {/* ── Verdict footer ── */}
        <div style={{
          background: v.bg,
          border: `1px solid ${v.border}`,
          borderRadius: 9,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: v.color, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, flexShrink: 0,
          }}>
            {v.icon}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: v.color, marginBottom: 2 }}>{v.label}</div>
            <div style={{ fontSize: 11.5, color: v.color, opacity: 0.85, lineHeight: 1.5 }}>
              {verdict === "green" && `${signals.filter(s => s.verdict === "pass").length} checks passed. Registry data is consistent with listing claims. Proceed to full due diligence.`}
              {verdict === "amber" && `${warns} area${warns > 1 ? "s" : ""} require${warns === 1 ? "s" : ""} attention before progressing. Address flagged items in your due diligence checklist.`}
              {verdict === "red" && `${fails} material issue${fails > 1 ? "s" : ""} detected. Resolve registry conflicts before submitting to lenders or proceeding to heads of terms.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
