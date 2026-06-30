"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "fading-in" | "holding" | "fading-out";

const FADE_IN_MS  = 1400;
const HOLD_MS     = 300;
const FADE_OUT_MS = 2400;

export function NavigationTransition() {
  const pathname  = usePathname();
  const prevPath  = useRef(pathname);
  const [phase, setPhase]       = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const after = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms); timers.current.push(t);
  };

  /* ── Click → fade in ── */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/#")) return;
      if (href === window.location.pathname) return;

      clear();
      setProgress(0);
      setPhase("fading-in");

      let p = 0;
      const tick = () => {
        p = p < 35 ? p + 3.5
          : p < 60 ? p + 1.5
          : p < 78 ? p + 0.6
          : p + 0.12;
        setProgress(Math.min(p, 82));
        if (p < 82) timers.current.push(setTimeout(tick, 110));
      };
      timers.current.push(setTimeout(tick, 120));
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* ── Route settled → fade out ── */
  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    clear();
    setProgress(100);
    setPhase("holding");

    after(HOLD_MS, () => {
      setPhase("fading-out");
      after(FADE_OUT_MS + 120, () => {
        setPhase("idle");
        setProgress(0);
      });
    });

    return clear;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (phase === "idle") return null;

  const isOut = phase === "fading-out";
  const isIn  = phase === "fading-in";

  return (
    <>
      {/* ── Overlay ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          pointerEvents: isOut ? "none" : "all",
          opacity: isOut ? 0 : 1,
          transition: isOut
            ? `opacity ${FADE_OUT_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
            : isIn
            ? `opacity ${FADE_IN_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
            : "none",
          background: "linear-gradient(160deg, #07070f 0%, #0d0b1e 50%, #080810 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% 46%, rgba(91,82,240,0.1) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* ── Wordmark block ── */}
        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          opacity: isOut ? 0 : 1,
          transition: isOut
            ? `opacity ${FADE_OUT_MS * 0.45}ms ease`
            : `opacity 700ms 350ms ease`,
        }}>
          {/* Name row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 9, height: 9, borderRadius: "50%",
              background: "linear-gradient(135deg,#2563eb,#8b5cf6)",
              boxShadow: "0 0 18px rgba(99,102,241,0.75)",
            }} />
            <span style={{
              fontSize: "clamp(26px, 3.8vw, 50px)",
              fontWeight: 300,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.87)",
              fontFamily: "'Georgia','Times New Roman',serif",
              textTransform: "uppercase",
              lineHeight: 1,
            }}>
              Triage Finance
            </span>
            <div style={{
              width: 9, height: 9, borderRadius: "50%",
              background: "linear-gradient(135deg,#8b5cf6,#2563eb)",
              boxShadow: "0 0 18px rgba(139,92,246,0.75)",
            }} />
          </div>

          {/* Hairline rule */}
          <div style={{
            width: "100%",
            height: "0.5px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 25%, rgba(99,102,241,0.55) 50%, rgba(255,255,255,0.15) 75%, transparent 100%)",
          }} />

          {/* Caption */}
          <span style={{
            fontSize: "clamp(8px, 0.9vw, 10px)",
            letterSpacing: "0.38em",
            color: "rgba(255,255,255,0.28)",
            textTransform: "uppercase",
            fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
            fontWeight: 500,
          }}>
            UK M&amp;A Deal Intelligence
          </span>

          {/* ── Loading animation ── */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
            marginTop: 28,
            opacity: isOut ? 0 : 1,
            transition: isOut ? `opacity 300ms ease` : `opacity 500ms 800ms ease`,
          }}>
            {/* Sweeping bar */}
            <div style={{
              width: 180,
              height: 1,
              borderRadius: 9999,
              background: "rgba(255,255,255,0.07)",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: 9999,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.9) 50%, transparent 100%)",
                animation: "tf-sweep 2.2s cubic-bezier(0.4,0,0.2,1) infinite",
              }} />
            </div>

            {/* Three dots */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "rgba(99,102,241,0.7)",
                    animation: `tf-dot 1.6s ease-in-out infinite`,
                    animationDelay: `${i * 0.22}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: "1px",
        zIndex: 9999,
        pointerEvents: "none",
        background: "rgba(99,102,241,0.1)",
        opacity: isOut ? 0 : 1,
        transition: `opacity ${FADE_OUT_MS * 0.35}ms ease`,
      }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg,#2563eb 0%,#a78bfa 55%,#818cf8 100%)",
          boxShadow: "0 0 8px rgba(99,102,241,0.8)",
          transition: progress === 100 ? "width 0.2s ease-out" : "width 0.1s linear",
        }} />
      </div>

      <style>{`
        @keyframes tf-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes tf-dot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.25); }
        }
      `}</style>
    </>
  );
}
