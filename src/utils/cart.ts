import type { CartItem } from "../types";

export const MAX_CART_QUANTITY = 20;

export const OAT_MILK_SURCHARGE = 35;

// Menu data keys sizes as "16oz"; the bag, modal and order message all show "16 oz".
export const sizeLabel = (size: string) => size.replace(/(\d+)\s*oz/i, "$1 oz");
export const sizeKey = (size: string) => size.replace(/\s+/g, "");

export function mergeCartItem(items: CartItem[], item: CartItem): CartItem[] {
  const existing = items.find((candidate) => candidate.key === item.key);
  return existing
    ? items.map((candidate) =>
        candidate.key === item.key
          ? { ...candidate, quantity: Math.min(MAX_CART_QUANTITY, candidate.quantity + item.quantity) }
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
