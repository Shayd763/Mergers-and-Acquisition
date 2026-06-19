"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────── //

export type Tier = "explorer" | "searcher" | "broker" | "institutional";

export interface SubCtx {
  tier: Tier;
  isPremium: boolean;
  isAtLeast: (required: Tier) => boolean;
  setTier: (t: Tier) => void;
  openUpgradeModal: (feature?: string) => void;
  closeUpgradeModal: () => void;
  upgradeModalOpen: boolean;
  triggeredFeature: string | null;
  pdfExportCount: number;
  incrementPdfExport: () => void;
}

const TIER_RANK: Record<Tier, number> = {
  explorer: 0,
  searcher: 1,
  broker: 2,
  institutional: 3,
};

const Context = createContext<SubCtx>({
  tier: "explorer",
  isPremium: false,
  isAtLeast: () => false,
  setTier: () => {},
  openUpgradeModal: () => {},
  closeUpgradeModal: () => {},
  upgradeModalOpen: false,
  triggeredFeature: null,
  pdfExportCount: 0,
  incrementPdfExport: () => {},
});

const STORAGE_KEY = "triage_finance_sub_state";

// ─── Provider ─────────────────────────────────────────────────────────────── //

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [tier, setTierState] = useState<Tier>("explorer");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [triggeredFeature, setTriggeredFeature] = useState<string | null>(null);
  const [pdfExportCount, setPdfExportCount] = useState(0);
  const initialized = useRef(false);

  // On first mount, hydrate from localStorage
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { tier: t } = JSON.parse(stored) as { tier: Tier };
        if (["explorer", "searcher", "broker", "institutional"].includes(t)) {
          setTierState(t);
        }
      }
    } catch {}
  }, []);

  // When session loads, prefer the DB-backed tier from the session over localStorage
  useEffect(() => {
    if (status !== "authenticated") return;
    const sessionTier = (session as unknown as Record<string, unknown>)?.tier as Tier | undefined;
    if (sessionTier && ["explorer", "searcher", "broker", "institutional"].includes(sessionTier)) {
      setTierState(sessionTier);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ tier: sessionTier })); } catch {}
    }
  }, [session, status]);

  const setTier = useCallback((t: Tier) => {
    setTierState(t);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ tier: t })); } catch {}
  }, []);

  const isAtLeast = useCallback((required: Tier) => {
    return TIER_RANK[tier] >= TIER_RANK[required];
  }, [tier]);

  const openUpgradeModal = useCallback((feature?: string) => {
    setTriggeredFeature(feature ?? null);
    setUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false);
    setTriggeredFeature(null);
  }, []);

  const incrementPdfExport = useCallback(() => {
    setPdfExportCount(n => n + 1);
  }, []);

  const isPremium = tier !== "explorer";

  return (
    <Context.Provider value={{
      tier, isPremium, isAtLeast, setTier,
      openUpgradeModal, closeUpgradeModal, upgradeModalOpen, triggeredFeature,
      pdfExportCount, incrementPdfExport,
    }}>
      {children}
    </Context.Provider>
  );
}

export const useSubscription = () => useContext(Context);
