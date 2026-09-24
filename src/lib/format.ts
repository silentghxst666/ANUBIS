const grouping = new Intl.NumberFormat("ru-RU");

/** 189000 -> "189 000 ₸" (same format for both languages, as is customary in KZ). */
export function formatPrice(amount: number): string {
  return `${grouping.format(amount)} ₸`;
}
