import type { CartItem } from "../types";

export function mergeCartItem(items: CartItem[], item: CartItem): CartItem[] {
  const existing = items.find((candidate) => candidate.key === item.key);
  return existing
    ? items.map((candidate) =>
        candidate.key === item.key
          ? { ...candidate, quantity: Math.min(20, candidate.quantity + item.quantity) }
          : candidate,
      )
    : [...items, item];
}
