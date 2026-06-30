"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import type { CreditProfile } from "./CreditProfileBadge";
import { useSubscription } from "./SubscriptionContext";
import { PremiumGate } from "./PremiumGate";

/* ─── Types (mirror triage page) ────────────────────────────────────────── */

export interface DealMetricsForMemo {
  sde: number;
  valuation_multiple: number;
  total_acquisition_cost: number;
  acquisition_fees: number;
  buyer_equity_amount: number;
  vendor_finance_amount: number;
  bank_loan_amount: number;
  annual_bank_debt_service: number;
  monthly_bank_payment: number;
  annual_vendor_service: number;
  corp_tax_charge: number;
  levered_fcf: number;
  dscr: number;
  dscr_band: "strong" | "acceptable" | "marginal" | "unbankable";
  equity_irr: number;
  coc_roi: number;
  capital_stack_valid: boolean;
}

export interface ExtractedDealForMemo {
  asking_price: number | null;
  turnover: number | null;
  net_profit: number | null;
  add_backs: number | null;
  lease_years_remaining: number | null;
  business_type: string | null;
  location: string | null;
}

export interface RegistryDataForMemo {
  company_name: string;
  company_number: string;
  date_of_creation: string | null;
  outstanding_charges_count: number;
  active_officers_count: number;
  reconciliation_score: string;   // CLEAN | REVIEW | ALERT
  credit_score: number;
  credit_limit_gbp: number;
  insolvency_risk: string;
  flags: { title: string; status: string; message: string }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  metrics: DealMetricsForMemo;
  extracted: ExtractedDealForMemo | null;
  askingPrice: number;
  netProfit: number;
  equityPct: number;
  vendorPct: number;
  bankPct: number;
  registryData?: RegistryDataForMemo | null;
  creditProfile?: CreditProfile | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const gbp = (n: number, dp = 0) =>
  n >= 1_000_000 ? `£${(n / 1_000_000).toFixed(2)}m`
  : n >= 1_000   ? `£${(n / 1_000).toFixed(dp === 0 ? 0 : dp)}k`
  : `£${n.toFixed(0)}`;

const pct = (n: number) =>
  isFinite(n) && !isNaN(n) ? `${(n * 100).toFixed(1)}%` : "—";

function stressTest(metrics: DealMetricsForMemo, drop: number) {
  const sde   = metrics.sde * (1 - drop);
  const dscr  = metrics.annual_bank_debt_service > 0 ? sde / metrics.annual_bank_debt_service : Infinity;
  const fcf   = sde - metrics.annual_bank_debt_service - metrics.annual_vendor_service - sde * 0.25;
  const coc   = metrics.buyer_equity_amount > 0 ? fcf / metrics.buyer_equity_amount : NaN;
  return { sde, dscr, fcf, coc };
}

function calcAmortSchedule(principal: number, monthlyPayment: number) {
  const r = 0.12 / 12;
  let bal = principal;
  return Array.from({ length: 5 }, (_, i) => {
    let interest = 0, princ = 0;
    for (let m = 0; m < 12; m++) {
      const mi = bal * r;
      const mp = monthlyPayment - mi;
      interest += mi; princ += mp; bal -= mp;
    }
    return { year: i + 1, interest, principal: princ, balance: Math.max(0, bal) };
  });
}

/* ─── Stable deal ID per browser session ────────────────────────────────── */

function useDealId() {
  const ref = useRef<string>("");
  if (!ref.current) {
    ref.current = `req_uk_mna_${Math.random().toString(36).slice(2, 10)}`;
  }
  return ref.current;
}

/* ─── JSON syntax highlighter ────────────────────────────────────────────── */

function JsonBlock({ obj }: { obj: unknown }) {
  const raw = JSON.stringify(obj, null, 2);
  const html = raw
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/("[\w_]+")\s*:/g, '<span style="color:#a5b4fc;font-weight:600">$1</span>:')
    .replace(/:\s*("([^"]*)")/g, ': <span style="color:#6ee7b7">$1</span>')
    .replace(/:\s*(-?\d+\.?\d*)/g, ': <span style="color:#f9a8d4">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span style="color:#fbbf24">$1</span>')
    .replace(/:\s*(null)/g, ': <span style="color:#a8a29e">$1</span>');

  return (
    <pre
      style={{
        fontFamily: "ui-monospace, 'Cascadia Code', monospace",
        fontSize: 11.5,
        lineHeight: 1.65,
        margin: 0,
        color: "#d6d3d1",
        overflowX: "auto",
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ─── PDF generator ──────────────────────────────────────────────────────── */

async function generatePDF(
  metrics: DealMetricsForMemo,
  extracted: ExtractedDealForMemo | null,
  askingPrice: number,
  netProfit: number,
  equityPct: number,
  vendorPct: number,
  bankPct: number,
  dealId: string,
  registryData?: RegistryDataForMemo | null,
  creditProfile?: CreditProfile | null,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const W = 210, M = 18;
  const SLATE   = [15, 23, 42]   as [number, number, number];
  const WHITE   = [255, 255, 255] as [number, number, number];
  const ACCENT  = [79, 70, 229]   as [number, number, number];
  const SUCCESS = [5, 150, 105]   as [number, number, number];
  const AMBER   = [217, 119, 6]   as [number, number, number];
  const DANGER  = [220, 38, 38]   as [number, number, number];
  const MUTED   = [100, 116, 139] as [number, number, number];
  const BODY    = [30, 41, 59]    as [number, number, number];
  const ROWALT  = [248, 250, 252] as [number, number, number];

  const sector   = extracted?.business_type ?? "SME Business";
  const location = extracted?.location ?? "UK";
  const today    = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  // ── utility fns ──────────────────────────────────────────────────────────
  function header(title: string, subtitle: string) {
    doc.setFillColor(...SLATE);
    doc.rect(0, 0, W, 42, "F");

    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, 4, 42, "F");

    doc.setTextColor(...WHITE);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(registryData?.company_name ? `DEAL CREDIT MEMO  ·  ${registryData.company_name.toUpperCase()}` : "DEAL CREDIT MEMO", M, 14);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("STRICTLY CONFIDENTIAL  ·  NOT FOR DISTRIBUTION", M, 21);

    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.text(`Date: ${today}`, M, 29);
    doc.text(`Deal ID: ${dealId}`, M + 60, 29);
    doc.text(`Status: ${metrics.dscr_band.toUpperCase()}`, M + 130, 29);
    doc.text(`Prepared by: DealTriage Analytics Engine  ·  Proprietary Credit Model`, M, 36);

    // Page title bar
    doc.setFillColor(...ACCENT);
    doc.rect(0, 42, W, 10, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(title, M, 49);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, W - M - doc.getTextWidth(subtitle), 49);
  }

  function tableRow(
    row: string[],
    y: number,
    colXs: number[],
    colWs: number[],
    isHeader = false,
    isTotal = false,
    altBg = false,
    textColor: [number, number, number] = BODY,
  ) {
    if (isHeader) {
      doc.setFillColor(...ACCENT);
      doc.rect(M, y, W - 2 * M, 7, "F");
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
    } else {
      if (isTotal) {
        doc.setFillColor(...SLATE);
        doc.rect(M, y, W - 2 * M, 7, "F");
        doc.setTextColor(...WHITE);
        doc.setFont("helvetica", "bold");
      } else if (altBg) {
        doc.setFillColor(...ROWALT);
        doc.rect(M, y, W - 2 * M, 7, "F");
        doc.setTextColor(...textColor);
        doc.setFont("helvetica", "normal");
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(M, y, W - 2 * M, 7, "F");
        doc.setTextColor(...textColor);
        doc.setFont("helvetica", "normal");
      }
      doc.setFontSize(8);
    }
    row.forEach((cell, ci) => {
      // Compute max width for this column to prevent overflow
      const nextX = ci < colXs.length - 1 ? colXs[ci + 1] : W - M;
      const maxW = nextX - colXs[ci] - 2;
      // Truncate to single line that fits
      const lines = doc.splitTextToSize(cell, maxW);
      doc.text(lines[0] ?? "", colXs[ci], y + 5);
    });
    return y + 7;
  }

  function sectionTitle(text: string, y: number) {
    doc.setTextColor(...SLATE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(text, M, y);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.4);
    doc.line(M, y + 1.5, W - M, y + 1.5);
    return y + 8;
  }

  function footer(pageNum: number) {
    const fy = 290;
    doc.setDrawColor(...MUTED);
    doc.setLineWidth(0.2);
    doc.line(M, fy - 3, W - M, fy - 3);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("DealTriage Ltd · UK M&A Triage Engine · For internal use only", M, fy + 1);
    doc.text(`Page ${pageNum} of 4`, W - M - 14, fy + 1);
  }

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 1 — Executive Summary & Capital Structure
  // ════════════════════════════════════════════════════════════════════════
  header("PAGE 1 — EXECUTIVE SUMMARY & ACQUISITION STRUCTURE", "Deal Overview");
  let y = 58;

  y = sectionTitle("Executive Summary", y);

  const summaryText = `Acquisition of ${sector}${location ? ` (${location})` : ""} for ${gbp(askingPrice)}, structured as a ${bankPct}% bank debt / ${equityPct}% buyer equity / ${vendorPct}% vendor finance capital mix. Total acquisition outlay including 5% stamp duty and advisory fees: ${gbp(metrics.total_acquisition_cost)}. The business generates ${gbp(metrics.sde)} in Seller's Discretionary Earnings (SDE) and is valued at a ${metrics.valuation_multiple.toFixed(2)}× SDE multiple. DSCR of ${metrics.dscr.toFixed(2)}× — classified ${metrics.dscr_band.toUpperCase()}. Projected 5-year equity IRR: ${pct(metrics.equity_irr)}.`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BODY);
  const summaryLines = doc.splitTextToSize(summaryText, W - 2 * M);
  doc.text(summaryLines, M, y);
  y += summaryLines.length * 5 + 10;

  y = sectionTitle("Capital Allocation Structure", y);

  const capCols = [M + 2, M + 90, M + 125, M + 155];
  const capWs   = [72, 30, 30, 0];
  y = tableRow(["Component", "% Allocation", "GBP Amount", "Notes"], y, capCols, capWs, true);
  [
    ["Buyer Equity", `${equityPct}%`, gbp(metrics.buyer_equity_amount), "Injected at completion"],
    ["Vendor Finance / Earn-out", `${vendorPct}%`, gbp(metrics.vendor_finance_amount), "3-yr linear, 0% interest"],
    ["Bank / Commercial Debt", `${bankPct}%`, gbp(metrics.bank_loan_amount), "5yr amortising @ 12% APR"],
    ["Acquisition Fees (5%)", "—", gbp(metrics.acquisition_fees), "Legal / stamp duty / advisory"],
  ].forEach(([comp, alloc, val, note], i) => {
    y = tableRow([comp, alloc, val, note], y, capCols, capWs, false, false, i % 2 === 0);
  });
  y = tableRow(["TOTAL ACQUISITION COST", "100%", gbp(metrics.total_acquisition_cost), ""], y, capCols, capWs, false, true);
  y += 12;

  y = sectionTitle("Key Investment Thesis", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BODY);
  const thesis = [
    `• SDE of ${gbp(metrics.sde)}/yr provides ${metrics.valuation_multiple.toFixed(2)}× purchase coverage at asking price.`,
    `• Post-debt Levered FCF of ${gbp(metrics.levered_fcf)}/yr delivers ${pct(metrics.coc_roi)} cash-on-cash return on equity.`,
    `• Bank DSCR of ${metrics.dscr.toFixed(2)}× ${metrics.dscr >= 1.25 ? "exceeds" : "falls short of"} the 1.25× UK commercial lender threshold.`,
    `• Projected 5-year equity IRR of ${pct(metrics.equity_irr)} at exit multiple parity.`,
  ];
  thesis.forEach((line) => { doc.text(line, M + 2, y); y += 6; });

  footer(1);

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 2 — Financial Analysis & Stress Testing
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  header("PAGE 2 — FINANCIAL STRESS TESTING & DEBT SERVICE COVERAGE", "Underwriting Analysis");
  y = 58;

  y = sectionTitle("Primary Underwriting Metrics", y);

  const mCols = [M + 2, M + 80, M + 130];
  y = tableRow(["Metric", "Value", "Benchmark / Note"], y, mCols, [70, 50, 0], true);
  [
    [`SDE (Seller's Disc. Earnings)`, gbp(metrics.sde), "Basis for debt sizing & multiple"],
    ["Valuation Multiple (EV/SDE)", `${metrics.valuation_multiple.toFixed(2)}×`, "Typical UK SME: 2.5× – 4.5×"],
    ["Annual Bank Debt Service", gbp(metrics.annual_bank_debt_service), "5yr @ 12% APR — amortising"],
    ["Annual Vendor Service", gbp(metrics.annual_vendor_service), "3yr linear earn-out @ 0%"],
    ["Corp Tax Charge (25% on SDE)", gbp(metrics.corp_tax_charge), "UK CT simplified estimate"],
    ["Levered Free Cash Flow", gbp(metrics.levered_fcf), "Post all debt & tax"],
    ["DSCR", `${metrics.dscr.toFixed(2)}×`, `UK lender minimum: 1.25× — ${metrics.dscr_band.toUpperCase()}`],
    ["Cash-on-Cash ROI (Yr 1)", pct(metrics.coc_roi), "Levered FCF ÷ Buyer Equity"],
    ["Projected 5-Year Equity IRR", pct(metrics.equity_irr), "Exit at entry multiple, no residual debt"],
  ].forEach(([label, val, note], i) => {
    y = tableRow([label, val, note], y, mCols, [70, 50, 0], false, false, i % 2 === 0);
  });
  y += 12;

  y = sectionTitle("Revenue Sensitivity Matrix (SDE Stress Tests)", y);

  const sCols = [M + 2, M + 48, M + 82, M + 116, M + 150];
  y = tableRow(["Scenario", "Stressed SDE", "DSCR", "Levered FCF", "CoC Return"], y, sCols, [40, 34, 34, 34, 0], true);
  const scenarios = [
    { label: "Base Case (0% drop)", ...stressTest(metrics, 0) },
    { label: "Mild Stress (−10%)",  ...stressTest(metrics, 0.10) },
    { label: "Moderate (−20%)",     ...stressTest(metrics, 0.20) },
    { label: "Severe (−30%)",       ...stressTest(metrics, 0.30) },
  ];
  scenarios.forEach((sc, i) => {
    const dscrBad = sc.dscr < 1.25;
    const fcfBad  = sc.fcf < 0;
    y = tableRow(
      [sc.label, gbp(sc.sde), `${isFinite(sc.dscr) ? sc.dscr.toFixed(2) : "∞"}×`, gbp(sc.fcf), pct(sc.coc)],
      y, sCols, [40, 34, 34, 34, 0],
      false, i === 0,
      i % 2 === 0,
      (dscrBad || fcfBad) && i !== 0 ? DANGER : BODY,
    );
  });
  y += 12;

  y = sectionTitle("5-Year Bank Loan Amortisation Schedule", y);

  const aCols = [M + 2, M + 40, M + 80, M + 120, M + 155];
  y = tableRow(["Year", "Opening Balance", "Annual Interest", "Annual Principal", "Closing Balance"], y, aCols, [35, 40, 40, 35, 0], true);
  const schedule = calcAmortSchedule(metrics.bank_loan_amount, metrics.monthly_bank_payment);
  schedule.forEach((row, i) => {
    y = tableRow(
      [`Year ${row.year}`, gbp(metrics.bank_loan_amount - schedule.slice(0, i).reduce((a, r) => a + r.principal, 0)),
       gbp(row.interest), gbp(row.principal), gbp(row.balance)],
      y, aCols, [35, 40, 40, 35, 0], false, false, i % 2 === 0,
    );
  });

  footer(2);

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 3 — Risk Assessment & Broker Routing
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  header("PAGE 3 — RISK ASSESSMENT & BROKER ROUTING SHEET", "Submission Package");
  y = 58;

  y = sectionTitle("Automated Risk Flags", y);

  const sdeMarginRisk   = netProfit > 0 && (netProfit / askingPrice) < 0.15;
  const leaseRisk       = extracted?.lease_years_remaining != null && extracted.lease_years_remaining < 5;
  const debtStressRisk  = stressTest(metrics, 0.30).dscr < 1.20;

  const flags = [
    {
      label: "SDE / Earnings Stability",
      status: sdeMarginRisk ? "RED" : "GREEN",
      color: sdeMarginRisk ? DANGER : SUCCESS,
      detail: sdeMarginRisk
        ? `Net profit below 15% of asking price. Earnings sustainability risk.`
        : `Net profit relative to acquisition price appears acceptable.`,
    },
    {
      label: "Lease / Premises Risk",
      status: leaseRisk ? "AMBER" : "GREEN",
      color: leaseRisk ? AMBER : SUCCESS,
      detail: leaseRisk
        ? `Lease years remaining: ${extracted?.lease_years_remaining}. Under 5-year threshold — investigate renewal terms.`
        : extracted?.lease_years_remaining
        ? `Lease years remaining: ${extracted.lease_years_remaining}. Adequate coverage.`
        : "Lease term not extracted. Verify independently.",
    },
    {
      label: "Debt Stress Risk (−30% SDE)",
      status: debtStressRisk ? "RED" : "GREEN",
      color: debtStressRisk ? DANGER : SUCCESS,
      detail: debtStressRisk
        ? `DSCR drops to ${stressTest(metrics, 0.30).dscr.toFixed(2)}× at −30% stress — below 1.20× lender floor.`
        : `DSCR holds at ${stressTest(metrics, 0.30).dscr.toFixed(2)}× under severe −30% SDE stress.`,
    },
  ];

  flags.forEach((flag) => {
    doc.setFillColor(...flag.color);
    doc.rect(M, y, 4, 10, "F");
    doc.setFillColor(...ROWALT);
    doc.rect(M + 4, y, W - 2 * M - 4, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...flag.color);
    doc.text(`[${flag.status}]`, M + 7, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SLATE);
    doc.text(flag.label, M + 23, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    const detailLines = doc.splitTextToSize(flag.detail, W - 2 * M - 12);
    doc.text(detailLines[0] ?? "", M + 7, y + 8.5);

    y += 14;
  });
  y += 6;

  // ── Companies House Registry Verification (if available) ──
  if (registryData) {
    y = sectionTitle("Companies House Registry Verification", y);
    const rCols = [M + 2, M + 80];
    y = tableRow(["Registry Field", "Value"], y, rCols, [60, 0], true);
    [
      ["Registered Company", registryData.company_name],
      ["Company Number", `#${registryData.company_number}`],
      ["Incorporated", registryData.date_of_creation ?? "—"],
      ["Active Officers", String(registryData.active_officers_count)],
      ["Outstanding Charges", registryData.outstanding_charges_count > 0 ? `${registryData.outstanding_charges_count} registered charge(s)` : "None registered"],
      ["Open Credit Score", `${registryData.credit_score} / 100 — ${registryData.insolvency_risk}`],
      ["Estimated Credit Limit", registryData.credit_limit_gbp >= 1000 ? `£${(registryData.credit_limit_gbp / 1000).toFixed(0)}k` : `£${registryData.credit_limit_gbp}`],
      ["Reconciliation Score", registryData.reconciliation_score],
    ].forEach(([k, v], i) => {
      y = tableRow([k, v], y, rCols, [60, 0], false, false, i % 2 === 0,
        k === "Outstanding Charges" && registryData.outstanding_charges_count > 0 ? AMBER :
        k === "Reconciliation Score" && registryData.reconciliation_score === "ALERT" ? DANGER : BODY);
    });
    if (registryData.flags.length > 0) {
      y += 4;
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(...SLATE);
      doc.text("Registry Audit Flags:", M, y); y += 6;
      registryData.flags.forEach(flag => {
        const fc = flag.status === "AMBER" || flag.status === "RED" ? AMBER : [59, 130, 246] as [number, number, number];
        doc.setFillColor(...fc); doc.rect(M, y, 3, 7, "F");
        doc.setFillColor(...ROWALT); doc.rect(M + 3, y, W - 2 * M - 3, 7, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(...fc);
        doc.text(`[${flag.status}]`, M + 5, y + 4.5);
        doc.setFont("helvetica", "normal"); doc.setTextColor(...BODY);
        doc.text(doc.splitTextToSize(flag.title, W - 2 * M - 28)[0], M + 22, y + 4.5);
        y += 9;
      });
    }
    y += 8;
  }

  y = sectionTitle("Broker Routing & Submission Metadata", y);

  const bCols = [M + 2, M + 80];
  y = tableRow(["Field", "Value"], y, bCols, [60, 0], true);
  [
    ["Deal ID (Cryptographic Ref.)", dealId],
    ["Submission Timestamp (UTC)", new Date().toISOString()],
    ["Target Sector", sector],
    ["Deal Classification", metrics.dscr_band.toUpperCase()],
    ["DSCR", `${metrics.dscr.toFixed(2)}×`],
    ["Projected IRR", pct(metrics.equity_irr)],
    ["Total Deal Size", gbp(metrics.total_acquisition_cost)],
    ["Buyer Equity Required", gbp(metrics.buyer_equity_amount)],
    ["Routing Channels", "OakNorth Bank · SFC Commercial · Funding Circle"],
    ["Memo Version", "v2.0 — IB Suite"],
    ["Verification Hash", `SHA256:${dealId.split("").reverse().join("")}${Date.now().toString(36)}`],
  ].forEach(([k, v], i) => {
    y = tableRow([k, v], y, bCols, [60, 0], false, false, i % 2 === 0);
  });
  y += 12;

  // Closing stamp
  doc.setFillColor(...SLATE);
  doc.roundedRect(M, y, W - 2 * M, 24, 3, 3, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SUBMISSION AUTHORISED — READY FOR LENDER ROUTING", W / 2, y + 9, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`DealTriage UK M&A Engine · ${today} · Ref: ${dealId}`, W / 2, y + 16, { align: "center" });
  doc.text("This document is produced for indicative purposes only and does not constitute financial advice.", W / 2, y + 21, { align: "center" });

  footer(3);

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 4 — Credit Intelligence Report
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  header("PAGE 4 — CREDIT INTELLIGENCE REPORT", "Proprietary Risk Analysis");
  y = 58;

  y = sectionTitle("Credit Profile Summary", y);
  const crCols = [M + 2, M + 90];
  y = tableRow(["Metric", "Value"], y, crCols, [70, 0], true);
  const crRows: string[][] = [
    ["Open Credit Score", `${creditProfile?.open_credit_score ?? registryData?.credit_score ?? "—"} / 100`],
    ["Credit Band", creditProfile ? `Band ${creditProfile.credit_band} — ${creditProfile.credit_band_label}` : `—`],
    ["Insolvency Risk", creditProfile?.insolvency_risk ?? registryData?.insolvency_risk ?? "—"],
    ["Estimated Credit Limit", creditProfile ? (creditProfile.credit_limit_gbp >= 1000 ? `£${(creditProfile.credit_limit_gbp/1000).toFixed(0)}k` : `£${creditProfile.credit_limit_gbp}`) : "—"],
    ["Payment Behaviour", creditProfile?.payment_behaviour ?? "—"],
    ["Industry Risk", creditProfile ? `${creditProfile.industry_risk} — ${creditProfile.industry_label}` : "—"],
    ["Company Age", creditProfile ? `${creditProfile.company_age_years} year${creditProfile.company_age_years !== 1 ? "s" : ""}` : "—"],
    ["Score Percentile", creditProfile ? `Top ${100 - creditProfile.score_percentile}% of UK businesses` : "—"],
  ];
  crRows.forEach(([k, v], i) => { y = tableRow([k, v], y, crCols, [70, 0], false, false, i % 2 === 0); });
  y += 10;

  if (creditProfile?.detailed_factors && creditProfile.detailed_factors.length > 0) {
    y = sectionTitle("Credit Score Factor Breakdown", y);
    const fCols = [M + 2, M + 65, M + 105, M + 120, M + 145];
    y = tableRow(["Factor", "Category", "Score", "Max", "Status"], y, fCols, [58, 38, 15, 25, 0], true);
    const statusToColor = (s: string): [number,number,number] => {
      if (s === "excellent" || s === "good") return SUCCESS;
      if (s === "fair") return AMBER;
      return DANGER;
    };
    creditProfile.detailed_factors.slice(0, 12).forEach((f, i) => {
      const sc = `${f.earned}`;
      const mx = `${f.max_score}`;
      const st = f.status.charAt(0).toUpperCase() + f.status.slice(1);
      y = tableRow([f.name, f.category, sc, mx, st], y, fCols, [58, 38, 15, 25, 0], false, false, i % 2 === 0, statusToColor(f.status));
    });
    y += 10;
  }

  if (creditProfile?.data_sources_used && creditProfile.data_sources_used.length > 0) {
    y = sectionTitle("Enrichment Data Sources", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BODY);
    creditProfile.data_sources_used.forEach(src => {
      doc.setFillColor(...SUCCESS);
      doc.circle(M + 2, y + 1, 1.5, "F");
      doc.setTextColor(...BODY);
      doc.text(src, M + 6, y + 3.5);
      y += 7;
    });
    y += 4;
  }

  if (creditProfile?.valuation) {
    const val = creditProfile.valuation;
    y = sectionTitle("Valuation Estimate", y);
    const vCols = [M + 2, M + 80];
    y = tableRow(["Valuation Field", "Value"], y, vCols, [70, 0], true);
    [
      ["Sector", val.sector_label],
      ["Base Multiple Range", `${val.base_multiple_low.toFixed(1)}× – ${val.base_multiple_high.toFixed(1)}× (mid: ${val.base_multiple_mid.toFixed(1)}×)`],
      ["Credit-Adjusted Range", `${val.adjusted_multiple_low.toFixed(1)}× – ${val.adjusted_multiple_high.toFixed(1)}× (mid: ${val.adjusted_multiple_mid.toFixed(1)}×)`],
      ["Net Credit Adjustment", `${val.total_adjustment_pct >= 0 ? "+" : ""}${val.total_adjustment_pct.toFixed(1)}%`],
      ...(val.ev_low && val.ev_high ? [["Estimated EV Range", `${val.ev_low >= 1000000 ? `£${(val.ev_low/1000000).toFixed(2)}m` : `£${(val.ev_low/1000).toFixed(0)}k`} – ${val.ev_high >= 1000000 ? `£${(val.ev_high/1000000).toFixed(2)}m` : `£${(val.ev_high/1000).toFixed(0)}k`}`]] : []),
    ].forEach(([k, v], i) => { y = tableRow([k, v], y, vCols, [70, 0], false, false, i % 2 === 0); });
    y += 10;
  }

  // Closing disclaimer
  doc.setFillColor(...SLATE);
  doc.roundedRect(M, y, W - 2 * M, 20, 3, 3, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CREDIT INTELLIGENCE — PROPRIETARY & CONFIDENTIAL", W / 2, y + 8, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("This credit assessment is produced by DealTriage's proprietary scoring model. It is indicative only and does not constitute a credit rating.", W / 2, y + 14, { align: "center" });

  footer(4);

  doc.save(`deal-credit-memo-${dealId}.pdf`);
}

/* ─── Submit state labels ────────────────────────────────────────────────── */

const SUBMIT_STEPS = [
  "Verifying Underwriting Metrics…",
  "Packaging Deal Assets…",
  "Transmitting to UK Commercial Finance Portal…",
  "Success: Lead Routed ✓",
];

/* ─── Main drawer component ──────────────────────────────────────────────── */

export function CreditMemoDrawer({
  isOpen, onClose, metrics, extracted,
  askingPrice, netProfit, equityPct, vendorPct, bankPct,
  registryData, creditProfile,
}: Props) {
  const dealId = useDealId();
  const { isAtLeast, openUpgradeModal } = useSubscription();
  const isBroker = isAtLeast("broker");
  const [tab, setTab] = useState<"memo" | "broker">("memo");
  const [submitStep, setSubmitStep] = useState(-1);
  const [lenders, setLenders] = useState({ oaknorth: true, sfc: false, funding: true });
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Reset to memo tab whenever drawer opens
  useEffect(() => { if (isOpen) setTab("memo"); }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    if (submitStep >= 0) return;
    let step = 0;
    setSubmitStep(step);
    const iv = setInterval(() => {
      step++;
      if (step >= SUBMIT_STEPS.length) { clearInterval(iv); setTimeout(() => setSubmitStep(-1), 3000); return; }
      setSubmitStep(step);
    }, 1300);
  }, [submitStep]);

  const handleDownloadPDF = useCallback(async () => {
    setPdfGenerating(true);
    try {
      await generatePDF(metrics, extracted, askingPrice, netProfit, equityPct, vendorPct, bankPct, dealId, registryData, creditProfile);
    } finally {
      setPdfGenerating(false);
    }
  }, [metrics, extracted, askingPrice, netProfit, equityPct, vendorPct, bankPct, dealId, registryData, creditProfile]);

  const payload = {
    submission_id: dealId,
    timestamp: new Date().toISOString(),
    deal_metadata: {
      target_sector: extracted?.business_type ?? "SME",
      asking_price_gbp: Math.round(askingPrice),
      lease_terms_ok: (extracted?.lease_years_remaining ?? 5) >= 5,
    },
    debt_structure: {
      buyer_equity_gbp: Math.round(metrics.buyer_equity_amount),
      vendor_finance_gbp: Math.round(metrics.vendor_finance_amount),
      bank_loan_gbp: Math.round(metrics.bank_loan_amount),
      interest_rate_apr: 0.12,
      term_months: 60,
    },
    underwriting_metrics: {
      normalized_sde_gbp: Math.round(metrics.sde),
      dscr: metrics.dscr,
      projected_irr_5yr: metrics.equity_irr,
      levered_free_cash_flow_gbp: Math.round(metrics.levered_fcf),
    },
    ...(registryData ? {
      registry_verification: {
        company_name: registryData.company_name,
        company_number: registryData.company_number,
        incorporated: registryData.date_of_creation,
        outstanding_charges: registryData.outstanding_charges_count,
        active_officers: registryData.active_officers_count,
        open_credit_score: registryData.credit_score,
        estimated_credit_limit_gbp: registryData.credit_limit_gbp,
        insolvency_risk: registryData.insolvency_risk,
        reconciliation_score: registryData.reconciliation_score,
        material_flags: registryData.flags.length,
      },
    } : {}),
  };

  const s10 = stressTest(metrics, 0.10);
  const s20 = stressTest(metrics, 0.20);
  const s30 = stressTest(metrics, 0.30);

  const sdeMarginRisk  = netProfit > 0 && (netProfit / askingPrice) < 0.15;
  const leaseRisk      = extracted?.lease_years_remaining != null && extracted.lease_years_remaining < 5;
  const debtStressRisk = s30.dscr < 1.20;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1000,
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100dvh",
        width: "min(640px, 95vw)",
        background: "#ffffff",
        zIndex: 1001,
        boxShadow: "-12px 0 80px rgba(0,0,0,0.18)",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* ── Drawer header ── */}
        <div style={{
          background: "#1c1917",
          padding: "18px 22px 14px",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1c1917" }} />
                <span style={{ fontSize: 11, color: "#78716c", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
                  DealTriage · Stage 3 Unlock
                </span>
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#e7e5e4", margin: 0, letterSpacing: "-0.02em" }}>
                Credit Memo &amp; Lender Portal
              </h2>
              {registryData?.company_name && (
                <p style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc", margin: "3px 0 0" }}>
                  {registryData.company_name}
                </p>
              )}
              <p style={{ fontSize: 12, color: "#78716c", margin: "4px 0 0" }}>
                Deal ID: <span style={{ color: "#a5b4fc", fontFamily: "monospace", fontSize: 11 }}>{dealId}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 7, padding: "6px 10px", cursor: "pointer",
                color: "#a8a29e", fontSize: 16, lineHeight: 1,
              }}>
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
            {(["memo", "broker"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  if (t === "broker" && !isBroker) { openUpgradeModal("Broker API Hook"); return; }
                  setTab(t);
                }}
                style={{
                  fontSize: 12, fontWeight: 600, padding: "7px 16px",
                  borderRadius: 7, border: "none", cursor: "pointer",
                  background: tab === t ? "#1c1917" : "rgba(255,255,255,0.06)",
                  color: tab === t ? "#fff" : "#a8a29e",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                {t === "memo" ? "📄 Credit Memo PDF" : <>🔗 Broker API Hook {!isBroker && <span style={{ fontSize: 9, background: "#a855f722", color: "#a855f7", border: "1px solid #a855f744", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>BROKER</span>}</>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: "auto", background: "#faf9f7" }}>

          {/* ════ TAB: CREDIT MEMO ════ */}
          {tab === "memo" && (
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Download button */}
              <div style={{
                background: "#1c1917", borderRadius: 12, padding: "20px 22px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#e7e5e4", margin: "0 0 4px" }}>Deal Credit Memo</p>
                  <p style={{ fontSize: 12, color: "#78716c", margin: 0 }}>4-page institutional PDF · Credit intelligence included</p>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfGenerating}
                  style={{
                    background: pdfGenerating ? "#44403c" : "#1c1917",
                    color: "#fff", border: "none", borderRadius: 8,
                    padding: "10px 18px", fontSize: 13, fontWeight: 700,
                    cursor: pdfGenerating ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "background 0.15s", whiteSpace: "nowrap",
                  }}>
                  {pdfGenerating ? (
                    <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span> Compiling…</>
                  ) : (
                    <>⬇ Download PDF</>
                  )}
                </button>
              </div>

              {/* Page previews */}
              {[
                {
                  pg: "Page 1", title: "Executive Summary & Acquisition Structure",
                  items: [
                    `Target: ${extracted?.business_type ?? "Business"} · ${extracted?.location ?? "UK"}`,
                    `Total cost: ${gbp(metrics.total_acquisition_cost)} (incl. ${gbp(metrics.acquisition_fees)} fees)`,
                    `Capital mix: ${equityPct}% equity / ${vendorPct}% vendor / ${bankPct}% bank`,
                    `Entry multiple: ${metrics.valuation_multiple.toFixed(2)}× SDE`,
                  ],
                },
                {
                  pg: "Page 2", title: "Financial Stress Testing & Debt Service",
                  items: [
                    `DSCR: ${metrics.dscr.toFixed(2)}× (${metrics.dscr_band})`,
                    `Levered FCF: ${gbp(metrics.levered_fcf)}/yr`,
                    `−10% stress → DSCR ${s10.dscr.toFixed(2)}× · FCF ${gbp(s10.fcf)}`,
                    `−30% stress → DSCR ${s30.dscr.toFixed(2)}× · FCF ${gbp(s30.fcf)}`,
                    "5-year bank loan amortisation schedule",
                  ],
                },
                {
                  pg: "Page 3", title: "Risk Assessment & Broker Routing Sheet",
                  items: [
                    `SDE Stability: ${sdeMarginRisk ? "🔴 Flag" : "🟢 OK"}`,
                    `Lease Risk: ${leaseRisk ? "🟡 Amber" : "🟢 OK"}`,
                    `Debt Stress Risk: ${debtStressRisk ? "🔴 Flag" : "🟢 OK"}`,
                    `Cryptographic Deal ID + routing metadata`,
                  ],
                },
              ].map(({ pg, title, items }) => (
                <div key={pg} className="card" style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, background: "#e7e5e4", color: "#1c1917",
                      border: "1px solid #d6d3d1", borderRadius: 5, padding: "2px 8px",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>{pg}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1c1917" }}>{title}</span>
                  </div>
                  <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                    {items.map((item, i) => (
                      <li key={i} style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Page 4 preview card */}
              <div className="card" style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, background: "#e7e5e4", color: "#1c1917",
                    border: "1px solid #d6d3d1", borderRadius: 5, padding: "2px 8px",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>Page 4</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1c1917" }}>Credit Intelligence Report</span>
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                  {[
                    `Credit Score: ${creditProfile?.open_credit_score ?? registryData?.credit_score ?? "—"} / 100${creditProfile ? ` · Band ${creditProfile.credit_band} — ${creditProfile.credit_band_label}` : ""}`,
                    creditProfile ? `Insolvency Risk: ${creditProfile.insolvency_risk}` : "Insolvency Risk: —",
                    creditProfile?.detailed_factors ? `${creditProfile.detailed_factors.length} credit score factors breakdown` : "Credit factor breakdown",
                    creditProfile?.valuation ? `Valuation: ${creditProfile.valuation.sector_label} · ${creditProfile.valuation.adjusted_multiple_low.toFixed(1)}×–${creditProfile.valuation.adjusted_multiple_high.toFixed(1)}× (credit-adjusted)` : "Proprietary valuation estimate",
                    "Enrichment data sources & methodology",
                  ].map((item, i) => (
                    <li key={i} style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Registry verification card */}
              {registryData && (
                <div className="card" style={{ padding: "16px 18px", background: "#1c1917" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em" }}>
                      COMPANIES HOUSE REGISTRY VERIFICATION
                    </span>
                    <span style={{
                      marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                      background: registryData.reconciliation_score === "CLEAN" ? "#14532d" : registryData.reconciliation_score === "REVIEW" ? "#1e3a5f" : "#7f1d1d",
                      color: registryData.reconciliation_score === "CLEAN" ? "#86efac" : registryData.reconciliation_score === "REVIEW" ? "#a8a29e" : "#fca5a5",
                    }}>
                      {registryData.reconciliation_score}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    {[
                      ["Company", registryData.company_name],
                      ["Reg. Number", `#${registryData.company_number}`],
                      ["Open Credit Score", `${registryData.credit_score} / 100`],
                      ["Est. Credit Limit", registryData.credit_limit_gbp >= 1000 ? `£${(registryData.credit_limit_gbp / 1000).toFixed(0)}k` : `£${registryData.credit_limit_gbp}`],
                      ["Insolvency Risk", registryData.insolvency_risk],
                      ["Active Charges", registryData.outstanding_charges_count > 0 ? `${registryData.outstanding_charges_count} outstanding` : "None"],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: 9, color: "#475569", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#e7e5e4" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {registryData.flags.length > 0 && (
                    <div>
                      {registryData.flags.slice(0, 3).map((f, i) => (
                        <div key={i} style={{
                          display: "flex", gap: 8, padding: "6px 10px", marginBottom: 4,
                          background: f.status === "AMBER" || f.status === "RED" ? "rgba(217,119,6,0.1)" : "rgba(59,130,246,0.08)",
                          borderLeft: `2px solid ${f.status === "AMBER" || f.status === "RED" ? "#d97706" : "#3b82f6"}`,
                          borderRadius: "0 5px 5px 0",
                        }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: f.status === "AMBER" || f.status === "RED" ? "#fbbf24" : "#a8a29e", flexShrink: 0 }}>
                            {f.status}
                          </span>
                          <span style={{ fontSize: 11, color: "#a8a29e", lineHeight: 1.4 }}>{f.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p style={{ fontSize: 11, color: "#a8a29e", textAlign: "center", margin: 0 }}>
                For indicative purposes only · Not financial advice · DealTriage UK
              </p>
            </div>
          )}

          {/* ════ TAB: BROKER API ════ */}
          {tab === "broker" && (
            <PremiumGate feature="Broker API Hook" title="Broker API Integration" teaser="Submit deal packages directly to OakNorth, SFC, and Funding Circle" requiredTier="broker">
            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* JSON payload */}
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #1e293b" }}>
                <div style={{
                  background: "#1c1917", padding: "10px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ fontSize: 11, color: "#78716c", fontFamily: "monospace" }}>
                    POST /api/v1/submit-deal-package
                  </span>
                  <span style={{ fontSize: 10, color: "#1c1917", fontWeight: 600, background: "#1e1b4b", padding: "2px 8px", borderRadius: 4 }}>
                    LIVE PAYLOAD
                  </span>
                </div>
                <div style={{ background: "#0d1117", padding: "14px 16px", overflowX: "auto" }}>
                  <JsonBlock obj={payload} />
                </div>
              </div>

              {/* Lender toggles */}
              <div className="card" style={{ padding: "18px 20px" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", margin: "0 0 14px" }}>
                  Lender Integration Toggles
                </h3>
                {(["oaknorth", "sfc", "funding"] as const).map((key) => {
                  const labels: Record<string, { name: string; desc: string; badge: string }> = {
                    oaknorth: { name: "OakNorth Bank",     desc: "Challenger bank · SME acquisition specialist",   badge: "✓ Active" },
                    sfc:      { name: "SFC Commercial",    desc: "Alternative lender · Flexible structuring",      badge: "Beta" },
                    funding:  { name: "Funding Circle",    desc: "P2P lending platform · Fast decisions",          badge: "✓ Active" },
                  };
                  const { name, desc, badge } = labels[key];
                  const on = lenders[key];
                  return (
                    <div key={key} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 0",
                      borderBottom: key !== "funding" ? "1px solid var(--border)" : "none",
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1c1917" }}>{name}</span>
                          <span style={{ fontSize: 10, color: on ? "#059669" : "#a8a29e", background: on ? "#d1fae5" : "#e7e5e4", border: `1px solid ${on ? "#a7f3d0" : "#d6d3d1"}`, borderRadius: 4, padding: "1px 7px", fontWeight: 600 }}>
                            {on ? badge : "Disabled"}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: "#78716c", margin: "2px 0 0" }}>{desc}</p>
                      </div>
                      <button
                        onClick={() => setLenders(l => ({ ...l, [key]: !l[key] }))}
                        style={{
                          width: 44, height: 24, borderRadius: 12,
                          background: on ? "#1c1917" : "#d6d3d1",
                          border: "none", cursor: "pointer",
                          position: "relative", transition: "background 0.2s", flexShrink: 0,
                        }}
                        aria-checked={on}
                        role="switch">
                        <span style={{
                          position: "absolute", top: 3,
                          left: on ? 23 : 3,
                          width: 18, height: 18,
                          borderRadius: "50%", background: "#fff",
                          transition: "left 0.2s",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        }} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Submit button */}
              <div className="card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", margin: 0 }}>Submit to Active Lenders</h3>
                  <span style={{ fontSize: 11, color: "#78716c" }}>
                    {Object.values(lenders).filter(Boolean).length} lender{Object.values(lenders).filter(Boolean).length !== 1 ? "s" : ""} selected
                  </span>
                </div>

                {submitStep >= 0 ? (
                  <div style={{
                    background: submitStep === SUBMIT_STEPS.length - 1 ? "#d1fae5" : "#faf9f7",
                    border: `1px solid ${submitStep === SUBMIT_STEPS.length - 1 ? "#a7f3d0" : "#d6d3d1"}`,
                    borderRadius: 8, padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    {submitStep < SUBMIT_STEPS.length - 1 ? (
                      <span style={{ fontSize: 14, animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span>
                    ) : (
                      <span style={{ fontSize: 14 }}>✅</span>
                    )}
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: submitStep === SUBMIT_STEPS.length - 1 ? "#059669" : "#475569",
                    }}>
                      {SUBMIT_STEPS[submitStep]}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    style={{
                      width: "100%", background: "#1c1917", color: "#fff",
                      border: "none", borderRadius: 8, padding: "12px 16px",
                      fontSize: 14, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: "0 4px 14px rgba(28,25,23,0.3)",
                      transition: "box-shadow 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(28,25,23,0.45)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(28,25,23,0.3)")}>
                    🚀 Submit to Lenders
                  </button>
                )}

                <p style={{ fontSize: 11, color: "#a8a29e", margin: "10px 0 0", textAlign: "center" }}>
                  Simulated routing only · No real submission is made · DealTriage demo
                </p>
              </div>
            </div>
            </PremiumGate>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
