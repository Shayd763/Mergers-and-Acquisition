/* ─── SEO Data Configuration ─────────────────────────────────────────────── */
/* Used by programmatic /buy/[sector]-business-in-[city] routes               */

export const SECTORS = [
  "manufacturing",
  "engineering",
  "accounting-practices",
  "dental-practices",
  "e-commerce",
  "logistics",
  "day-nurseries",
  "pubs-and-restaurants",
] as const;

export const CITIES = [
  "london",
  "manchester",
  "birmingham",
  "leeds",
  "glasgow",
  "bristol",
  "liverpool",
  "newcastle",
] as const;

export type Sector = (typeof SECTORS)[number];
export type City = (typeof CITIES)[number];

export interface SectorData {
  displayName: string;
  avgSdeMultiple: number;
  avgAskingPrice: number;
  avgTurnover: number;
  avgNetProfit: number;
  avgAddBacks: number;
  avgProfitMargin: number;        // as a decimal
  leaseYearsRemaining: number;
  marketCondition: "hot" | "stable" | "cooling";
  marketSummary: string;
  keyDrivers: string[];
  riskFactors: string[];
  lenderAppetite: string;
}

export interface CityData {
  displayName: string;
  region: string;
  marketNote: string;
  premiumPct: number;             // price premium vs national average, as decimal
}

export const SECTOR_DATA: Record<Sector, SectorData> = {
  "manufacturing": {
    displayName: "Manufacturing",
    avgSdeMultiple: 3.2,
    avgAskingPrice: 680000,
    avgTurnover: 1400000,
    avgNetProfit: 160000,
    avgAddBacks: 55000,
    avgProfitMargin: 0.114,
    leaseYearsRemaining: 9,
    marketCondition: "stable",
    marketSummary: "UK manufacturing SMEs are trading at a stable 3.0–3.5× SDE multiple as reshoring trends and supply-chain resilience drive renewed buyer interest. Lenders remain comfortable with asset-backed facilities for businesses with tangible machinery collateral.",
    keyDrivers: ["Asset-backed lending available", "Reshoring tailwinds", "Recurring B2B contracts", "Government R&D incentives"],
    riskFactors: ["Energy cost exposure", "Skills shortage", "FX exposure on imports", "CapEx maintenance cycle"],
    lenderAppetite: "Strong — asset collateral reduces lender risk significantly.",
  },
  "engineering": {
    displayName: "Engineering Consultancy",
    avgSdeMultiple: 3.5,
    avgAskingPrice: 550000,
    avgTurnover: 820000,
    avgNetProfit: 120000,
    avgAddBacks: 63000,
    avgProfitMargin: 0.146,
    leaseYearsRemaining: 7,
    marketCondition: "hot",
    marketSummary: "Engineering consultancies with strong recurring client books are commanding 3.2–4.0× SDE multiples in 2024. Demand from infrastructure and net-zero construction programmes is creating strong forward pipelines, making these among the most attractive SME acquisition targets.",
    keyDrivers: ["Net-zero infrastructure demand", "High EBITDA margins", "Government contract visibility", "Specialist skill moats"],
    riskFactors: ["Key-man dependency", "Project concentration risk", "Recruitment competition", "Liability insurance costs"],
    lenderAppetite: "Very strong — recurring revenue and margins attract mainstream commercial lenders.",
  },
  "accounting-practices": {
    displayName: "Accounting Practice",
    avgSdeMultiple: 4.0,
    avgAskingPrice: 480000,
    avgTurnover: 620000,
    avgNetProfit: 110000,
    avgAddBacks: 72000,
    avgProfitMargin: 0.177,
    leaseYearsRemaining: 5,
    marketCondition: "hot",
    marketSummary: "Accountancy practices continue to attract premium multiples of 3.5–5.0× SDE due to extraordinarily high client retention (often 95%+) and recurring fee income. Consolidation by mid-market PE firms is compressing supply, pushing valuations higher.",
    keyDrivers: ["95%+ client retention rates", "Mandatory compliance demand", "Recurring annual fees", "MTD digitisation revenue"],
    riskFactors: ["Client concentration", "Software disruption", "Staff retention", "Regulatory compliance cost"],
    lenderAppetite: "Excellent — recurring income streams are highly bankable.",
  },
  "dental-practices": {
    displayName: "Dental Practice",
    avgSdeMultiple: 4.2,
    avgAskingPrice: 1100000,
    avgTurnover: 850000,
    avgNetProfit: 210000,
    avgAddBacks: 52000,
    avgProfitMargin: 0.247,
    leaseYearsRemaining: 12,
    marketCondition: "hot",
    marketSummary: "Dental practices command the highest multiples in the UK SME M&A market — typically 4.0–6.0× SDE — driven by NHS contract value, private patient growth, and aggressive consolidation by DSO groups. Seller demand is extremely strong as founders look to exit ahead of NHS contract renegotiations.",
    keyDrivers: ["NHS contract certainty", "Private dentistry growth", "DSO acquisition premiums", "Recession-resilient demand"],
    riskFactors: ["NHS renegotiation risk", "Regulatory compliance (CQC)", "Associate dependency", "Equipment refresh CapEx"],
    lenderAppetite: "Excellent — NHS contracts treated as near-guaranteed income by lenders.",
  },
  "e-commerce": {
    displayName: "E-Commerce Business",
    avgSdeMultiple: 2.8,
    avgAskingPrice: 320000,
    avgTurnover: 1200000,
    avgNetProfit: 90000,
    avgAddBacks: 38000,
    avgProfitMargin: 0.075,
    leaseYearsRemaining: 3,
    marketCondition: "cooling",
    marketSummary: "E-commerce multiples have compressed from post-pandemic highs to 2.0–3.5× SDE as CAC inflation and marketplace competition intensify. Buyers who can identify proprietary branded channels or subscription models still find excellent value at current prices.",
    keyDrivers: ["Direct-to-consumer margin potential", "Digital asset portability", "Low physical footprint", "Subscription model upside"],
    riskFactors: ["Platform dependency (Amazon, Shopify)", "Rising CAC", "Margin compression", "Inventory financing need"],
    lenderAppetite: "Moderate — lenders typically require higher equity contributions (30–40%).",
  },
  "logistics": {
    displayName: "Logistics & Haulage",
    avgSdeMultiple: 2.9,
    avgAskingPrice: 750000,
    avgTurnover: 2100000,
    avgNetProfit: 145000,
    avgAddBacks: 68000,
    avgProfitMargin: 0.069,
    leaseYearsRemaining: 8,
    marketCondition: "stable",
    marketSummary: "Logistics and haulage businesses are trading at 2.5–3.2× SDE with strong asset backing from fleet value. The sector benefits from structural e-commerce-driven demand, though fuel cost volatility and driver shortages remain persistent concerns for buyers.",
    keyDrivers: ["Asset collateral (fleet)", "E-commerce structural demand", "Last-mile delivery growth", "B2B contract stability"],
    riskFactors: ["Fuel cost volatility", "Driver shortage & HGV licensing", "Fleet depreciation CapEx", "ULEZ & emissions compliance"],
    lenderAppetite: "Good — asset-backed lending against fleet value reduces lender exposure.",
  },
  "day-nurseries": {
    displayName: "Day Nursery",
    avgSdeMultiple: 3.6,
    avgAskingPrice: 420000,
    avgTurnover: 580000,
    avgNetProfit: 95000,
    avgAddBacks: 42000,
    avgProfitMargin: 0.164,
    leaseYearsRemaining: 10,
    marketCondition: "hot",
    marketSummary: "Day nurseries are seeing strong acquisition demand driven by government 30-hours free childcare expansion and institutional consolidator activity. Multiples of 3.0–4.5× SDE reflect the combination of recurring government-backed income and high barriers to entry from Ofsted registration requirements.",
    keyDrivers: ["Government 30hr free childcare expansion", "Ofsted registration moat", "Recurring funded income", "PE consolidator demand"],
    riskFactors: ["Staff-to-child ratio compliance", "Ofsted inspection risk", "Nursery manager key-man risk", "Lease renewal on property"],
    lenderAppetite: "Very strong — government-funded income treated as near-guaranteed by lenders.",
  },
  "pubs-and-restaurants": {
    displayName: "Pub & Restaurant",
    avgSdeMultiple: 2.5,
    avgAskingPrice: 380000,
    avgTurnover: 980000,
    avgNetProfit: 85000,
    avgAddBacks: 55000,
    avgProfitMargin: 0.087,
    leaseYearsRemaining: 6,
    marketCondition: "cooling",
    marketSummary: "Hospitality businesses are trading at the lowest multiples in the SME market — typically 1.8–2.8× SDE — reflecting post-pandemic cost pressures, energy cost exposure, and structural shift in consumer spending. Buyers with operational expertise can find significant value at these compressed multiples.",
    keyDrivers: ["Prime location value", "Alcohol licence premium", "Events & private hire upside", "Post-pandemic price corrections"],
    riskFactors: ["Energy & food cost inflation", "Consumer discretionary exposure", "Staff turnover", "Lease upward-only reviews"],
    lenderAppetite: "Cautious — lenders typically require 30–40% buyer equity minimum.",
  },
};

export const CITY_DATA: Record<City, CityData> = {
  "london": {
    displayName: "London",
    region: "Greater London",
    marketNote: "London commands the highest acquisition premiums in the UK market. Competition from PE-backed buyers and institutional acquirers drives multiples 15–25% above national averages.",
    premiumPct: 0.20,
  },
  "manchester": {
    displayName: "Manchester",
    region: "Greater Manchester",
    marketNote: "Manchester's Northern Powerhouse positioning and strong professional services ecosystem make it the premier regional M&A market outside London, with multiples broadly matching national benchmarks.",
    premiumPct: 0.05,
  },
  "birmingham": {
    displayName: "Birmingham",
    region: "West Midlands",
    marketNote: "Birmingham's post-Commonwealth Games profile and major infrastructure investment (HS2 terminal, HSBC HQ relocation) are attracting significant buyer interest in manufacturing and professional services.",
    premiumPct: 0.03,
  },
  "leeds": {
    displayName: "Leeds",
    region: "West Yorkshire",
    marketNote: "Leeds is the dominant financial services hub in the North, with a deep pool of accountancy practices, legal firms, and professional services SMEs attracting competitive bidding.",
    premiumPct: 0.02,
  },
  "glasgow": {
    displayName: "Glasgow",
    region: "Scotland",
    marketNote: "Glasgow offers some of the strongest value-for-money acquisitions in the UK, with multiples typically running 5–10% below English equivalents while offering access to Scottish Enterprise grant support.",
    premiumPct: -0.05,
  },
  "bristol": {
    displayName: "Bristol",
    region: "South West England",
    marketNote: "Bristol's technology, engineering, and aerospace cluster (Airbus, Rolls-Royce) makes it a premium market for technical SMEs, with buyer competition pushing valuations above national averages.",
    premiumPct: 0.08,
  },
  "liverpool": {
    displayName: "Liverpool",
    region: "Merseyside",
    marketNote: "Liverpool's port-focused logistics and distribution sector offers excellent value acquisitions, with multiples tracking at or slightly below national benchmarks.",
    premiumPct: -0.02,
  },
  "newcastle": {
    displayName: "Newcastle",
    region: "North East England",
    marketNote: "Newcastle benefits from significant freeport investment and manufacturing reshoring incentives, making it an increasingly attractive market for first-time buyers seeking value.",
    premiumPct: -0.07,
  },
};

/* ─── Mock Companies House records ───────────────────────────────────────── */
export interface MockCompany {
  name: string;
  number: string;
  incorporated: string;
  status: string;
  turnover: string;
  employees: string;
}

export function getMockCompanies(sector: Sector, city: City): MockCompany[] {
  const sectorLabel = SECTOR_DATA[sector].displayName;
  const cityLabel = CITY_DATA[city].displayName;
  return [
    {
      name: `${cityLabel} ${sectorLabel} Holdings Ltd`,
      number: `0${Math.abs(sector.charCodeAt(0) * city.charCodeAt(0)) % 9000000 + 1000000}`,
      incorporated: "2011-03-14",
      status: "Active",
      turnover: `£${((SECTOR_DATA[sector].avgTurnover * (1 + CITY_DATA[city].premiumPct)) / 1000).toFixed(0)}k`,
      employees: `${Math.floor(SECTOR_DATA[sector].avgTurnover / 80000)}`,
    },
    {
      name: `${cityLabel} ${sectorLabel} Group Limited`,
      number: `0${Math.abs((sector.charCodeAt(1) + 1) * (city.charCodeAt(1) + 1)) % 9000000 + 1000000}`,
      incorporated: "2015-07-22",
      status: "Active",
      turnover: `£${((SECTOR_DATA[sector].avgTurnover * 0.85 * (1 + CITY_DATA[city].premiumPct)) / 1000).toFixed(0)}k`,
      employees: `${Math.floor(SECTOR_DATA[sector].avgTurnover * 0.85 / 80000)}`,
    },
    {
      name: `${cityLabel} ${sectorLabel} Solutions Ltd`,
      number: `0${Math.abs((sector.charCodeAt(2) + 2) * (city.charCodeAt(2) + 2)) % 9000000 + 1000000}`,
      incorporated: "2018-11-05",
      status: "Active",
      turnover: `£${((SECTOR_DATA[sector].avgTurnover * 0.65 * (1 + CITY_DATA[city].premiumPct)) / 1000).toFixed(0)}k`,
      employees: `${Math.floor(SECTOR_DATA[sector].avgTurnover * 0.65 / 80000)}`,
    },
  ];
}

/* ─── Path param helpers ──────────────────────────────────────────────────── */
export function formatSectorDisplay(slug: string): string {
  return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function generateStaticParams() {
  const params: { "sector-business-in-city": string }[] = [];
  for (const sector of SECTORS) {
    for (const city of CITIES) {
      params.push({ "sector-business-in-city": `${sector}-business-in-${city}` });
    }
  }
  return params;
}
