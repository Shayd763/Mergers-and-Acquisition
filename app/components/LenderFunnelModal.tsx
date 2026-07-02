"use client";
import { useState, useEffect } from "react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface LenderFunnelProps {
  isOpen: boolean;
  onClose: () => void;
  dscr: number;
  leveredFcf: number;
  dealId: string;
  totalCost: number;
  sector: string | null;
}

/* ─── Lender data ────────────────────────────────────────────────────────── */

const LENDERS = [
  {
    id: "oaknorth",
    name: "OakNorth Bank",
    badge: "SME Specialist",
    desc: "Challenger bank · Flexible acquisition underwriting · £500k–£25m",
    initials: "ON",
    color: "#0ea5e9",
  },
  {
    id: "thincats",
    name: "ThinCats",
    badge: "Alt. Credit",
    desc: "Alternative credit platform · Real-time decisioning · £250k–£5m",
    initials: "TC",
    color: "#8b5cf6",
  },
  {
    id: "funding",
    name: "Funding Circle",
    badge: "Fast Approval",
    desc: "P2P commercial lending · Fast approvals · Up to £500k",
    initials: "FC",
    color: "#06b6d4",
  },
  {
    id: "sfc",
    name: "SFC Commercial",
    badge: "Flexible",
    desc: "Bespoke deal structures · UK acquisitions · £100k–£3m",
    initials: "SF",
    color: "#f59e0b",
  },
] as const;

const TIMELINES = ["< 30 Days", "30 – 90 Days", "90+ Days", "Exploring options"] as const;

/* ─── Transmit lines ─────────────────────────────────────────────────────── */

const TRANSMIT_LINES = [
  { tag: "PACKAGING",  text: "Compiling Deal Credit Memo PDF…",       color: "#a5b4fc" },
  { tag: "CONNECTING", text: "Establishing secure routing node…",      color: "#a8a29e" },
  { tag: "ENCRYPTING", text: "Signing package with deal reference…",   color: "#a5b4fc" },
  { tag: "SUCCESS",    text: "Deal package dispatched to {n} partner{s}.", color: "#34d399" },
];

/* ─── Modal component ────────────────────────────────────────────────────── */

export function LenderFunnelModal({
  isOpen, onClose, dscr, leveredFcf, dealId, totalCost, sector,
}: LenderFunnelProps) {
  const [step, setStep]             = useState(1);
  const [selected, setSelected]     = useState<Set<string>>(new Set(["oaknorth", "thincats"]));
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [timeline, setTimeline]     = useState("");
  const [transmitIdx, setTransmitIdx] = useState(-1);
  const [done, setDone]             = useState(false);

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => { setStep(1); setTransmitIdx(-1); setDone(false); }, 300);
    }
  }, [isOpen]);

  /* Body scroll lock */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const toggleLender = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  };

  const runTransmit = () => {
    setStep(3);
    let idx = 0;
    setTransmitIdx(idx);
    const iv = setInterval(() => {
      idx++;
      if (idx >= TRANSMIT_LINES.length) { clearInterval(iv); setDone(true); return; }
      setTransmitIdx(idx);
    }, 1100);
  };

  const nSelected = selected.size;

  const viable = dscr >= 1.20 && leveredFcf > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 1100,
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(560px, 95vw)",
        maxHeight: "90dvh",
        background: "#ffffff",
        borderRadius: 18,
        boxShadow: "0 32px 80px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.10)",
        zIndex: 1101,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <div style={{
          background: "#1c1917",
          padding: "20px 24px 16px",
          flexShrink: 0,
        }}>
          {/* Step dots */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center" }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                height: 4, flex: 1, borderRadius: 9999,
                background: s <= step ? "#1c1917" : "#1e293b",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 11, color: "#78716c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", margin: "0 0 4px" }}>
                {step === 1 ? "Step 1 of 3" : step === 2 ? "Step 2 of 3" : "Transmitting"}
              </p>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#e7e5e4", margin: 0, letterSpacing: "-0.02em" }}>
                {step === 1 ? "Select Financing Partners"
                 : step === 2 ? "Your Contact Details"
                 : done     ? "Submission Complete"
                 :             "Routing Deal Package"}
              </h2>
              {step === 1 && (
                <p style={{ fontSize: 12, color: "#78716c", margin: "4px 0 0" }}>
                  Your compiled Credit Memo will be sent to selected partners · Deal ref: <span style={{ color: "#a5b4fc", fontFamily: "monospace", fontSize: 11 }}>{dealId}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 7, padding: "5px 10px", cursor: "pointer",
                color: "#a8a29e", fontSize: 16, lineHeight: 1, flexShrink: 0,
              }}>
              ✕
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>

          {/* ─ STEP 1: Lender selection ─ */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {LENDERS.map(({ id, name, badge, desc, initials, color }) => {
                const on = selected.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleLender(id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: on ? "#e7e5e4" : "#faf9f7",
                      outline: on ? "2px solid #1c1917" : "2px solid transparent",
                      transition: "all 0.15s", textAlign: "left", width: "100%",
                    }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: on ? color : "#d6d3d1",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: on ? "#fff" : "#a8a29e", fontWeight: 800, fontSize: 13,
                      transition: "background 0.2s, color 0.2s",
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1c1917" }}>{name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 9999,
                          background: on ? "#ede9fe" : "#e7e5e4",
                          color: on ? "#292524" : "#a8a29e",
                          border: `1px solid ${on ? "#d6d3d1" : "#d6d3d1"}`,
                        }}>{badge}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#78716c", margin: 0, lineHeight: 1.4 }}>{desc}</p>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${on ? "#1c1917" : "#d6d3d1"}`,
                      background: on ? "#1c1917" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 12, fontWeight: 700,
                      transition: "all 0.15s",
                    }}>
                      {on ? "✓" : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ─ STEP 2: Contact form ─ */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Selected lenders summary */}
              <div style={{ background: "#faf9f7", border: "1px solid #d6d3d1", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Sending to</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {LENDERS.filter(l => selected.has(l.id)).map(l => (
                    <span key={l.id} style={{
                      fontSize: 12, fontWeight: 600, color: "#44403c",
                      background: "#fff", border: "1px solid #d6d3d1",
                      borderRadius: 6, padding: "3px 10px",
                    }}>{l.name}</span>
                  ))}
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#44403c" }}>Full Name *</span>
                <input
                  type="text"
                  placeholder="James Whitmore"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input"
                  style={{ fontSize: 14 }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#44403c" }}>Contact Email *</span>
                <input
                  type="email"
                  placeholder="james@searchfund.co.uk"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  style={{ fontSize: 14 }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#44403c" }}>Target Completion Timeline *</span>
                <select
                  value={timeline}
                  onChange={e => setTimeline(e.target.value)}
                  className="input"
                  style={{ fontSize: 14, background: "#fff" }}>
                  <option value="">Select timeline…</option>
                  {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>

              {/* Deal summary chip */}
              <div style={{ background: "#e7e5e4", border: "1px solid #d6d3d1", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 16 }}>
                {[
                  ["Total Deal Size", `£${(totalCost / 1000).toFixed(0)}k`],
                  ["DSCR", `${dscr.toFixed(2)}×`],
                  ["Sector", sector ?? "SME"],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p style={{ fontSize: 10, color: "#1c1917", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>{l}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─ STEP 3: Transmit ─ */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="terminal-window">
                <div className="terminal-chrome">
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
                  <span style={{ marginLeft: 10, fontSize: 11, color: "#6c7086", fontFamily: "monospace" }}>lender-routing — secure channel</span>
                </div>
                <div className="terminal-body">
                  {TRANSMIT_LINES.slice(0, transmitIdx + 1).map((line, i) => {
                    const text = line.text
                      .replace("{n}", String(nSelected))
                      .replace("{s}", nSelected !== 1 ? "s" : "");
                    return (
                      <div key={i} className="terminal-line" style={{ display: "flex", gap: 14 }}>
                        <span style={{ color: "#6c7086", minWidth: 90, flexShrink: 0 }}>[{line.tag}]</span>
                        <span style={{ color: line.color }}>{text}</span>
                      </div>
                    );
                  })}
                  {!done && transmitIdx < TRANSMIT_LINES.length - 1 && (
                    <div style={{ display: "flex", gap: 14 }}>
                      <span style={{ color: "#6c7086", minWidth: 90 }}>[{TRANSMIT_LINES[transmitIdx + 1]?.tag ?? ""}]</span>
                      <span className="cursor-blink" />
                    </div>
                  )}
                </div>
              </div>

              {done && (
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: "20px 22px", textAlign: "center" }}>
                  <p style={{ fontSize: 28, margin: "0 0 8px" }}>✅</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#065f46", margin: "0 0 4px" }}>
                    Submission received by {nSelected} partner{nSelected !== 1 ? "s" : ""}
                  </p>
                  <p style={{ fontSize: 12, color: "#059669", margin: 0, lineHeight: 1.55 }}>
                    A relationship manager from each selected lender will contact you at <strong>{email}</strong> within 1–2 business days to discuss your deal structure.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e7e5e4", flexShrink: 0, background: "#fafafa" }}>
          {/* Navigation buttons */}
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              style={{
                width: "100%", background: "#1c1917", color: "#fff",
                border: "none", borderRadius: 9, padding: "13px 0",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(28,25,23,0.30)",
              }}>
              Continue with {nSelected} partner{nSelected !== 1 ? "s" : ""} →
            </button>
          )}

          {step === 2 && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 0, background: "#faf9f7", color: "#475569",
                  border: "1px solid #d6d3d1", borderRadius: 9, padding: "12px 18px",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>
                ← Back
              </button>
              <button
                onClick={runTransmit}
                disabled={!name.trim() || !email.includes("@") || !timeline}
                style={{
                  flex: 1, background: "#1c1917", color: "#fff",
                  border: "none", borderRadius: 9, padding: "12px 0",
                  fontSize: 14, fontWeight: 700, cursor: (!name.trim() || !email.includes("@") || !timeline) ? "not-allowed" : "pointer",
                  opacity: (!name.trim() || !email.includes("@") || !timeline) ? 0.5 : 1,
                  boxShadow: "0 4px 14px rgba(28,25,23,0.28)",
                }}>
                Submit to Lenders 🚀
              </button>
            </div>
          )}

          {step === 3 && done && (
            <button
              onClick={onClose}
              style={{
                width: "100%", background: "#1c1917", color: "#fff",
                border: "none", borderRadius: 9, padding: "13px 0",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>
              Close
            </button>
          )}

          {/* Commission disclaimer */}
          <p style={{ fontSize: 10, color: "#a8a29e", textAlign: "center", margin: "10px 0 0", lineHeight: 1.6 }}>
            Acquisition Exchange is a commercial matching utility. We receive a standard referral commission from our
            lending partners upon successful loan origination at no additional cost to you.
            Introductions do not constitute financial advice. Loans subject to lender credit assessment.
          </p>
        </div>
      </div>
    </>
  );
}
