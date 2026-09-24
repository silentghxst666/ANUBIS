/** Slow endless ticker on an inverted band (the one strip of contrast in either theme). The content is rendered twice so the loop is seamless. */
export default function Marquee({ items }: { items: string[] }) {
  const row = items.map((item, i) => (
    <span key={i} className="flex items-center gap-10 pr-10">
      {item}
      <span aria-hidden className="h-px w-10 bg-current opacity-40" />
    </span>
  ));

  return (
    <div
      className="overflow-hidden bg-fg py-5 text-bg"
      aria-label={items.join(" — ")}
    >
      <div className="marquee label flex w-max whitespace-nowrap" aria-hidden>
        {row}
        {row}
      </div>
    </div>
  );
}
