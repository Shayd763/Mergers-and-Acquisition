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

// ─── Provider ─────────────────────────────────────────────────────────────── //

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [tier, setTierState] = useState<Tier>("explorer");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [triggeredFeature, setTriggeredFeature] = useState<string | null>(null);
  const [pdfExportCount, setPdfExportCount] = useState(0);
  const lastEmailRef = useRef<string | null>(null);

  // Per-user localStorage key so switching accounts doesn't leak tier
  const storageKey = session?.user?.email
    ? `triage_sub_${session.user.email}`
    : "triage_sub_guest";

  // When session loads, prefer the DB-backed tier from the session
  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated") {
      const email = session?.user?.email ?? null;
      // Reset to explorer whenever the logged-in user changes
      if (email !== lastEmailRef.current) {
        lastEmailRef.current = email;
        setTierState("explorer");
      }
      const sessionTier = (session as unknown as Record<string, unknown>)?.tier as Tier | undefined;
      if (sessionTier && ["explorer", "searcher", "broker", "institutional"].includes(sessionTier)) {
        setTierState(sessionTier);
        try { localStorage.setItem(storageKey, JSON.stringify({ tier: sessionTier })); } catch {}
      }
    } else {
      // Unauthenticated — try guest localStorage
      lastEmailRef.current = null;
      try {
        const stored = localStorage.getItem("triage_sub_guest");
        if (stored) {
          const { tier: t } = JSON.parse(stored) as { tier: Tier };
          if (["explorer", "searcher", "broker", "institutional"].includes(t)) setTierState(t);
        } else {
          setTierState("explorer");
        }
      } catch {}
    }
  }, [session, status, storageKey]);

  const setTier = useCallback((t: Tier) => {
    setTierState(t);
    try { localStorage.setItem(storageKey, JSON.stringify({ tier: t })); } catch {}
  }, [storageKey]);

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
