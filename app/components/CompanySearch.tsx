"use client";

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";

function useIsMobile() {
  return useSyncExternalStore(
    cb => { window.addEventListener("resize", cb); return () => window.removeEventListener("resize", cb); },
    () => window.innerWidth <= 768,
    () => false,
  );
}

/* Tracks the visual viewport height so the overlay shrinks correctly when the keyboard is open */
function useVisualViewportHeight() {
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(vv.height);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, []);
  return height;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface CompanySearchResult {
  company_name: string;
  company_number: string;
  address_snippet: string;
  company_status: string;
}

export interface Officer {
  name: string;
  role: string;
  nationality: string | null;
  appointed_on: string | null;
}

export interface OutstandingCharge {
  description: string | null;
  status: string;
  created_on: string | null;
}

export interface PSCEntry {
  name: string;
  kind: string;
  natures_of_control: string[];
  nationality: string | null;
  country_of_residence: string | null;
  notified_on: string | null;
}

export interface CompanyDetails {
  company_name: string;
  company_number: string;
  date_of_creation: string | null;
  company_status: string;
  sic_codes: string[];
  has_charges: boolean;
  registered_office_address: string | null;
  postal_code: string | null;
  locality: string | null;
  sic_description: string | null;
  officers: Officer[];
  outstanding_charges: OutstandingCharge[];
  total_charges: number;
  psc_list: PSCEntry[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function yearsActive(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const created = new Date(dateStr);
  const now = new Date();
  const years = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  const monthName = created.toLocaleString("en-GB", { month: "long" });
  const year = created.getFullYear();
  return `Incorporated ${monthName} ${year} · ${years} yr${years !== 1 ? "s" : ""} active`;
}

function fmtRole(role: string): string {
  return role.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/* ─── Result row (shared between mobile sheet + desktop dropdown) ────────── */

function ResultRow({ r, onSelect, compact }: { r: CompanySearchResult; onSelect: () => void; compact?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const isActive = r.company_status?.toLowerCase() === "active";

  return (
    <button
      onPointerDown={e => { e.preventDefault(); onSelect(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", background: hovered ? "#f8fafc" : "transparent",
        border: "none", cursor: "pointer",
        padding: compact ? "11px 16px" : "14px 16px",
        textAlign: "left", display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 12,
        borderBottom: "1px solid #f1f5f9",
        transition: "background 0.1s",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: "#0f172a", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {r.company_name}
        </p>
        <p style={{ fontSize: compact ? 11 : 12, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {r.address_snippet}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#4f46e5", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 6, padding: "2px 7px", fontFamily: "monospace" }}>
          #{r.company_number}
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? "#059669" : "#94a3b8", background: isActive ? "#ecfdf5" : "#f8fafc", border: `1px solid ${isActive ? "#a7f3d0" : "#e2e8f0"}`, borderRadius: 4, padding: "1px 5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {r.company_status ?? "Unknown"}
        </span>
      </div>
    </button>
  );
}

/* ─── Metadata panel ─────────────────────────────────────────────────────── */

function MetadataPanel({ details, onDismiss }: { details: CompanyDetails; onDismiss: () => void }) {
  const hasOutstanding = details.outstanding_charges.length > 0 || details.has_charges;

  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", marginTop: 12 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)", flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Companies House · Verified Active
            </span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
            {details.company_name}
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0, fontFamily: "monospace" }}>
            #{details.company_number}
            {details.registered_office_address && ` · ${details.registered_office_address}`}
          </p>
        </div>
        <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 4, fontSize: 16, lineHeight: 1, flexShrink: 0 }}>×</button>
      </div>

      {/* Age + SIC */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e293b", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 3px" }}>Business Age</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: 0 }}>{yearsActive(details.date_of_creation)}</p>
        </div>
        {details.sic_codes.length > 0 && (
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 3px" }}>SIC Codes</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: 0 }}>{details.sic_codes.slice(0, 2).join(", ")}</p>
          </div>
        )}
      </div>

      {/* Charges */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e293b", background: hasOutstanding ? "rgba(245,158,11,0.06)" : "rgba(34,197,94,0.04)" }}>
        {hasOutstanding ? (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", margin: "0 0 3px" }}>
                {details.outstanding_charges.length} Outstanding Charge{details.outstanding_charges.length !== 1 ? "s" : ""} Registered
                {details.total_charges > details.outstanding_charges.length ? ` · ${details.total_charges} total (inc. satisfied)` : ""}
              </p>
              <p style={{ fontSize: 11, color: "#92400e", margin: 0, lineHeight: 1.55 }}>
                Banks or creditors have outstanding debentures or charges against this company&apos;s assets.
                Debt service history and charge holder identities must be reviewed before proceeding.
              </p>
              {details.outstanding_charges.slice(0, 2).map((c, i) => (
                <p key={i} style={{ fontSize: 10, color: "#78350f", margin: "6px 0 0", fontFamily: "monospace" }}>
                  › {c.created_on} — {c.description ?? "Charge registered"} [{c.status}]
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>✅</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", margin: 0 }}>Clean Bill of Health</p>
              <p style={{ fontSize: 11, color: "#166534", margin: "2px 0 0" }}>No outstanding charges or mortgages registered against this company&apos;s assets.</p>
            </div>
          </div>
        )}
      </div>

      {/* Officers */}
      {details.officers.length > 0 && (
        <div style={{ padding: "14px 20px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 10px" }}>
            Active Officers ({details.officers.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {details.officers.slice(0, 5).map((o, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{o.name}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#818cf8", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 9999, padding: "2px 8px", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {fmtRole(o.role)}
                </span>
              </div>
            ))}
            {details.officers.length > 5 && (
              <p style={{ fontSize: 10, color: "#475569", margin: "4px 0 0" }}>+{details.officers.length - 5} more officers</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Search input (module-level so React never unmounts it on re-render) ─── */

interface SearchInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  searching: boolean;
  autoFocus?: boolean;
  onChange: (v: string) => void;
  onFocused: () => void;
  onClear: () => void;
}

function SearchInput({ inputRef, value, searching, autoFocus, onChange, onFocused, onClear }: SearchInputProps) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: searching ? "#4f46e5" : "#94a3b8", transition: "color 0.15s" }}>
        {searching ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: "spin 0.7s linear infinite" }}>
            <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search Companies House…"
        autoFocus={autoFocus}
        autoComplete="off"
        inputMode="search"
        style={{
          width: "100%",
          padding: "11px 40px 11px 38px",
          background: "#fff",
          border: "1.5px solid #e2e8f0",
          borderRadius: 10,
          fontSize: 16,
          color: "#0f172a",
          outline: "none",
          fontFamily: "inherit",
          boxSizing: "border-box",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = "#4f46e5";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.12)";
          onFocused();
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {value.length > 0 && (
        <button
          onPointerDown={e => { e.preventDefault(); onClear(); }}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4, lineHeight: 1, borderRadius: 4 }}
          aria-label="Clear search"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

interface Props {
  onCompanySelect: (details: CompanyDetails) => void;
  initialDetails?: CompanyDetails | null;
}

export function CompanySearch({ onCompanySelect, initialDetails }: Props) {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<CompanySearchResult[]>([]);
  const [searching, setSearching]   = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const vpHeight                    = useVisualViewportHeight();
  const [details, setDetails]       = useState<CompanyDetails | null>(initialDetails ?? null);
  const [open, setOpen]             = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef                  = useRef<HTMLDivElement>(null);
  const mainInputRef                = useRef<HTMLInputElement>(null);
  const sheetInputRef               = useRef<HTMLInputElement>(null);
  const listRef                     = useRef<HTMLDivElement>(null);
  const isMobile                    = useIsMobile();

  useEffect(() => {
    if (initialDetails && !details) setDetails(initialDetails);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDetails]);

  /* Close dropdown on outside click (desktop) */
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]);

  /* Scroll results to top whenever they arrive */
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [results]);

  /* Lock body scroll when sheet is open on mobile */
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, open]);

  /* Focus the sheet input when it opens on mobile */
  useEffect(() => {
    if (isMobile && open) {
      setTimeout(() => sheetInputRef.current?.focus(), 80);
    }
  }, [isMobile, open]);

  /* Debounced search */
  const handleInput = useCallback((value: string) => {
    setQuery(value);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setResults([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setOpen(true);
      try {
        const res = await fetch(`${API}/api/companies/search?q=${encodeURIComponent(value)}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail ?? `Search failed (${res.status})`);
        }
        const data: CompanySearchResult[] = await res.json();
        setResults(data);
      } catch (e: unknown) {
        setSearchError(e instanceof Error ? e.message : "Search failed");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  /* Fetch details on selection */
  const handleSelect = useCallback(async (company: CompanySearchResult) => {
    setOpen(false);
    setQuery(company.company_name);
    setResults([]);
    setDetails(null);
    setLoadingDetails(true);
    setSearchError(null);

    try {
      const res = await fetch(`${API}/api/companies/details/${company.company_number}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Details fetch failed (${res.status})`);
      }
      const d: CompanyDetails = await res.json();
      setDetails(d);
      onCompanySelect(d);
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : "Failed to load company details");
    } finally {
      setLoadingDetails(false);
    }
  }, [onCompanySelect]);

  const clearSelection = () => {
    setQuery("");
    setDetails(null);
    setResults([]);
    setSearchError(null);
    setOpen(false);
    setTimeout(() => mainInputRef.current?.focus(), 50);
  };

  const showResults = open && (results.length > 0 || (searching && query.length >= 2));

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes overlay-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Main search input — always visible in page flow */}
      <SearchInput
        inputRef={mainInputRef}
        value={query}
        searching={searching}
        onChange={handleInput}
        onFocused={() => { if (results.length > 0) setOpen(true); }}
        onClear={clearSelection}
      />

      {/* ── Desktop dropdown ──────────────────────────────────────────────── */}
      {!isMobile && showResults && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)", zIndex: 200,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)", overflow: "hidden",
          maxHeight: 320, display: "flex", flexDirection: "column",
        }}>
          {searching && results.length === 0 && (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>Searching Companies House…</div>
          )}
          <div ref={listRef} style={{ overflowY: "auto", flex: 1 }}>
            {results.map(r => (
              <ResultRow key={r.company_number} r={r} onSelect={() => handleSelect(r)} compact />
            ))}
          </div>
          {results.length > 0 && (
            <div style={{ padding: "7px 14px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
              <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{results.length} result{results.length !== 1 ? "s" : ""} from Companies House</p>
            </div>
          )}
        </div>
      )}

      {/* ── Mobile full-screen overlay (search bar pinned top) ───────────── */}
      {isMobile && open && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: vpHeight ? `${vpHeight}px` : "100dvh",
          zIndex: 1000,
          background: "#fff",
          display: "flex", flexDirection: "column",
          animation: "overlay-in 0.22s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          {/* Top bar: cancel + search input */}
          <div style={{
            padding: "12px 16px 10px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", gap: 10,
            flexShrink: 0,
            background: "#fff",
          }}>
            {/* Cancel */}
            <button
              onPointerDown={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#4f46e5", fontSize: 14, fontWeight: 600, padding: "4px 0", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              Cancel
            </button>

            {/* Search input — full width, editable */}
            <div style={{ flex: 1 }}>
              <SearchInput
                inputRef={sheetInputRef}
                value={query}
                searching={searching}
                autoFocus
                onChange={handleInput}
                onFocused={() => {}}
                onClear={clearSelection}
              />
            </div>
          </div>

          {/* Status row: result count / loading */}
          <div style={{ padding: "8px 16px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", flexShrink: 0, minHeight: 34, display: "flex", alignItems: "center", gap: 8 }}>
            {searching ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth={2.5} style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}>
                  <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span style={{ fontSize: 11, color: "#64748b" }}>Searching Companies House…</span>
              </>
            ) : results.length > 0 ? (
              <span style={{ fontSize: 11, color: "#64748b" }}>{results.length} result{results.length !== 1 ? "s" : ""} — tap to select</span>
            ) : null}
          </div>

          {/* Results list — starts from top, scrollable */}
          <div ref={listRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" as never, overscrollBehavior: "contain", minHeight: 0 }}>
            {!searching && results.length === 0 && query.length >= 2 && (
              <div style={{ padding: "48px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#334155", margin: "0 0 6px" }}>No companies found</p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Try a different name or company number</p>
              </div>
            )}

            {results.map(r => (
              <ResultRow key={r.company_number} r={r} onSelect={() => handleSelect(r)} />
            ))}

            {results.length > 0 && (
              <div style={{ padding: "24px 16px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                {results.length === 1 && (
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>1 company matched — tap to view details</p>
                )}
                <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0 }}>Data sourced from Companies House · {new Date().getFullYear()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {searchError && (
        <p style={{ fontSize: 12, color: "#dc2626", margin: "8px 0 0", display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {searchError}
        </p>
      )}

      {/* Loading details */}
      {loadingDetails && (
        <div style={{ marginTop: 10, padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth={2.5} style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}>
            <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span style={{ fontSize: 12, color: "#64748b" }}>Fetching official company record, directors & charges…</span>
        </div>
      )}

      {/* Metadata panel */}
      {details && !loadingDetails && (
        <MetadataPanel details={details} onDismiss={clearSelection} />
      )}
    </div>
  );
}
