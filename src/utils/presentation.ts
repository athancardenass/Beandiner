import type { Product } from "../types";

// ↓ UTILITY: Philippine Peso currency formatter
export const money = (n: number) => `₱${n.toLocaleString("en-PH")}`;

// ↓ UTILITY: Relative image path resolvers (supports dev server and file:// protocol)
export const image = (name: string) => {
  if (name === "hot") return "./images/optimized/hotroast.webp";
  return `./images/optimized/${name}.webp`;
};

export const productImage = (product: Product) =>
  product.photo.startsWith("./") ? product.photo : image(product.id);
