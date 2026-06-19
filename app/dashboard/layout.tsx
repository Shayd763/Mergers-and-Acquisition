"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DealProvider, useDealStore, dscrDot, simpleDscr, StoredDeal } from "./DealContext";
import { SubscriptionProvider, useSubscription, type Tier } from "@/app/components/SubscriptionContext";
import { useSession, signOut } from "next-auth/react";
import { UpgradeModal } from "@/app/components/UpgradeModal";
import { DevTierSwitcher } from "@/app/components/DevTierSwitcher";

/* ─── Deal context menu ──────────────────────────────────────────────────── */

interface MenuProps {
  deal: StoredDeal;
  onClose: () => void;
  onRename: () => void;
  anchorRect: DOMRect;
}

function DealMenu({ deal, onClose, onRename, anchorRect }: MenuProps) {
  const { deleteDeal, duplicateDeal, deals } = useDealStore();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const canDelete = deals.length > 1;

  // Close on outside click or Escape
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", keyHandler); };
  }, [onClose]);

  // Position: try to align below the anchor, flip up if near bottom
  const top = Math.min(anchorRect.bottom + 4, window.innerHeight - 200);
  const left = Math.min(anchorRect.left, window.innerWidth - 192);

  const items: { icon: string; label: string; danger?: boolean; disabled?: boolean; action: () => void }[] = [
    {
      icon: "✏️", label: "Rename",
      action: () => { onClose(); onRename(); },
    },
    {
      icon: "⧉", label: "Duplicate",
      action: () => { const id = duplicateDeal(deal.id); onClose(); router.push("/dashboard/triage"); void id; },
    },
    {
      icon: "📋", label: "Copy Deal ID",
      action: () => { navigator.clipboard?.writeText(deal.id).catch(() => {}); onClose(); },
    },
    {
      icon: "🗑️", label: "Delete Deal",
      danger: true,
      disabled: !canDelete,
      action: () => { if (!canDelete) return; deleteDeal(deal.id); onClose(); router.push("/dashboard/triage"); },
    },
  ];

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top,
        left,
        width: 188,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        boxShadow: "0 8px 30px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
        zIndex: 2000,
        overflow: "hidden",
        padding: "4px",
      }}
    >
      {/* Deal name header */}
      <div style={{ padding: "8px 10px 7px", borderBottom: "1px solid #f1f5f9", marginBottom: 2 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#334155", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {deal.name}
        </p>
        {deal.askingPrice > 0 && (
          <p style={{ fontSize: 10, color: "#94a3b8", margin: "1px 0 0" }}>
            £{deal.askingPrice >= 1_000_000 ? (deal.askingPrice / 1_000_000).toFixed(1) + "m" : Math.round(deal.askingPrice / 1_000) + "k"} asking
          </p>
        )}
      </div>

      {items.map(item => (
        <button
          key={item.label}
          onClick={item.action}
          disabled={item.disabled}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "8px 10px",
            border: "none",
            borderRadius: 7,
            background: "transparent",
            cursor: item.disabled ? "not-allowed" : "pointer",
            fontSize: 12.5,
            fontWeight: 500,
            color: item.disabled ? "#cbd5e1" : item.danger ? "#dc2626" : "#334155",
            textAlign: "left",
            transition: "background 0.1s",
          }}
          onMouseEnter={e => {
            if (!item.disabled) (e.currentTarget as HTMLElement).style.background = item.danger ? "#fef2f2" : "#f8fafc";
          }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <span style={{ fontSize: 13, width: 18, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
          {item.label}
          {item.label === "Delete Deal" && !canDelete && (
            <span style={{ fontSize: 9, color: "#94a3b8", marginLeft: "auto" }}>last deal</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── Deal item ──────────────────────────────────────────────────────────── */

function DealItem({ deal, isActive, onCloseSidebar }: { deal: StoredDeal; isActive: boolean; onCloseSidebar: () => void }) {
  const pathname = usePathname();
  const { setActiveDealId, updateDeal } = useDealStore();
  const router = useRouter();
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState(deal.name);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const [hovered, setHovered]       = useState(false);
  const inputRef                    = useRef<HTMLInputElement>(null);
  const dot                         = dscrDot(deal);
  const dscr                        = simpleDscr(deal);

  useEffect(() => {
    if (editing) { setDraft(deal.name); inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing, deal.name]);

  const commit = () => {
    updateDeal(deal.id, { name: draft.trim() || "Untitled Deal" });
    setEditing(false);
  };

  const handleClick = () => {
    if (editing) return;
    setActiveDealId(deal.id);
    onCloseSidebar();
    router.push("/dashboard/triage");
  };

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
    setMenuOpen(true);
  };

  return (
    <>
      <div
        onClick={handleClick}
        onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: "8px 8px 8px 10px",
          borderRadius: 8,
          cursor: "pointer",
          background: isActive && pathname === "/dashboard/triage" ? "#eef2ff" : hovered ? "#f8fafc" : "transparent",
          borderLeft: isActive && pathname === "/dashboard/triage" ? "2px solid #4f46e5" : "2px solid transparent",
          transition: "background 0.1s",
          userSelect: "none",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Name + meta */}
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setDraft(deal.name); } }}
                onClick={e => e.stopPropagation()}
                style={{
                  fontSize: 12, fontWeight: 600, color: "#0f172a",
                  background: "#fff", border: "1px solid #4f46e5",
                  borderRadius: 4, padding: "1px 6px", width: "100%", outline: "none", fontFamily: "inherit",
                }}
              />
            ) : (
              <p style={{ fontSize: 12, fontWeight: 600, color: isActive && pathname === "/dashboard/triage" ? "#3730a3" : "#334155", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {deal.name}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {deal.askingPrice > 0 && (
                <span style={{ fontSize: 10, color: "#94a3b8" }}>
                  £{deal.askingPrice >= 1_000_000 ? (deal.askingPrice / 1_000_000).toFixed(1) + "m" : Math.round(deal.askingPrice / 1_000) + "k"}
                </span>
              )}
              {deal.askingPrice > 0 && deal.netProfit > 0 && (
                <>
                  <span style={{ fontSize: 9, color: "#cbd5e1" }}>·</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: dot.color }}>{dscr > 0 ? `${dscr.toFixed(2)}×` : "—"}</span>
                </>
              )}
            </div>
          </div>

          {/* DSCR dot (hidden when options button is visible) */}
          {!hovered && !menuOpen ? (
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot.color, boxShadow: `0 0 0 3px ${dot.glow}`, flexShrink: 0 }} />
          ) : (
            /* Options ⋯ button */
            <button
              onClick={openMenu}
              style={{
                width: 24, height: 24, borderRadius: 6, border: "1px solid #e2e8f0",
                background: menuOpen ? "#f1f5f9" : "#fff",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 14, color: "#64748b", lineHeight: 1,
                transition: "background 0.1s, border-color 0.1s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#c7d2fe"; (e.currentTarget as HTMLElement).style.color = "#4f46e5"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
              title="Deal options"
              aria-label="Deal options"
            >
              ···
            </button>
          )}
        </div>
      </div>

      {menuOpen && menuAnchor && (
        <DealMenu
          deal={deal}
          anchorRect={menuAnchor}
          onClose={() => setMenuOpen(false)}
          onRename={() => setEditing(true)}
        />
      )}
    </>
  );
}

/* ─── User / account panel ───────────────────────────────────────────────── */

const TIER_META: Record<Tier, { label: string; color: string; bg: string }> = {
  explorer:      { label: "Explorer",       color: "#64748b", bg: "#f1f5f9" },
  searcher:      { label: "Active Searcher", color: "#4f46e5", bg: "#eef2ff" },
  broker:        { label: "Deal Broker",     color: "#7c3aed", bg: "#f5f3ff" },
  institutional: { label: "Institutional",   color: "#0891b2", bg: "#ecfeff" },
};

function UserAccountPanel() {
  const { tier, isPremium, openUpgradeModal } = useSubscription();
  const { data: session, status } = useSession();
  const router = useRouter();
  const meta = TIER_META[tier];

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";
  const initials = userName
    ? userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase();

  return (
    <div style={{ borderTop: "1px solid #e2e8f0", padding: "12px 10px 14px" }}>
      {!isLoggedIn ? (
        /* ── Guest: sign-in nudge ── */
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", margin: "0 0 8px 2px", lineHeight: 1.5 }}>
            Sign in to save your deals
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => router.push("/login")}
              style={{ flex: 1, fontSize: 11, fontWeight: 700, padding: "7px 0", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", cursor: "pointer" }}>
              Sign in
            </button>
            <button
              onClick={() => router.push("/signup")}
              style={{ flex: 1, fontSize: 11, fontWeight: 700, padding: "7px 0", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", cursor: "pointer" }}>
              Sign up free
            </button>
          </div>
          <button
            onClick={() => openUpgradeModal()}
            style={{ marginTop: 6, width: "100%", fontSize: 11, fontWeight: 600, padding: "7px 0", borderRadius: 7, border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4f46e5", cursor: "pointer" }}>
            View plans ↗
          </button>
        </div>
      ) : (
        /* ── Logged-in user ── */
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
            {session.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {initials}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName || userEmail}</p>
              <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/account")}
              style={{ fontSize: 10, color: "#6366f1", background: "none", border: "none", cursor: "pointer", padding: "3px 6px", borderRadius: 5, fontWeight: 600 }}
              title="Account settings">
              ⚙
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: meta.bg, border: `1px solid ${meta.color}22`, borderRadius: 8, padding: "6px 10px", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{meta.label}</span>
            {!isPremium && (
              <button
                onClick={() => openUpgradeModal()}
                style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                Upgrade ↗
              </button>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ width: "100%", fontSize: 11, fontWeight: 600, padding: "6px 0", borderRadius: 7, border: "1px solid #fee2e2", background: "transparent", color: "#dc2626", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Page transition wrapper ────────────────────────────────────────────── */

function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ flex: 1, overflow: "auto" }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}

/* ─── Inner shell (consumes context) ────────────────────────────────────── */

function FoundingMemberBanner() {
  const { openUpgradeModal } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem("founding_banner_dismissed") === "1") setDismissed(true); } catch {}
    setHydrated(true);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("founding_banner_dismissed", "1"); } catch {}
  };

  if (!hydrated || dismissed) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
      padding: "8px 16px", flexShrink: 0, flexWrap: "wrap", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>🎉</span>
        <p style={{ fontSize: 12, color: "#fff", margin: 0 }}>
          <strong>Founding Member Offer</strong> — £49/mo locked in forever. Price rises to £79 on <strong>1 August 2026</strong>.
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={() => openUpgradeModal()}
          style={{ fontSize: 11, fontWeight: 700, padding: "5px 13px", borderRadius: 6, border: "none", background: "#fff", color: "#4f46e5", cursor: "pointer", whiteSpace: "nowrap" }}>
          Claim offer →
        </button>
        <button onClick={dismiss} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 4px" }}>
          ✕
        </button>
      </div>
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { deals, activeDealId, createDeal } = useDealStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prevent body scroll + horizontal drift when sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleNewDeal = useCallback(() => {
    createDeal();
    setSidebarOpen(false);
    router.push("/dashboard/triage");
  }, [createDeal, router]);

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "#f8fafc" }}>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar${sidebarOpen ? " open" : ""}`}>
        {/* Logo */}
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #e2e8f0" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", letterSpacing: "-0.02em" }}>Triage Finance</span>
          </Link>
        </div>

        {/* Deal list */}
        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* Overview button */}
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 10px", marginBottom: 8, borderRadius: 8,
              textDecoration: "none", fontSize: 12, fontWeight: 700,
              color: pathname === "/dashboard" ? "#3730a3" : "#334155",
              background: pathname === "/dashboard" ? "#eef2ff" : "transparent",
              borderLeft: pathname === "/dashboard" ? "2px solid #4f46e5" : "2px solid transparent",
              transition: "background 0.1s",
            }}
            onMouseEnter={e => { if (pathname !== "/dashboard") (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
            onMouseLeave={e => { if (pathname !== "/dashboard") (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            Overview
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", marginBottom: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Deals
            </p>
            <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 9999, padding: "1px 7px", fontWeight: 700 }}>
              {deals.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {deals.map(deal => (
              <DealItem key={deal.id} deal={deal} isActive={deal.id === activeDealId} onCloseSidebar={() => setSidebarOpen(false)} />
            ))}
          </div>
        </nav>

        {/* New analysis CTA */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid #e2e8f0" }}>
          <button
            onClick={handleNewDeal}
            style={{
              width: "100%", padding: "9px 14px", borderRadius: 9,
              border: "1.5px dashed #c7d2fe", background: "transparent",
              color: "#4f46e5", fontSize: 12, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "background 0.12s, border-color 0.12s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#eef2ff"; (e.currentTarget as HTMLElement).style.borderColor = "#6366f1"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "#c7d2fe"; }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Analysis
          </button>
        </div>

        {/* User account panel */}
        <UserAccountPanel />
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{
          height: 52, background: "#fff", borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px 0 16px", gap: 10, flexShrink: 0,
        }}>
          {/* Hamburger — mobile only */}
          <button
            className="nav-mobile-btn"
            onClick={() => setSidebarOpen(o => !o)}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", flexDirection: "column", gap: 3, alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <span style={{ width: 16, height: 2, background: "#334155", borderRadius: 1, display: "block" }} />
            <span style={{ width: 16, height: 2, background: "#334155", borderRadius: 1, display: "block" }} />
            <span style={{ width: 12, height: 2, background: "#334155", borderRadius: 1, display: "block" }} />
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 9999, padding: "3px 10px", letterSpacing: "0.06em" }}>
            BETA
          </span>
          <Link href="/" style={{
            fontSize: 13, fontWeight: 600, color: "#64748b",
            textDecoration: "none", padding: "6px 12px", borderRadius: 8,
            border: "1px solid #e2e8f0", background: "#fff",
            transition: "background 0.12s",
          }}>
            ← Homepage
          </Link>
        </header>

        <FoundingMemberBanner />
        <PageTransition>{children}</PageTransition>
      </div>

      {/* Global upgrade modal */}
      <UpgradeModal />
      <DevTierSwitcher />
    </div>
  );
}

/* ─── Layout export ──────────────────────────────────────────────────────── */

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <DealProvider>
        <DashboardShell>{children}</DashboardShell>
      </DealProvider>
    </SubscriptionProvider>
  );
}
