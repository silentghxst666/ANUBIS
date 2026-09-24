/** Slow endless ticker. The content is rendered twice so the loop is seamless. */
export default function Marquee({ items, dark = false }: { items: string[]; dark?: boolean }) {
  const row = items.map((item, i) => (
    <span key={i} className="flex items-center gap-10 pr-10">
      {item}
      <span aria-hidden className="h-px w-10 bg-current opacity-40" />
    </span>
  ));

  return (
    <div
      className={`overflow-hidden border-y py-5 ${dark ? "border-line-dark bg-ink text-muted-dark" : "border-line bg-white text-ink"}`}
      aria-label={items.join(" — ")}
    >
      <div className="marquee label flex w-max whitespace-nowrap" aria-hidden>
        {row}
        {row}
      </div>
    </div>
  );
}
