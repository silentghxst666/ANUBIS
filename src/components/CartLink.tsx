"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function CartLink({ href, label }: { href: string; label: string }) {
  const count = useCart().reduce((n, i) => n + i.qty, 0);
  return (
    <Link href={href} className="label hover:opacity-60">
      {label} <span className="tabular-nums">[{count}]</span>
    </Link>
  );
}
