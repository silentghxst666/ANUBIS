const grouping = new Intl.NumberFormat("ru-RU");

/**
 * Tenge per US dollar, used only to show an indicative $ price next to ₸.
 * Payments are always charged in ₸. Update when the rate moves noticeably.
 */
export const USD_KZT_RATE = 520;

/** Indicative USD price, rounded to the nearest $5 so it reads like a set price. */
export function toUsd(kzt: number): number {
  return Math.max(5, Math.round(kzt / USD_KZT_RATE / 5) * 5);
}

export function formatKzt(amount: number): string {
  return `${grouping.format(amount)} ₸`;
}

/** 189000 -> "189 000 ₸ / $365". Pass `usd` for totals so they equal the sum of line prices. */
export function formatPrice(kzt: number, usd = toUsd(kzt)): string {
  return `${formatKzt(kzt)} / $${grouping.format(usd).replace(/\s/g, ",")}`;
}
