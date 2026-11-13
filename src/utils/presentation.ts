import { beverageCategories } from "../beverages";
import { foodCategories } from "../dinerBites";
import type { Product } from "../types";

// Only badges that tell the guest something; flavor words ("ZINGY", "COMFORT") stay in the copy.
const EARNED_BADGES = new Set([
  "BEST SELLER",
  "HOUSE SPECIAL",
  "CHEF'S PICK",
  "NEW SPECIAL",
  "SIGNATURE",
  "BEST VALUE",
  "OATSIDE COLLAB",
]);
export const earnedBadge = (badge?: string) =>
  badge && EARNED_BADGES.has(badge) ? badge : undefined;

// Only an item's own photo is ever shown; no borrowed category shots. Add `photo` in the menu data to publish one.
const itemPhotos = new Map(
  [...beverageCategories, ...foodCategories].flatMap((category) =>
    category.items.flatMap((item) => (item.photo ? [[item.id, item.photo] as const] : [])),
  ),
);
export const menuItemPhoto = (id: string): { src: string; cutout: boolean } | undefined => {
  const src = itemPhotos.get(id);
  // hero-drinks/ shots are transparent cup cut-outs that need a tinted backdrop.
  return src ? { src, cutout: src.includes("/hero-drinks/") } : undefined;
};

// ↓ UTILITY: Philippine Peso currency formatter
export const money = (n: number) => `₱${n.toLocaleString("en-PH")}`;

// ↓ UTILITY: Relative image path resolvers (supports dev server and file:// protocol)
export const image = (name: string) => {
  if (name === "hot") return "./images/optimized/hotroast.webp";
  return `./images/optimized/${name}.webp`;
};

export const productImage = (product: Product) =>
  product.photo.startsWith("./") ? product.photo : image(product.id);
