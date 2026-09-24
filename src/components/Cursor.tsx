"use client";

import { useEffect, useRef, useState } from "react";

// Desktop-only cursor: a precise dot plus a ring that trails with inertia.
// Over links/buttons the ring opens; over products it shows a label ("VIEW").
// Uses mix-blend-difference so it stays visible on both black and white sections.

export default function Cursor({ viewLabel }: { viewLabel: string }) {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"default" | "link" | "view">("default");

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const html = document.documentElement;
    const pos = { x: -100, y: -100 };
    const trail = { x: -100, y: -100 };
    let frame = 0;
    let shown = false;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!shown) {
        shown = true;
        trail.x = pos.x;
        trail.y = pos.y;
        html.classList.add("has-cursor");
        setEnabled(true);
      }
      const target = e.target as Element | null;
      setMode(
        target?.closest("[data-cursor='view']")
          ? "view"
          : target?.closest("a, button, [role='button'], summary, label")
            ? "link"
            : "default",
      );
    };

    const onLeave = () => {
      shown = false;
      html.classList.remove("has-cursor");
      setEnabled(false);
    };

    const tick = () => {
      trail.x += (pos.x - trail.x) * 0.18;
      trail.y += (pos.y - trail.y) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      html.classList.remove("has-cursor");
    };
  }, []);

  const ringSize = mode === "view" ? 84 : mode === "link" ? 44 : 30;

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-[100] mix-blend-difference transition-opacity duration-300 ${enabled ? "opacity-100" : "opacity-0"}`}
    >
      <div ref={dot} className="absolute left-0 top-0">
        <div className="-ml-[2px] -mt-[2px] h-1 w-1 rounded-full bg-white" />
      </div>
      <div ref={ring} className="absolute left-0 top-0">
        <div
          className="flex items-center justify-center rounded-full border border-white text-white transition-[width,height,margin] duration-500 ease-[var(--ease-weight)]"
          style={{ width: ringSize, height: ringSize, marginLeft: -ringSize / 2, marginTop: -ringSize / 2 }}
        >
          <span
            className={`label text-[0.6rem] transition-opacity duration-300 ${mode === "view" ? "opacity-100" : "opacity-0"}`}
          >
            {viewLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
