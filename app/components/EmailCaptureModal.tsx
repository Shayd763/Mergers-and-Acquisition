"use client";
import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onCaptured: (name: string, email: string) => void;
  onClose: () => void;
  headline?: string;
  subline?: string;
}

export function EmailCaptureModal({ isOpen, onCaptured, onClose, headline, subline }: Props) {
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) { setTimeout(() => { setName(""); setEmail(""); setSubmitted(false); }, 300); }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const ready = name.trim().length > 1 && email.includes("@") && email.includes(".");

  const handleSubmit = () => {
    if (!ready) return;
    try {
      localStorage.setItem("visitor_name", name.trim());
      localStorage.setItem("visitor_email", email.trim().toLowerCase());
    } catch {}
    setSubmitted(true);
    setTimeout(() => onCaptured(name.trim(), email.trim().toLowerCase()), 900);
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 1200,
      }} />

      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(440px, 95vw)",
        background: "#ffffff",
        borderRadius: 18,
        boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.08)",
        zIndex: 1201,
        overflow: "hidden",
        animation: "modal-slide 0.24s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
          padding: "28px 28px 22px",
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            {headline ?? "Save your analysis"}
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", margin: 0, lineHeight: 1.55 }}>
            {subline ?? "Create a free account to unlock company verification and credit scoring — no payment needed."}
          </p>
        </div>

        {/* Social proof bar */}
        <div style={{ background: "#f0f4ff", borderBottom: "1px solid #d6d3d1", padding: "8px 28px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: -4 }}>
            {["#1c1917","#292524","#06b6d4","#059669","#d97706"].map((c, i) => (
              <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: "2px solid #f0f4ff", marginLeft: i > 0 ? -5 : 0, flexShrink: 0 }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: "#1c1917", fontWeight: 600 }}>
            3,241+ deal analysts already on Acquisition Exchange
          </span>
        </div>

        {/* Form */}
        <div style={{ padding: "22px 28px 26px" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>✅</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#059669", margin: "0 0 4px" }}>You&apos;re in!</p>
              <p style={{ fontSize: 12, color: "#78716c", margin: 0 }}>Unlocking your analysis now…</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#44403c" }}>Your name</span>
                  <input
                    type="text" placeholder="James Smith" value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && ready) handleSubmit(); }}
                    autoFocus
                    style={{
                      padding: "10px 14px", borderRadius: 9, border: "1.5px solid #d6d3d1",
                      fontSize: 14, outline: "none", fontFamily: "inherit",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#1c1917"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#d6d3d1"; }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#44403c" }}>Work email</span>
                  <input
                    type="email" placeholder="james@searchfund.co.uk" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && ready) handleSubmit(); }}
                    style={{
                      padding: "10px 14px", borderRadius: 9, border: "1.5px solid #d6d3d1",
                      fontSize: 14, outline: "none", fontFamily: "inherit",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#1c1917"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#d6d3d1"; }}
                  />
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!ready}
                style={{
                  marginTop: 16, width: "100%", padding: "13px 0",
                  background: ready ? "linear-gradient(135deg,#1c1917,#292524)" : "#d6d3d1",
                  color: ready ? "#fff" : "#a8a29e",
                  border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: ready ? "pointer" : "not-allowed",
                  boxShadow: ready ? "0 4px 14px rgba(28,25,23,0.30)" : "none",
                  transition: "all 0.2s",
                }}>
                Unlock for free →
              </button>

              <p style={{ fontSize: 11, color: "#a8a29e", textAlign: "center", margin: "10px 0 0", lineHeight: 1.55 }}>
                No payment required · Cancel anytime · Data never sold
              </p>
              <button onClick={onClose} style={{
                display: "block", width: "100%", marginTop: 6,
                fontSize: 11, color: "#a8a29e", background: "none",
                border: "none", cursor: "pointer", textAlign: "center",
                textDecoration: "underline",
              }}>
                Skip for now
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modal-slide {
          from { opacity: 0; transform: translate(-50%, -46%) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
