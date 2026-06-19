"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlossaryTerm } from "@/app/components/GlossaryTerm";
import { useDealStore, simpleDscr, StoredDeal, DealStatus } from "./DealContext";

type SortKey = "name" | "askingPrice" | "multiple" | "dscr" | "date";
type SortDir = "asc" | "desc";

const ALL_STATUSES: DealStatus[] = ["Pursuing", "Saved", "In Review", "Analysed", "Rejected", "Demo"];

const STATUS_STYLE: Record<DealStatus, { bg: string; color: string; border: string }> = {
  Pursuing:    { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
  Saved:       { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  "In Review": { bg: "#eff6ff", color: "#3b82f6", border: "#bfdbfe" },
  Analysed:    { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
  Rejected:    { bg: "#fef2f2", color: "#ef4444", border: "#fecaca" },
  Demo:        { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
};

const fmt = (n: number) =>
  n >= 1_000_000 ? `£${(n / 1_000_000).toFixed(1)}m` : `£${(n / 1000).toFixed(0)}k`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });

function dealMultiple(d: StoredDeal): number {
  const sde = d.netProfit + d.addBacks;
  if (sde <= 0 || d.askingPrice <= 0) return 0;
  return d.askingPrice / sde;
}

function dealLocation(d: StoredDeal): string {
  return d.location || d.extracted?.location || "—";
}

function sicToSector(codes: string[]): string {
  if (!codes?.length) return "";
  const n = parseInt(codes[0], 10);
  if (n >= 1000  && n <= 3999)  return "Agriculture / Fishing";
  if (n >= 5000  && n <= 9999)  return "Mining & Extraction";
  if (n >= 10000 && n <= 33999) return "Manufacturing";
  if (n >= 35000 && n <= 39999) return "Utilities";
  if (n >= 41000 && n <= 43999) return "Construction";
  if (n >= 45000 && n <= 45999) return "Motor Trades";
  if (n >= 46000 && n <= 46999) return "Wholesale";
  if (n >= 47000 && n <= 47999) return "Retail";
  if (n >= 49000 && n <= 53999) return "Transport & Logistics";
  if (n >= 55000 && n <= 56999) return "Hospitality";
  if (n >= 58000 && n <= 63999) return "Technology / Media";
  if (n >= 64000 && n <= 66999) return "Financial Services";
  if (n >= 68000 && n <= 68999) return "Real Estate";
  if (n >= 69000 && n <= 75999) return "Prof. Services";
  if (n >= 77000 && n <= 82999) return "Business Services";
  if (n >= 85000 && n <= 85999) return "Education";
  if (n >= 86000 && n <= 88999) return "Healthcare";
  if (n >= 90000 && n <= 93999) return "Arts & Entertainment";
  if (n >= 94000 && n <= 96999) return "Facilities / Personal Svcs";
  return "";
}

function dealSector(d: StoredDeal): string {
  // Prefer backend sic_description, then re-derive from stored SIC codes (fixes stale frontend mappings), then fallback
  return d.companyDetails?.sic_description
    || (d.companyDetails?.sic_codes?.length ? sicToSector(d.companyDetails.sic_codes) : null)
    || d.sector
    || d.extracted?.business_type
    || "—";
}

// ── Status dropdown ──────────────────────────────────────────────────────────
function StatusCell({ status, onChange }: { status: DealStatus; onChange: (s: DealStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = STATUS_STYLE[status];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 8px", borderRadius: 5,
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
      }}>
        {status}
        <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", left: 0, zIndex: 200,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)", minWidth: 128, overflow: "hidden",
        }}>
          {ALL_STATUSES.map(st => {
            const ss = STATUS_STYLE[st];
            return (
              <button key={st} onClick={() => { onChange(st); setOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 7, width: "100%",
                padding: "7px 11px", background: st === status ? "#f8fafc" : "#fff",
                border: "none", cursor: "pointer", fontSize: 11, fontWeight: st === status ? 700 : 500,
                color: ss.color, textAlign: "left",
              }}
                onMouseEnter={e => { if (st !== status) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                onMouseLeave={e => { if (st !== status) (e.currentTarget as HTMLElement).style.background = "#fff"; }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: ss.color, flexShrink: 0 }} />
                {st}
                {st === status && <svg style={{ marginLeft: "auto" }} width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Row action menu ──────────────────────────────────────────────────────────
function RowMenu({ onDelete, onNotes, onOpen, onShare }: { onDelete: () => void; onNotes: () => void; onOpen: () => void; onShare: () => void }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 28, height: 28, borderRadius: 7,
          border: `1px solid ${open || hovered ? "#c7d2fe" : "transparent"}`,
          background: open ? "#eef2ff" : hovered ? "#f5f3ff" : "transparent",
          cursor: "pointer", color: open || hovered ? "#4f46e5" : "#94a3b8",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, lineHeight: 1, transition: "all 0.12s",
          letterSpacing: "0.05em",
        }}
        title="Deal options"
      >
        •••
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 200,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
          minWidth: 160, overflow: "hidden", padding: "4px",
        }}>
          {[
            { label: "Open analysis", icon: "↗", key: "open" },
            { label: "Share deal link", icon: "🔗", key: "share" },
            { label: "Edit notes",    icon: "✏", key: "notes" },
            { label: "Remove deal",   icon: "🗑", key: "delete", danger: true },
          ].map(item => (
            <button key={item.key} onClick={() => {
              setOpen(false);
              if (item.key === "open") onOpen();
              if (item.key === "share") onShare();
              if (item.key === "delete") onDelete();
              if (item.key === "notes") onNotes();
            }} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "7px 10px", background: "transparent", border: "none",
              borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 500,
              color: (item as { danger?: boolean }).danger ? "#ef4444" : "#334155",
              textAlign: "left", transition: "background 0.1s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = (item as { danger?: boolean }).danger ? "#fef2f2" : "#f5f3ff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ fontSize: 13, width: 16, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sortable + filterable column header ──────────────────────────────────────
function ColHeader({
  label, sortKey, currentSort, currentDir, onSort,
  filterOptions, filterValue, onFilter,
}: {
  label: React.ReactNode; sortKey?: SortKey;
  currentSort: SortKey | null; currentDir: SortDir; onSort: (k: SortKey) => void;
  filterOptions?: string[]; filterValue?: string; onFilter?: (v: string) => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = sortKey && currentSort === sortKey;

  useEffect(() => {
    if (!filterOpen) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setFilterOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [filterOpen]);

  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 4, userSelect: "none" }}>
      {sortKey ? (
        <button onClick={() => onSort(sortKey)} style={{
          display: "flex", alignItems: "center", gap: 3,
          background: "none", border: "none", cursor: "pointer", padding: 0,
          fontSize: 11, fontWeight: 600, color: active ? "var(--accent)" : "var(--muted)",
          textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
        }}>
          {label}
          <span style={{ opacity: active ? 1 : 0.35, fontSize: 9 }}>
            {active ? (currentDir === "asc" ? "▲" : "▼") : "⬍"}
          </span>
        </button>
      ) : (
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{label}</span>
      )}
      {filterOptions && onFilter && (
        <div style={{ position: "relative" }}>
          <button onClick={() => setFilterOpen(o => !o)} title="Filter" style={{
            width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
            background: filterValue ? "var(--accent)" : "none", border: filterValue ? "none" : "1px solid #d1d5db",
            borderRadius: 3, cursor: "pointer", padding: 0, flexShrink: 0,
          }}>
            <svg width="8" height="8" viewBox="0 0 10 10" fill={filterValue ? "#fff" : "#94a3b8"}>
              <path d="M1 2h8L6 5.5V9L4 8V5.5L1 2z" />
            </svg>
          </button>
          {filterOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 300,
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
              boxShadow: "0 6px 20px rgba(0,0,0,0.1)", minWidth: 130, overflow: "hidden",
            }}>
              {["All", ...filterOptions].map(opt => (
                <button key={opt} onClick={() => { onFilter(opt === "All" ? "" : opt); setFilterOpen(false); }} style={{
                  display: "flex", alignItems: "center", gap: 7, width: "100%",
                  padding: "7px 11px", background: (filterValue === opt || (opt === "All" && !filterValue)) ? "#f0f4ff" : "#fff",
                  border: "none", cursor: "pointer", fontSize: 11,
                  fontWeight: (filterValue === opt || (opt === "All" && !filterValue)) ? 700 : 400,
                  color: (filterValue === opt || (opt === "All" && !filterValue)) ? "var(--accent)" : "#334155",
                  textAlign: "left",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = (filterValue === opt || (opt === "All" && !filterValue)) ? "#f0f4ff" : "#fff"; }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { deals, updateDeal, deleteDeal, setActiveDealId, hydrated } = useDealStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBankable, setFilterBankable] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [toast, setToast]               = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const shareDeal = (deal: StoredDeal) => {
    const summary = [
      deal.name,
      deal.askingPrice > 0 ? `£${(deal.askingPrice/1000).toFixed(0)}k asking` : "",
      deal.sector ?? "",
      deal.location ?? "",
    ].filter(Boolean).join(" · ");
    const url = `${window.location.origin}/dashboard?deal=${encodeURIComponent(deal.id)}&ref=share`;
    const text = `${summary}\n${url}`;
    navigator.clipboard?.writeText(text).then(() => showToast("Share link copied!")).catch(() => showToast("Link: " + url));
  };

  const updateStatus = (id: string, status: DealStatus) => updateDeal(id, { status });
  const updateNotes  = (id: string, notes: string)      => updateDeal(id, { notes });

  const onSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  let rows = deals.filter(d => {
    const q = search.toLowerCase();
    if (q && !d.name.toLowerCase().includes(q) && !dealSector(d).toLowerCase().includes(q) && !dealLocation(d).toLowerCase().includes(q)) return false;
    const st = d.status ?? "In Review";
    if (filterStatus && st !== filterStatus) return false;
    const dscr = simpleDscr(d);
    if (filterBankable === "Yes" && dscr < 1.25) return false;
    if (filterBankable === "No" && dscr >= 1.25) return false;
    return true;
  });

  if (sortKey) {
    rows = [...rows].sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0;
      if (sortKey === "name")        { av = a.name; bv = b.name; }
      if (sortKey === "askingPrice") { av = a.askingPrice; bv = b.askingPrice; }
      if (sortKey === "multiple")    { av = dealMultiple(a); bv = dealMultiple(b); }
      if (sortKey === "dscr")        { av = simpleDscr(a); bv = simpleDscr(b); }
      if (sortKey === "date")        { av = a.date ?? ""; bv = b.date ?? ""; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  const pursuing    = deals.filter(d => d.status === "Pursuing").length;
  const bankable    = deals.filter(d => simpleDscr(d) >= 1.25).length;
  const avgMultiple = deals.length
    ? (deals.reduce((s, d) => s + dealMultiple(d), 0) / deals.length).toFixed(1) : "—";
  const allDemo     = deals.every(d => d.isDemo);
  const editingDeal = editingNotes ? deals.find(d => d.id === editingNotes) : null;

  if (!hydrated) return null;

  if (deals.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>📋</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>No deals yet</h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0, maxWidth: 340 }}>
          Run your first deal analysis to start building your acquisition pipeline.
        </p>
        <Link href="/dashboard/triage" style={{
          textDecoration: "none", padding: "10px 20px",
          background: "#6366f1", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700,
        }}>+ Analyse a deal</Link>
      </div>
    );
  }

  return (
    <div className="dash-pad" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <style>{`@keyframes toast-in { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>

      {/* Demo banner */}
      {allDemo && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "linear-gradient(135deg,#fffbeb,#fef3c7)",
          border: "1px solid #fde68a", borderRadius: 9,
          padding: "9px 14px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>🧪</span>
          <p style={{ fontSize: 12, color: "#92400e", margin: 0, flex: 1 }}>
            <strong>Demo data</strong> — illustrative examples only. Run a real analysis to populate your pipeline.
          </p>
          <Link href="/dashboard/triage" style={{
            flexShrink: 0, textDecoration: "none", padding: "6px 12px",
            background: "#d97706", color: "#fff", borderRadius: 7, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
          }}>+ New deal</Link>
        </div>
      )}

      {/* Finance CTA — shows when non-demo bankable deals exist */}
      {(() => {
        const bankableReal = deals.filter(d => !d.isDemo && simpleDscr(d) >= 1.25);
        if (bankableReal.length === 0) return null;
        return (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between",
            background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)",
            borderRadius: 10, padding: "14px 18px", marginBottom: 16, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>🏦</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", margin: "0 0 2px" }}>
                  {bankableReal.length} deal{bankableReal.length > 1 ? "s" : ""} ready for lender submission
                </p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                  Get matched with OakNorth, ThinCats &amp; other SME acquisition lenders — no cost to you
                </p>
              </div>
            </div>
            <button
              onClick={() => { setActiveDealId(bankableReal[0].id); router.push("/dashboard/triage"); }}
              style={{
                flexShrink: 0, fontSize: 12, fontWeight: 700, padding: "9px 16px", borderRadius: 8,
                background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff",
                border: "none", cursor: "pointer",
                boxShadow: "0 4px 12px rgba(79,70,229,0.40)",
              }}>
              Submit to lenders →
            </button>
          </div>
        );
      })()}

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>Overview</h1>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>
            {deals.length} deals · {pursuing} pursuing · {bankable} bankable
          </p>
        </div>
        <Link href="/dashboard/triage" className="btn-primary" style={{ fontSize: 12 }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Analysis
        </Link>
      </div>

      {/* Stats strip */}
      <div className="dash-stats">
        {[
          { label: "Total Deals",      value: String(deals.length) },
          { label: "Avg Multiple",     value: `${avgMultiple}×` },
          { label: "Bankable ≥ 1.25×", value: `${bankable}/${deals.length}` },
          { label: "Pursuing",         value: String(pursuing) },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card" style={{ padding: 0, overflow: "visible" }}>

        {/* Table toolbar */}
        <div className="dash-toolbar">
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Deal Comparison</span>
            <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 10 }}>Click status to change · ⋯ to edit or remove</span>
          </div>
          <input
            type="text" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="input" style={{ width: 160, padding: "5px 10px", fontSize: 12 }}
          />
        </div>

        <div className="dash-table-wrap">
        <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "5%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "8px 12px", textAlign: "left" }}>
                <ColHeader label="Business" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
              </th>
              <th className="dash-col-hide" style={{ padding: "8px 10px", textAlign: "left" }}>
                <ColHeader label="Location" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
              </th>
              <th className="dash-col-hide" style={{ padding: "8px 10px", textAlign: "left" }}>
                <ColHeader label="Sector" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
              </th>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>
                <ColHeader label="Price" sortKey="askingPrice" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
              </th>
              <th className="dash-col-hide" style={{ padding: "8px 10px", textAlign: "left" }}>
                <ColHeader label="Multi" sortKey="multiple" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
              </th>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>
                <ColHeader label={<GlossaryTerm term="DSCR" />} sortKey="dscr" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
              </th>
              <th className="dash-col-hide" style={{ padding: "8px 10px", textAlign: "left" }}>
                <ColHeader
                  label="Bankable" currentSort={sortKey} currentDir={sortDir} onSort={onSort}
                  filterOptions={["Yes", "No"]} filterValue={filterBankable} onFilter={setFilterBankable}
                />
              </th>
              <th style={{ padding: "8px 10px", textAlign: "left" }}>
                <ColHeader
                  label="Status" currentSort={sortKey} currentDir={sortDir} onSort={onSort}
                  filterOptions={ALL_STATUSES} filterValue={filterStatus} onFilter={setFilterStatus}
                />
              </th>
              <th className="dash-col-hide" style={{ padding: "8px 10px", textAlign: "left" }}>
                <ColHeader label="Date" sortKey="date" currentSort={sortKey} currentDir={sortDir} onSort={onSort} />
              </th>
              <th style={{ padding: "8px 10px" }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={10} style={{ padding: "24px", textAlign: "center", fontSize: 13, color: "var(--muted)" }}>No deals match your filters.</td></tr>
            )}
            {rows.map((deal, i) => {
              const dscr = simpleDscr(deal);
              const multiple = dealMultiple(deal);
              const status = deal.status ?? "In Review";
              const date = deal.date ?? "";
              return (
                <tr key={deal.id}
                  style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border-light)" : "none", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  {/* Business */}
                  <td style={{ padding: "10px 12px", overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                      {deal.isDemo && (
                        <span style={{ fontSize: 8, fontWeight: 700, color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 3, padding: "1px 4px", flexShrink: 0 }}>DEMO</span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={deal.name}>{deal.name}</span>
                      {deal.notes && <span title={deal.notes} style={{ fontSize: 10, color: "#94a3b8", cursor: "default" }}>📝</span>}
                    </div>
                  </td>
                  {/* Location */}
                  <td className="dash-col-hide" style={{ padding: "10px 10px" }}>
                    <span style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{dealLocation(deal)}</span>
                  </td>
                  {/* Sector */}
                  <td className="dash-col-hide" style={{ padding: "10px 10px" }}>
                    <span style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{dealSector(deal)}</span>
                  </td>
                  {/* Asking price */}
                  <td style={{ padding: "10px 10px" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {deal.askingPrice > 0 ? fmt(deal.askingPrice) : "—"}
                    </span>
                  </td>
                  {/* Multiple */}
                  <td className="dash-col-hide" style={{ padding: "10px 10px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: multiple > 0 ? (multiple <= 3.5 ? "var(--success)" : "#d97706") : "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                      {multiple > 0 ? `${multiple.toFixed(1)}×` : "—"}
                    </span>
                  </td>
                  {/* DSCR */}
                  <td style={{ padding: "10px 10px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: dscr > 0 ? (dscr >= 1.25 ? "var(--success)" : "var(--danger)") : "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                      {dscr > 0 ? `${dscr.toFixed(2)}×` : "—"}
                    </span>
                  </td>
                  {/* Bankable */}
                  <td className="dash-col-hide" style={{ padding: "10px 10px" }}>
                    {dscr > 0
                      ? dscr >= 1.25
                        ? <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 4, padding: "2px 6px" }}>✓ Yes</span>
                        : <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, padding: "2px 6px" }}>✗ No</span>
                      : <span style={{ fontSize: 10, color: "var(--muted)" }}>—</span>
                    }
                  </td>
                  {/* Status */}
                  <td style={{ padding: "10px 10px" }}>
                    <StatusCell status={status} onChange={s => updateStatus(deal.id, s)} />
                  </td>
                  {/* Date */}
                  <td className="dash-col-hide" style={{ padding: "10px 10px" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{date ? fmtDate(date) : "—"}</span>
                  </td>
                  {/* Actions */}
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <RowMenu
                      onOpen={() => { setActiveDealId(deal.id); router.push("/dashboard/triage"); }}
                      onDelete={() => deleteDeal(deal.id)}
                      onNotes={() => setEditingNotes(deal.id)}
                      onShare={() => shareDeal(deal)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>{/* end dash-table-wrap */}
      </div>

      {/* Notes modal */}
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "#0f172a", color: "#f1f5f9",
          borderRadius: 9999, padding: "10px 22px",
          fontSize: 13, fontWeight: 600, zIndex: 9999,
          boxShadow: "0 8px 24px rgba(0,0,0,0.20)",
          animation: "toast-in 0.22s ease",
          whiteSpace: "nowrap",
        }}>
          ✓ {toast}
        </div>
      )}

      {editingDeal && (
        <div onClick={() => setEditingNotes(null)} style={{
          position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 440,
            boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>Notes — {editingDeal.name}</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px" }}>Internal notes visible only to you.</p>
            <textarea
              autoFocus rows={4} value={editingDeal.notes ?? ""}
              onChange={e => updateNotes(editingDeal.id, e.target.value)}
              placeholder="Red flags, next steps, contacts…"
              className="input" style={{ width: "100%", resize: "vertical", fontSize: 13, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => setEditingNotes(null)} className="btn-secondary" style={{ fontSize: 13 }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
