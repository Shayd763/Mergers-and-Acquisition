"use client";
import { useState, useRef, useCallback } from "react";

/* ─── Glossary data ──────────────────────────────────────────────────────── */

export const GLOSSARY = {
  // ── Core valuation ──────────────────────────────────────────────────────
  SDE: {
    fullName: "Seller's Discretionary Earnings",
    definition:
      "The total financial benefit a single owner-operator derives from the business. Calculated as Net Profit plus the owner's salary, personal perks, and any one-off or non-recurring expenses that won't continue under new ownership.",
    usage:
      "Small business valuations are almost always expressed as a multiple of SDE rather than corporate EBITDA, because the owner's salary is treated as a profit add-back.",
  },
  EBITDA: {
    fullName: "Earnings Before Interest, Tax, Depreciation & Amortisation",
    definition:
      "A measure of a company's core operating profitability before financing costs and accounting adjustments. It strips out interest payments, tax charges, and non-cash depreciation to show what the business earns purely from its operations.",
    usage:
      "Larger SME and corporate acquisitions use EBITDA multiples. For owner-managed businesses under £2m profit, SDE is more common because the owner's salary must be added back.",
  },
  DSCR: {
    fullName: "Debt Service Coverage Ratio",
    definition:
      "Divides the business's annual earnings (SDE) by its total annual debt repayments (bank loan + vendor finance). A ratio of 1.25× means the business earns 25% more than it needs to cover all debt payments.",
    usage:
      "UK commercial lenders typically require a minimum DSCR of 1.25× before approving an acquisition loan. Below that threshold, the deal is considered too risky to lend against.",
  },
  IRR: {
    fullName: "Internal Rate of Return",
    definition:
      "The annualised percentage return on the cash you personally invested in the deal, assuming you exit (sell) the business at the end of the holding period at the same multiple you paid.",
    usage:
      "Search fund and private equity investors target IRRs of 25–35%+. It lets you compare this acquisition against putting money into stocks, property, or other businesses.",
  },
  EV: {
    fullName: "Enterprise Value",
    definition:
      "The total price paid to acquire a business on a debt-free, cash-free basis — meaning the buyer takes on no existing debt and keeps no surplus cash. It is the purest measure of what the business itself is worth.",
    usage:
      "EV = Asking Price. It differs from Equity Value, which adjusts for any debt or cash the buyer inherits at completion.",
  },
  ValuationMultiple: {
    fullName: "Valuation Multiple (EV / SDE)",
    definition:
      "How many times the annual SDE (or EBITDA) the buyer is paying. A 3× multiple means the asking price equals three years' worth of the business's earnings.",
    usage:
      "UK SME multiples typically range from 2× to 4.5× SDE depending on sector, profitability, and growth profile. The higher the multiple, the longer it takes to recoup your investment from earnings alone.",
  },
  // ── Capital structure ────────────────────────────────────────────────────
  CapitalStack: {
    fullName: "Capital Stack",
    definition:
      "The full breakdown of how an acquisition is financed — showing the mix of buyer equity, bank debt, and vendor finance, and the total percentage each contributes to the purchase price.",
    usage:
      "A typical UK SME acquisition uses roughly 30% buyer equity, 50% bank debt, and 20% vendor finance. The stack determines your upfront cash requirement and the annual debt burden.",
  },
  BuyerEquity: {
    fullName: "Buyer Equity (Cash Injection)",
    definition:
      "The portion of the purchase price you personally contribute from your own savings or investors on day one. It is the first money in and the last money out — highest risk, highest reward.",
    usage:
      "Most UK acquisition lenders require 20–30% equity from the buyer. A higher equity contribution reduces your loan size and improves your DSCR.",
  },
  VendorFinance: {
    fullName: "Vendor Finance / Earn-out",
    definition:
      "A structure where the seller agrees to receive a portion of the purchase price in instalments over 2–5 years, rather than all upfront at completion. The seller effectively lends part of the purchase price back to the buyer.",
    usage:
      "Used to bridge valuation gaps and reduce the buyer's upfront cash requirement. It also incentivises the seller to support a smooth transition, as they have a stake in the business performing post-sale.",
  },
  BankDebt: {
    fullName: "Bank / Commercial Debt",
    definition:
      "A loan from a commercial bank or alternative lender used to fund part of the acquisition. Typically structured over 5–7 years with interest, and secured against the business's assets or future cash flows.",
    usage:
      "UK acquisition loans typically run at 10–13% APR for SME deals and are sized so that the resulting DSCR stays above 1.25×. Common lenders include OakNorth, Shawbrook, and Funding Circle.",
  },
  NormalizedAdjustments: {
    fullName: "Normalised Adjustments (Add-backs)",
    definition:
      "One-time or personal costs the current owner runs through the business — such as their own salary, personal car, pension, or non-recurring legal fees — that a new owner would not incur at the same level.",
    usage:
      "Adding these back to net profit reveals the true earning power of the business independent of the current owner's pay choices. This adjusted figure is the basis for SDE and therefore the valuation multiple.",
  },
  AddBacks: {
    fullName: "Add-backs (Owner Adjustments)",
    definition:
      "Costs in the business's accounts that are specific to the current owner and will not apply to the new buyer — most commonly the owner's salary, a company car, family payroll, and personal expenses run through the business.",
    usage:
      "Each add-back must be verified against payroll records, P60s, and bank statements. Inflated or unsubstantiated add-backs are one of the most common sources of post-acquisition disappointment.",
  },
  // ── Returns ──────────────────────────────────────────────────────────────
  LeveredFCF: {
    fullName: "Levered Free Cash Flow",
    definition:
      "The net cash left over after paying all operating costs, corporation tax, bank loan repayments (principal and interest), and vendor earn-out instalments. It represents what the new owner can actually take home.",
    usage:
      'This is your annual "take-home pay" as the business owner. A positive Levered FCF means the business is generating real cash for you after servicing all its debts.',
  },
  CoCROI: {
    fullName: "Cash-on-Cash Return (CoC ROI)",
    definition:
      "Divides the annual Levered Free Cash Flow by the total equity you personally invested. Expressed as a percentage, it tells you how much cash you earn back each year relative to what you put in.",
    usage:
      "A CoC ROI of 20% means you earn back 20% of your personal equity injection every year. At that rate, your equity pays for itself in 5 years — before any equity value growth from selling the business.",
  },
  // ── Debt mechanics ───────────────────────────────────────────────────────
  Amortisation: {
    fullName: "Loan Amortisation",
    definition:
      "The process of paying off a loan through regular scheduled payments that cover both interest and a portion of the principal (the amount borrowed). Each year, the interest portion shrinks as the outstanding balance falls.",
    usage:
      "A fully amortising 5-year loan means you repay the entire balance by month 60 with no balloon payment. The annual debt service is constant throughout the term.",
  },
  APR: {
    fullName: "Annual Percentage Rate",
    definition:
      "The total annual cost of borrowing expressed as a percentage, including the interest rate and any mandatory fees. It allows fair comparison between different loan products.",
    usage:
      "UK SME acquisition loans typically carry APRs of 10–14%. The rate directly affects your DSCR — a higher APR means higher annual repayments and therefore a lower DSCR.",
  },
  DebtService: {
    fullName: "Annual Debt Service",
    definition:
      "The total amount owed to all lenders in a given year — covering both the interest charged and the principal repaid on bank loans, plus any scheduled vendor finance payments.",
    usage:
      "This is the figure the DSCR is calculated against. If your SDE is £150,000 and annual debt service is £100,000, your DSCR is 1.5×.",
  },
  // ── Tax ──────────────────────────────────────────────────────────────────
  CorpTax: {
    fullName: "Corporation Tax",
    definition:
      "The UK government tax on a company's profits, currently 25% for profits above £250,000 (as of 2024). It is deducted from profits before calculating the cash available to service debt and pay dividends.",
    usage:
      "The triage engine applies a simplified 25% CT charge to SDE when calculating Levered FCF. In practice, your actual tax bill will depend on allowances, reliefs, and your accountant's structuring.",
  },
  SDLT: {
    fullName: "Stamp Duty Land Tax (SDLT)",
    definition:
      "A UK government tax paid by the buyer when acquiring property or, in a business context, when the deal is structured as a share purchase. Rates vary based on deal type and the value of assets transferred.",
    usage:
      "In a share purchase (buying the company itself), SDLT applies to any property held by the business. In an asset purchase, SDLT may apply to the land and buildings element. The triage engine uses a simplified 5% acquisition fee estimate to cover SDLT and advisory costs combined.",
  },
  // ── Legal / process ──────────────────────────────────────────────────────
  DueDiligence: {
    fullName: "Due Diligence (DD)",
    definition:
      "The formal investigation a buyer conducts into a business before completing an acquisition. It covers financial records (3 years of accounts), legal contracts, staff agreements, premises leases, customer concentration, and any outstanding liabilities.",
    usage:
      "DD typically takes 4–12 weeks and is led by your solicitor and accountant. It is your best opportunity to verify every claim made in the listing or IM before you are legally bound.",
  },
  HeadsOfTerms: {
    fullName: "Heads of Terms (HoT)",
    definition:
      "A non-binding document signed by both buyer and seller that outlines the agreed commercial terms of the deal — price, structure, exclusivity period, and key conditions — before the formal legal process begins.",
    usage:
      "Signing HoT triggers the exclusivity period (typically 4–8 weeks) during which the seller cannot talk to other buyers. It is not legally binding on price or structure, but sets the framework for the formal contract.",
  },
  Completion: {
    fullName: "Completion",
    definition:
      "The moment the deal legally closes — ownership transfers, money changes hands, and you become the new owner of the business. From this point all obligations in the sale and purchase agreement are binding.",
    usage:
      "All charges registered at Companies House must be discharged (paid off) before or at completion, unless explicitly agreed otherwise. The buyer's solicitor runs a final search to confirm a clean title.",
  },
  SPA: {
    fullName: "Sale and Purchase Agreement (SPA)",
    definition:
      "The binding legal contract that governs the acquisition of a business. It contains the price, payment structure, warranties, indemnities, completion conditions, and post-sale obligations of both parties.",
    usage:
      "Warranties in the SPA protect the buyer if the seller's representations turn out to be false — for example, if undisclosed liabilities are discovered after completion.",
  },
  PersonalGuarantee: {
    fullName: "Personal Guarantee (PG)",
    definition:
      "A legal commitment by an individual (usually the buyer) to repay a business loan personally if the company cannot. It means the lender can pursue your personal assets — house, savings — if the business defaults.",
    usage:
      "Most UK acquisition lenders require a partial or full personal guarantee. You should factor PG exposure into your overall risk assessment and consider whether the business cash flows adequately cover the debt.",
  },
  // ── Companies House / registry ────────────────────────────────────────────
  OutstandingCharges: {
    fullName: "Registered Charges (Debentures)",
    definition:
      "A legal security interest registered at Companies House by a lender, giving them first claim over specified business assets (such as property, equipment, or debtors) if the company cannot repay its debt. Common examples are bank debentures and asset finance charges.",
    usage:
      "Charges must normally be legally discharged (the debt repaid) at or before completion of a sale, or explicitly agreed to be assumed by the buyer. An undisclosed charge discovered post-sale can give rise to legal claims against the seller.",
  },
  SICCode: {
    fullName: "SIC Code (Standard Industrial Classification)",
    definition:
      "A 5-digit code assigned by Companies House to describe the primary business activity of a company. Every UK company must declare one or more SIC codes when it incorporates or changes its activities.",
    usage:
      "SIC codes help buyers quickly identify what a company officially does, and whether its declared activity matches the listing description. Mismatched SIC codes can flag that a company has pivoted its business model.",
  },
  CompaniesHouse: {
    fullName: "Companies House",
    definition:
      "The official UK government registry where all limited companies must register and file annual accounts, confirmation statements, and details of directors, shareholders, and charges. It is a free public database.",
    usage:
      "Before any acquisition, buyers should verify the target company's registered details, check for outstanding charges, and review any filed accounts on Companies House to cross-reference listing claims.",
  },
  ConfirmationStatement: {
    fullName: "Confirmation Statement (formerly Annual Return)",
    definition:
      "A document every UK company must file with Companies House at least once a year confirming that its registered details — directors, shareholders, registered address, SIC codes — are correct and up to date.",
    usage:
      "An overdue confirmation statement is a red flag — it may indicate the company is poorly administered, in financial difficulty, or at risk of being struck off the register.",
  },
  // ── Deal structures ──────────────────────────────────────────────────────
  MBO: {
    fullName: "Management Buy-Out (MBO)",
    definition:
      "An acquisition where the existing management team of a business buys it from its current owners, typically funded by a mix of their own equity, bank debt, and private equity investment.",
    usage:
      "MBOs are lower-risk for lenders because the management team already knows the business. However, management teams often lack sufficient personal capital and need to bring in a financial sponsor.",
  },
  MBI: {
    fullName: "Management Buy-In (MBI)",
    definition:
      "An acquisition where an external buyer (who has no prior involvement with the business) acquires a company and installs themselves as the new management. The most common form of SME acquisition by individuals.",
    usage:
      "MBIs carry higher transition risk than MBOs because the new owner is learning the business from scratch. A handover period with the seller (typically 3–6 months) is strongly advisable.",
  },
  SearchFund: {
    fullName: "Search Fund",
    definition:
      "An investment vehicle where an entrepreneur raises a small amount of capital from investors to fund a 1–2 year search for a business to acquire. Once a target is found, the investors typically participate in funding the acquisition.",
    usage:
      "Search funds are common in the US and growing in the UK. They offer a structured path for first-time buyers who want investor backing and mentorship through the acquisition process.",
  },
  Earnout: {
    fullName: "Earn-out",
    definition:
      "A portion of the purchase price that is paid to the seller only if the business hits agreed performance targets (revenue, profit, or EBITDA) in the years after completion. It defers risk from buyer to seller.",
    usage:
      "Earn-outs are common when there is disagreement on valuation or uncertainty about future performance. They protect the buyer if the business underperforms, but can create disputes if targets are poorly defined.",
  },
  WorkingCapital: {
    fullName: "Working Capital",
    definition:
      "The difference between a business's current assets (cash, stock, debtors) and its current liabilities (creditors, short-term debt). It represents the liquid funds needed to run day-to-day operations.",
    usage:
      "Working capital is typically a negotiated 'peg' in SME acquisitions — the seller must leave sufficient working capital in the business at completion to fund normal operations. A shortfall is deducted from the purchase price.",
  },
  KeyPersonRisk: {
    fullName: "Key-Person Risk",
    definition:
      "The risk that a business's performance is heavily dependent on one or a small number of individuals — often the owner — whose departure could significantly damage revenue, client relationships, or operational capability.",
    usage:
      "High key-person risk is one of the most common reasons lenders decline acquisition finance, or impose lower multiples. Mitigation includes earn-out structures, handover periods, and key-man insurance.",
  },
  // ── Credit / risk ─────────────────────────────────────────────────────────
  InsolvencyRisk: {
    fullName: "Insolvency Risk",
    definition:
      "The probability that a company will be unable to pay its debts as they fall due. Companies become insolvent when liabilities exceed assets, or when they cannot generate enough cash to meet obligations.",
    usage:
      "In the context of the credit engine, insolvency risk is estimated from company age, filing compliance, and outstanding charges — all freely available from Companies House, without needing expensive credit bureau data.",
  },
  TradeCreditLimit: {
    fullName: "Estimated Trade Credit Limit",
    definition:
      "A conservative estimate of how much unsecured credit (e.g. 30-day payment terms) a supplier or counterparty might reasonably extend to this company, based on its age, size, and financial compliance record.",
    usage:
      "This is not a bank lending limit — it represents typical trade credit exposure between businesses. Useful for assessing whether suppliers are likely to extend normal payment terms to the company post-acquisition.",
  },
  // ── Financial reports / documents ─────────────────────────────────────────
  ProfitAndLoss: {
    fullName: "Profit & Loss Statement (P&L)",
    definition:
      "A financial statement showing a company's revenues, costs, and expenses over a specific period, resulting in a net profit or loss figure. Also called the Income Statement.",
    usage:
      "Buyers should request at least 3 years of P&L statements during due diligence. Look for revenue and profit trends — is the business growing, flat, or declining? One good year does not make a reliable acquisition.",
  },
  P60: {
    fullName: "P60 (End of Year Certificate)",
    definition:
      "An official HMRC document issued to every employee at the end of each tax year, confirming their total taxable pay and the income tax and National Insurance deducted through PAYE during that year.",
    usage:
      "When a seller claims a director salary add-back, the buyer's accountant should request the director's P60s to verify the salary amount was actually paid through payroll, not artificially inflated for the IM.",
  },
  P11D: {
    fullName: "P11D (Benefits in Kind Report)",
    definition:
      "An annual report filed by employers with HMRC listing any non-cash benefits provided to employees or directors — such as company cars, private medical insurance, or expense allowances — that are taxable.",
    usage:
      "P11Ds reveal perks the owner receives from the business that may be claimed as add-backs in the SDE calculation. Always cross-reference add-back claims against P11D filings.",
  },
  IM: {
    fullName: "Information Memorandum (IM)",
    definition:
      "A formal document prepared by the seller or their broker that provides detailed information about a business for sale — including financials, operations, customers, and management — intended to help buyers evaluate the opportunity.",
    usage:
      "An IM is a marketing document, not an audited report. Figures should be independently verified against filed accounts and bank statements during due diligence. Always read it with professional scepticism.",
  },
  // ── Lender / financing ────────────────────────────────────────────────────
  Covenant: {
    fullName: "Loan Covenant",
    definition:
      "A condition built into a loan agreement that the borrower must maintain throughout the life of the loan — commonly a minimum DSCR, a maximum leverage ratio, or a restriction on paying dividends above a certain level.",
    usage:
      "A common covenant is 'maintain DSCR above 1.20× at all times'. If the business underperforms and breaches this, the bank can call in the loan early. Always understand your covenants before signing.",
  },
  GrossMargin: {
    fullName: "Gross Margin",
    definition:
      "The percentage of revenue left after deducting the direct costs of producing goods or services (cost of goods sold). Formula: (Revenue – Cost of Goods Sold) ÷ Revenue × 100.",
    usage:
      "High gross margins (e.g. 70%+ in SaaS or consulting) mean more of each pound of revenue flows down to profit. Low margins (e.g. 15% in retail) mean even small revenue drops can wipe out profitability.",
  },
  Revenue: {
    fullName: "Revenue / Turnover",
    definition:
      "The total income a business generates from its trading activities before any costs are deducted. Also called 'top line' because it appears at the top of the Profit & Loss statement.",
    usage:
      "Revenue alone does not indicate a healthy business — a £5m turnover business with 2% margins may be less attractive than a £500k turnover business with 35% margins. Always look at both.",
  },
  NetProfit: {
    fullName: "Net Profit (after-tax)",
    definition:
      "The amount left after deducting all business expenses — wages, rent, utilities, depreciation, interest, and tax — from total revenue. The 'bottom line' of the Profit & Loss statement.",
    usage:
      "In owner-managed businesses, net profit is typically understated because it includes the owner's salary as a cost. Adding back the owner's salary (and other personal expenses) gives you SDE, the true earnings basis for valuation.",
  },
  LTV: {
    fullName: "Loan-to-Value Ratio (LTV)",
    definition:
      "The ratio of the loan amount to the value of the asset used as security. For a business acquisition, it expresses bank debt as a percentage of the total enterprise value.",
    usage:
      "UK acquisition lenders typically lend up to 60–70% LTV. A higher LTV means the bank is taking more risk, which usually results in a higher interest rate or stricter covenants.",
  },
  Debenture: {
    fullName: "Debenture (Fixed & Floating Charge)",
    definition:
      "A legal document used by lenders to secure a loan against a company's assets. A fixed charge attaches to specific assets (e.g. property), while a floating charge covers all current assets (stock, debtors, cash) which can change day-to-day.",
    usage:
      "When a bank issues a debenture, it is registered at Companies House as a 'charge'. If you acquire a company with an undischarged debenture, the bank retains security over the assets — a major legal risk.",
  },
  RecurringRevenue: {
    fullName: "Recurring Revenue",
    definition:
      "Revenue that is contractually committed or highly predictable — such as annual subscription fees, maintenance contracts, or retainer agreements — rather than one-off or project-based income.",
    usage:
      "Businesses with high recurring revenue command premium valuation multiples because earnings are more predictable and less vulnerable to economic downturns. A pipeline-dependent business is worth materially less.",
  },
  CustomerConcentration: {
    fullName: "Customer Concentration Risk",
    definition:
      "The risk that a large proportion of a business's revenue comes from a small number of customers. If the top customer leaves post-acquisition, revenue could drop dramatically.",
    usage:
      "A common red flag is any single customer accounting for more than 20% of revenue. Lenders and buyers should request a revenue breakdown by customer and assess the durability of each key relationship.",
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;

/* ─── Component ──────────────────────────────────────────────────────────── */

interface Props {
  term: GlossaryKey;
  children?: React.ReactNode;
}

export function GlossaryTerm({ term, children }: Props) {
  const entry = GLOSSARY[term];
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const tooltipW = Math.min(340, window.innerWidth - 16);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - tooltipW - 8));
    // Flip above if less than 240px below anchor
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < 240 ? Math.max(8, r.top - 8 - 260) : r.bottom + 8;
    setPos({ top, left });
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => setVisible(false), 80);
  }, []);

  const keepOpen = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{
          borderBottom: "1px dashed rgba(100,116,139,0.5)",
          cursor: "help",
          display: "inline",
        }}
      >
        {children ?? term}
      </span>

      {visible && (
        <div
          onMouseEnter={keepOpen}
          onMouseLeave={hide}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            width: Math.min(340, window.innerWidth - 16),
            maxWidth: "calc(100vw - 16px)",
            background: "rgba(9,9,11,0.97)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 10,
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            padding: "14px 16px",
            pointerEvents: "auto",
            animation: "tooltipIn 0.12s ease-out",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 800, color: "#e7e5e4", margin: "0 0 2px", letterSpacing: "-0.01em" }}>
            {entry.fullName}
          </p>
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />
          <p style={{ fontSize: 12, color: "#d6d3d1", margin: "0 0 10px", lineHeight: 1.65 }}>
            {entry.definition}
          </p>
          <p style={{ fontSize: 11, color: "#a8a29e", margin: 0, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: "#a5b4fc" }}>In practice: </span>
            <span style={{ fontStyle: "italic" }}>{entry.usage}</span>
          </p>
        </div>
      )}

      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
