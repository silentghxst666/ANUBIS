"use client";

import { useSyncExternalStore } from "react";

export type CartItem = { slug: string; size: string; qty: number };

const STORAGE_KEY = "anubis-cart";
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) items = parsed;
  } catch {
    // Private mode / blocked storage: the cart simply starts empty.
  }
}

function commit(next: CartItem[]) {
  items = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  // Keep several open tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function addToCart(slug: string, size: string, qty = 1) {
  const existing = items.find((i) => i.slug === slug && i.size === size);
  commit(
    existing
      ? items.map((i) => (i === existing ? { ...i, qty: i.qty + qty } : i))
      : [...items, { slug, size, qty }],
  );
}

export function setQty(slug: string, size: string, qty: number) {
  commit(
    qty <= 0
      ? items.filter((i) => !(i.slug === slug && i.size === size))
      : items.map((i) => (i.slug === slug && i.size === size ? { ...i, qty } : i)),
  );
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return items;
    },
    () => EMPTY,
  );
}
