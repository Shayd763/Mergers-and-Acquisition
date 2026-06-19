"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { CompanyDetails } from "@/app/components/CompanySearch";
import type { ReconciliationResult } from "@/app/components/ForensicAuditPanel";
import type { CreditProfile } from "@/app/components/CreditProfileBadge";

export type { CompanyDetails, ReconciliationResult, CreditProfile };

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface ExtractedDeal {
  asking_price: number | null;
  turnover: number | null;
  net_profit: number | null;
  add_backs: number | null;
  lease_years_remaining: number | null;
  business_type: string | null;
  location: string | null;
  raw_confidence: "low" | "medium" | "high";
}

export type DealStatus = "Demo" | "In Review" | "Rejected" | "Pursuing" | "Analysed";

export interface StoredDeal {
  id: string;
  name: string;
  askingPrice: number;
  netProfit: number;
  addBacks: number;
  equityPct: number;
  vendorPct: number;
  bankPct: number;
  rawText: string;
  extracted: ExtractedDeal | null;
  /* Dashboard fields */
  status?: DealStatus;
  date?: string;
  location?: string;
  sector?: string;
  isDemo?: boolean;
  notes?: string;
  /* Step 1 persisted state */
  companyDetails?: CompanyDetails;
  reconciliation?: ReconciliationResult;
  creditProfile?: CreditProfile;
}

/* ─── Sidebar DSCR helpers ───────────────────────────────────────────────── */

export function simpleDscr(deal: StoredDeal): number {
  const sde = deal.netProfit + deal.addBacks;
  if (sde <= 0 || deal.askingPrice <= 0 || deal.bankPct <= 0) return 0;
  const bankLoan = deal.askingPrice * 1.05 * (deal.bankPct / 100);
  const r = 0.12;
  const n = 5;
  const annualService = bankLoan * (r / (1 - Math.pow(1 + r, -n)));
  return annualService > 0 ? sde / annualService : 99;
}

export function dscrDot(deal: StoredDeal): { color: string; glow: string } {
  if (deal.askingPrice === 0 && deal.netProfit === 0)
    return { color: "#94a3b8", glow: "#94a3b820" };
  const d = simpleDscr(deal);
  if (d >= 1.25) return { color: "#22c55e", glow: "#22c55e25" };
  if (d >= 1.0)  return { color: "#f59e0b", glow: "#f59e0b25" };
  return { color: "#ef4444", glow: "#ef444425" };
}

/* ─── Defaults ───────────────────────────────────────────────────────────── */

const DEFAULT_DEALS: StoredDeal[] = [
  {
    id: "d1", name: "Manchester Engineering Co.",
    askingPrice: 450000, netProfit: 120000, addBacks: 63000,
    equityPct: 30, vendorPct: 20, bankPct: 50,
    rawText: "Asking Price: £450,000\nTurnover: £820,000\nNet Profit: £120,000\nNormalized Adjustments: Owner salary £55,000, one-off legal costs £8,000\nLease: 7 years remaining on commercial premises\nLocation: Manchester\nBusiness type: Engineering consultancy, B2B contracts",
    extracted: { asking_price: 450000, turnover: 820000, net_profit: 120000, add_backs: 63000, lease_years_remaining: 7, business_type: "Engineering consultancy", location: "Manchester", raw_confidence: "high" },
    status: "Demo", date: "2026-06-14", location: "Manchester", sector: "Engineering", isDemo: true, notes: "",
  },
  {
    id: "d2", name: "London E-commerce Brand",
    askingPrice: 890000, netProfit: 160000, addBacks: 58000,
    equityPct: 30, vendorPct: 20, bankPct: 50,
    rawText: "", extracted: null,
    status: "Demo", date: "2026-06-12", location: "London", sector: "Retail / D2C", isDemo: true, notes: "",
  },
  {
    id: "d3", name: "Bristol Accountancy Practice",
    askingPrice: 320000, netProfit: 85000, addBacks: 42000,
    equityPct: 25, vendorPct: 20, bankPct: 55,
    rawText: "", extracted: null,
    status: "Demo", date: "2026-06-09", location: "Bristol", sector: "Prof. Services", isDemo: true, notes: "",
  },
  {
    id: "d4", name: "Leeds IT Support MSP",
    askingPrice: 620000, netProfit: 118000, addBacks: 50000,
    equityPct: 30, vendorPct: 20, bankPct: 50,
    rawText: "", extracted: null,
    status: "Demo", date: "2026-06-06", location: "Leeds", sector: "Technology", isDemo: true, notes: "",
  },
  {
    id: "d5", name: "Edinburgh Cleaning Services",
    askingPrice: 180000, netProfit: 62000, addBacks: 22000,
    equityPct: 30, vendorPct: 20, bankPct: 50,
    rawText: "", extracted: null,
    status: "Demo", date: "2026-06-03", location: "Edinburgh", sector: "Facilities", isDemo: true, notes: "",
  },
];

/* ─── Context ────────────────────────────────────────────────────────────── */

interface DealContextValue {
  deals: StoredDeal[];
  activeDealId: string;
  activeDeal: StoredDeal | undefined;
  hydrated: boolean;
  setActiveDealId: (id: string) => void;
  updateDeal: (id: string, patch: Partial<StoredDeal>) => void;
  createDeal: () => string;
  deleteDeal: (id: string) => void;
  duplicateDeal: (id: string) => string;
}

const DealContext = createContext<DealContextValue | null>(null);

export function DealProvider({ children }: { children: React.ReactNode }) {
  const [deals, setDeals] = useState<StoredDeal[]>(DEFAULT_DEALS);
  const [activeDealId, setActiveDealIdRaw] = useState<string>(DEFAULT_DEALS[0].id);
  const [hydrated, setHydrated] = useState(false);

  /* Load from localStorage once on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("triage_finance_deals");
      if (saved) {
        const parsed: StoredDeal[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDeals(parsed);
          setActiveDealIdRaw(parsed[0].id);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  /* Persist to localStorage whenever deals change (after hydration) */
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("triage_finance_deals", JSON.stringify(deals)); } catch {}
  }, [deals, hydrated]);

  const setActiveDealId = useCallback((id: string) => setActiveDealIdRaw(id), []);

  const updateDeal = useCallback((id: string, patch: Partial<StoredDeal>) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }, []);

  const createDeal = useCallback((): string => {
    const id = `d${Date.now()}`;
    const fresh: StoredDeal = {
      id, name: "Untitled Deal",
      askingPrice: 0, netProfit: 0, addBacks: 0,
      equityPct: 30, vendorPct: 20, bankPct: 50,
      rawText: "", extracted: null,
    };
    setDeals(prev => [fresh, ...prev]);
    setActiveDealIdRaw(id);
    return id;
  }, []);

  const deleteDeal = useCallback((id: string) => {
    setDeals(prev => {
      const next = prev.filter(d => d.id !== id);
      // If we deleted the active deal, switch to the first remaining one
      if (id === activeDealId) {
        const fallback = next[0];
        if (fallback) setActiveDealIdRaw(fallback.id);
      }
      // Always keep at least one deal
      if (next.length === 0) {
        const fresh: StoredDeal = {
          id: `d${Date.now()}`, name: "Untitled Deal",
          askingPrice: 0, netProfit: 0, addBacks: 0,
          equityPct: 30, vendorPct: 20, bankPct: 50,
          rawText: "", extracted: null,
        };
        setActiveDealIdRaw(fresh.id);
        return [fresh];
      }
      return next;
    });
  }, [activeDealId]);

  const duplicateDeal = useCallback((id: string): string => {
    const newId = `d${Date.now()}`;
    setDeals(prev => {
      const src = prev.find(d => d.id === id);
      if (!src) return prev;
      const copy: StoredDeal = { ...src, id: newId, name: `${src.name} (copy)` };
      const idx = prev.findIndex(d => d.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setActiveDealIdRaw(newId);
    return newId;
  }, []);

  const activeDeal = deals.find(d => d.id === activeDealId);

  return (
    <DealContext.Provider value={{ deals, activeDealId, activeDeal, hydrated, setActiveDealId, updateDeal, createDeal, deleteDeal, duplicateDeal }}>
      {children}
    </DealContext.Provider>
  );
}

export function useDealStore() {
  const ctx = useContext(DealContext);
  if (!ctx) throw new Error("useDealStore must be used within DealProvider");
  return ctx;
}
