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

  // Position: align below anchor, keep within viewport on all screen sizes
  const menuWidth = 200;
  const top = Math.min(anchorRect.bottom + 4, window.innerHeight - 220);
  const left = Math.min(
    Math.max(8, anchorRect.left),
    window.innerWidth - menuWidth - 8
  );

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
        width: menuWidth,
        background: "#fff",
        border: "1px solid #d6d3d1",
        borderRadius: 10,
        boxShadow: "0 8px 30px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
        zIndex: 2000,
        overflow: "hidden",
        padding: "4px",
      }}
    >
      {/* Deal name header */}
      <div style={{ padding: "8px 10px 7px", borderBottom: "1px solid #e7e5e4", marginBottom: 2 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#44403c", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {deal.name}
        </p>
        {deal.askingPrice > 0 && (
          <p style={{ fontSize: 10, color: "#a8a29e", margin: "1px 0 0" }}>
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
            color: item.disabled ? "#d6d3d1" : item.danger ? "#dc2626" : "#44403c",
            textAlign: "left",
            transition: "background 0.1s",
          }}
          onMouseEnter={e => {
            if (!item.disabled) (e.currentTarget as HTMLElement).style.background = item.danger ? "#fef2f2" : "#faf9f7";
          }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <span style={{ fontSize: 13, width: 18, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
          {item.label}
          {item.label === "Delete Deal" && !canDelete && (
            <span style={{ fontSize: 9, color: "#a8a29e", marginLeft: "auto" }}>last deal</span>
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
          background: isActive && pathname === "/dashboard/triage" ? "#e7e5e4" : hovered ? "#faf9f7" : "transparent",
          borderLeft: isActive && pathname === "/dashboard/triage" ? "2px solid #1c1917" : "2px solid transparent",
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
                  fontSize: 12, fontWeight: 600, color: "#1c1917",
                  background: "#fff", border: "1px solid #1c1917",
                  borderRadius: 4, padding: "1px 6px", width: "100%", outline: "none", fontFamily: "inherit",
                }}
              />
            ) : (
              <p style={{ fontSize: 12, fontWeight: 600, color: isActive && pathname === "/dashboard/triage" ? "#3730a3" : "#44403c", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {deal.name}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {deal.askingPrice > 0 && (
                <span style={{ fontSize: 10, color: "#a8a29e" }}>
                  £{deal.askingPrice >= 1_000_000 ? (deal.askingPrice / 1_000_000).toFixed(1) + "m" : Math.round(deal.askingPrice / 1_000) + "k"}
                </span>
              )}
              {deal.askingPrice > 0 && deal.netProfit > 0 && (
                <>
                  <span style={{ fontSize: 9, color: "#d6d3d1" }}>·</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: dot.color }}>{dscr > 0 ? `${dscr.toFixed(2)}×` : "—"}</span>
                </>
              )}
            </div>
          </div>

          {/* Options ⋯ button — always visible on touch, hover-only on desktop */}
          <button
            onClick={openMenu}
            style={{
              width: 32, height: 32, borderRadius: 6, border: "1px solid #d6d3d1",
              background: menuOpen ? "#e7e5e4" : "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: 14, color: "#78716c", lineHeight: 1,
              opacity: hovered || menuOpen ? 1 : 0,
              transition: "opacity 0.1s, background 0.1s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#d6d3d1"; (e.currentTarget as HTMLElement).style.color = "#1c1917"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#d6d3d1"; (e.currentTarget as HTMLElement).style.color = "#78716c"; }}
            onTouchStart={e => { e.currentTarget.style.opacity = "1"; }}
            title="Deal options"
            aria-label="Deal options"
          >
            ···
          </button>
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
  explorer:      { label: "Explorer",       color: "#6b7280", bg: "#f3f4f6" },
  searcher:      { label: "Active Searcher", color: "#166534", bg: "#dcfce7" },
  broker:        { label: "Deal Broker",     color: "#14532d", bg: "#bbf7d0" },
  institutional: { label: "Institutional",   color: "#0891b2", bg: "#e0f2fe" },
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
    <div style={{ borderTop: "1px solid #d6d3d1", padding: "12px 10px 14px" }}>
      {!isLoggedIn ? (
        /* ── Guest: sign-in nudge ── */
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#a8a29e", margin: "0 0 8px 2px", lineHeight: 1.5 }}>
            Sign in to save your deals
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => router.push("/login")}
              style={{ flex: 1, fontSize: 11, fontWeight: 700, padding: "7px 0", borderRadius: 7, border: "1px solid #d6d3d1", background: "#fff", color: "#44403c", cursor: "pointer" }}>
              Sign in
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="btn-glass"
              style={{ flex: 1, fontSize: 11, padding: "7px 0", borderRadius: 7 }}>
              Sign up free
            </button>
          </div>
          <button
            onClick={() => openUpgradeModal()}
            style={{ marginTop: 6, width: "100%", fontSize: 11, fontWeight: 600, padding: "7px 0", borderRadius: 7, border: "1px solid #d6d3d1", background: "#e7e5e4", color: "#1c1917", cursor: "pointer" }}>
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
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {initials}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1c1917", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName || userEmail}</p>
              <p style={{ fontSize: 10, color: "#a8a29e", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/account")}
              style={{ fontSize: 14, color: "#1c1917", background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: 8, fontWeight: 600, minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
              title="Account settings"
              aria-label="Account settings">
              ⚙
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: meta.bg, border: `1px solid ${meta.color}22`, borderRadius: 8, padding: "6px 10px", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{meta.label}</span>
            {!isPremium && (
              <button
                onClick={() => openUpgradeModal()}
                style={{ fontSize: 10, fontWeight: 700, color: "#1c1917", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", textDecoration: "underline", minHeight: 32 }}>
                Upgrade ↗
              </button>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ width: "100%", fontSize: 11, fontWeight: 600, padding: "10px 0", borderRadius: 7, border: "1px solid #fee2e2", background: "transparent", color: "#dc2626", cursor: "pointer", minHeight: 40 }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Top bar ────────────────────────────────────────────────────────────── */

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/triage": "Deal Analysis",
  "/dashboard/account": "Account",
};

function TopBar({ onOpenSidebar, pathname }: { onOpenSidebar: () => void; pathname: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";
  const initials = userName
    ? userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase();
  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header style={{
      height: 52, background: "#fff", borderBottom: "1px solid #d6d3d1",
      display: "flex", alignItems: "center",
      padding: "0 12px", gap: 10, flexShrink: 0,
    }}>
      {/* Hamburger — mobile only */}
      <button
        className="nav-mobile-btn"
        onClick={onOpenSidebar}
        aria-label="Open menu"
        style={{
          width: 36, height: 36, borderRadius: 8,
          border: "1px solid #d6d3d1", background: "transparent",
          cursor: "pointer", display: "flex", flexDirection: "column",
          gap: 4, alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <span style={{ width: 15, height: 1.5, background: "#475569", borderRadius: 1, display: "block" }} />
        <span style={{ width: 15, height: 1.5, background: "#475569", borderRadius: 1, display: "block" }} />
        <span style={{ width: 10, height: 1.5, background: "#475569", borderRadius: 1, display: "block" }} />
      </button>

      {/* Logo — mobile only center */}
      <div className="nav-mobile-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", pointerEvents: "auto" }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BarChart3 size={12} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#1c1917", letterSpacing: "-0.02em" }}>Acquisition Exchange</span>
        </Link>
      </div>

      {/* Page title — desktop only */}
      <div className="nav-desktop-links" style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1c1917", margin: 0 }}>{pageTitle}</p>
      </div>

      {/* Right side — desktop: BETA + back to site */}
      <div className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#1c1917", background: "#e7e5e4", border: "1px solid #d6d3d1", borderRadius: 9999, padding: "2px 8px", letterSpacing: "0.07em" }}>
          BETA
        </span>
        <Link href="/" style={{ fontSize: 12, fontWeight: 600, color: "#78716c", textDecoration: "none", padding: "5px 10px", borderRadius: 7, border: "1px solid #d6d3d1", whiteSpace: "nowrap", transition: "background 0.1s" }}>
          ← Site
        </Link>
      </div>

      {/* Home button — mobile only */}
      <Link
        href="/"
        className="nav-mobile-btn"
        aria-label="Homepage"
        style={{
          width: 32, height: 32, borderRadius: 8, border: "1px solid #d6d3d1",
          background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, color: "#78716c", textDecoration: "none",
        }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
        </svg>
      </Link>

      {/* Right side — mobile: user avatar */}
      <div className="nav-mobile-btn" style={{ flexShrink: 0 }}>
        {isLoggedIn ? (
          <button
            onClick={() => router.push("/dashboard/account")}
            aria-label="Account"
            style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #d6d3d1", background: "transparent", padding: 0, cursor: "pointer", overflow: "hidden", flexShrink: 0 }}
          >
            {session.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>
                {initials}
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={() => router.push("/login")}
            style={{ fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#166534,#14532d)", color: "#fff", cursor: "pointer" }}>
            Sign in
          </button>
        )}
      </div>
    </header>
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
      background: "linear-gradient(90deg,#166534,#14532d)",
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
          className="btn-glass"
          style={{ fontSize: 11, padding: "5px 13px", borderRadius: 6, whiteSpace: "nowrap" }}>
          Claim offer →
        </button>
        <button onClick={dismiss} aria-label="Dismiss" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "8px", minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "#faf9f7" }}>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar${sidebarOpen ? " open" : ""}`}>
        {/* Logo */}
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #d6d3d1" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#166534,#14532d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1c1917", letterSpacing: "-0.02em" }}>Acquisition Exchange</span>
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
              color: pathname === "/dashboard" ? "#3730a3" : "#44403c",
              background: pathname === "/dashboard" ? "#e7e5e4" : "transparent",
              borderLeft: pathname === "/dashboard" ? "2px solid #1c1917" : "2px solid transparent",
              transition: "background 0.1s",
            }}
            onMouseEnter={e => { if (pathname !== "/dashboard") (e.currentTarget as HTMLElement).style.background = "#faf9f7"; }}
            onMouseLeave={e => { if (pathname !== "/dashboard") (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            Overview
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", marginBottom: 6 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Deals
            </p>
            <span style={{ fontSize: 10, color: "#78716c", background: "#e7e5e4", border: "1px solid #d6d3d1", borderRadius: 9999, padding: "1px 7px", fontWeight: 700 }}>
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
        <div style={{ padding: "12px 10px", borderTop: "1px solid #d6d3d1" }}>
          <button
            onClick={handleNewDeal}
            className="btn-glass"
            style={{ width: "100%", padding: "9px 14px", borderRadius: 9, fontSize: 12, justifyContent: "center" }}
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
        <TopBar onOpenSidebar={() => setSidebarOpen(o => !o)} pathname={pathname} />


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
