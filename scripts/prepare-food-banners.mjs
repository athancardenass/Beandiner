import sharp from "sharp";
import { mkdir } from "node:fs/promises";

/**
 * Convert the wide Diner Bites category banners (2 MB+ PNGs) to compact WebP.
 *
 * Reads:  public/images/<source>.png
 * Writes: public/images/optimized/food-<name>.webp (1600px wide, ~100-200 KB)
 *
 * Run once with: node scripts/prepare-food-banners.mjs
 */
const banners = [
  ["croffle-bean-diner.png", "croffles"],
  ["crispy-bites-sharing-platter.png", "appetizers"],
  ["rice-plate-bean-diner.png", "rice-plates"],
  ["rice-bowl-donburi-bean-diner.png", "rice-bowls"],
  ["crisp-greens-salad-bean-diner.png", "salads"],
  ["optimized/pasta-beandiner.png", "pasta"],
  ["sandwich-fries-bean-diner.png", "sandwiches"],
  ["food-add-ons-bean-diner.png", "addons"],
];

await mkdir("public/images/optimized", { recursive: true });

for (const [source, name] of banners) {
  const output = `public/images/optimized/food-${name}.webp`;
  const info = await sharp(`public/images/${source}`)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toFile(output);
  console.log(`${output}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);
}
