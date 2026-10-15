"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { INSTAGRAM_DM_URL } from "@/lib/contact";

/**
 * Temporary checkout until online payment exists: copies a ready-made order summary and
 * opens the brand's Instagram direct messages, where payment and delivery are agreed.
 * Instagram can't prefill a DM, so the summary goes through the clipboard (and is shown
 * on screen in case the browser blocks clipboard access).
 */
export default function InstagramCheckout({
  orderText,
  labels,
}: {
  orderText: string;
  labels: Dictionary["cart"];
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(orderText);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="mt-6">
      {/* A real link (not window.open after an await) so pop-up blockers and the
          Instagram app hand-off both treat it as a direct tap. */}
      <a
        href={INSTAGRAM_DM_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => void copy()}
        className="label flex h-13 w-full items-center justify-center gap-3 bg-fg text-bg transition-opacity hover:opacity-85"
      >
        {labels.checkout} <span aria-hidden>↗</span>
      </a>
      <p className="mt-3 text-sm leading-relaxed text-muted">{labels.checkoutNote}</p>

      <div aria-live="polite">
        {status !== "idle" && (
          <div className="mt-4 border border-line p-4">
            <p className="text-sm">{status === "copied" ? labels.copied : labels.copyFailed}</p>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted">
              {orderText}
            </pre>
            <button type="button" onClick={() => void copy()} className="label mt-3 underline underline-offset-4 hover:opacity-60">
              {labels.copyAgain}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
