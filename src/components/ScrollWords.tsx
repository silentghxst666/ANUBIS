"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Paragraph whose words light up one by one as it scrolls through the viewport.
 * The full text is always in the DOM (readable by screen readers and search engines);
 * only the opacity of each word changes.
 */
export default function ScrollWords({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--progress", "1");
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the paragraph's top reaches 85% of the viewport, 1 when its bottom reaches 45%.
      const start = vh * 0.85;
      const end = vh * 0.45;
      const progress = (start - rect.top) / (start - end + rect.height);
      el.style.setProperty("--progress", String(Math.min(Math.max(progress, 0), 1)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <p ref={ref} className={className} style={{ "--progress": 0 } as CSSProperties}>
      {words.map((word, i) => (
        <span
          key={i}
          className="transition-opacity duration-500"
          style={{
            // Each word fades in over its own slice of the scroll progress.
            opacity: `clamp(0.14, calc((var(--progress) * ${words.length} - ${i}) * 1), 1)`,
          }}
        >
          {word}{" "}
        </span>
      ))}
    </p>
  );
}
