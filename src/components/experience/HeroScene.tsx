"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Quality } from "./MonolithScene";

// three.js is only downloaded after the page is interactive and never on the server.
const MonolithScene = dynamic(() => import("./MonolithScene"), { ssr: false });

type Setup = { quality: Quality; calm: boolean } | null;

function detectSetup(): Setup {
  try {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2") && !canvas.getContext("webgl")) return null;
  } catch {
    return null;
  }
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
  return {
    quality: coarse || weak ? "low" : "high",
    calm: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

/** Full-bleed 3D backdrop for the hero, with a CSS monolith shown until (or instead of) WebGL. */
export default function HeroScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const [setup, setSetup] = useState<Setup>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    // Wait for idle time so the 3D bundle never competes with the first paint.
    const start = () => setSetup(detectSetup());
    const idle = typeof window.requestIdleCallback === "function";
    const id = idle
      ? window.requestIdleCallback(start, { timeout: 1500 })
      : window.setTimeout(start, 300);

    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    if (wrap.current) observer.observe(wrap.current);

    return () => {
      if (idle) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0" aria-hidden>
      {/* Static fallback: a soft vertical slab of light, same composition as the 3D frame. */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[1600ms] ${ready ? "opacity-0" : "opacity-100"}`}
      >
        <div className="h-[46%] w-[min(16vh,22vw)] bg-gradient-to-r from-[#111] via-[#1c1c1c] to-[#0b0b0b] shadow-[0_0_120px_rgba(242,242,242,0.05)]" />
      </div>

      {setup && (
        <div
          className={`absolute inset-0 transition-opacity duration-[1600ms] ${ready ? "opacity-100" : "opacity-0"}`}
        >
          <MonolithScene
            quality={setup.quality}
            calm={setup.calm}
            active={active}
            onReady={() => setReady(true)}
          />
        </div>
      )}
    </div>
  );
}
