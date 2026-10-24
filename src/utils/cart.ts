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

export const cartItemSpecs = (item: CartItem) => [
  item.size,
  item.temperature,
  item.sweetness,
  item.temperature === "Iced" ? item.iceLevel : null,
  item.milk && item.milk !== "Regular" ? `${item.milk} milk` : null,
].filter(Boolean);
