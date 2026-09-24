import sharp from "sharp";
import { mkdir } from "node:fs/promises";

/**
 * Build optimized WebP assets before deploy.
 *
 * Maps to: public/images/optimized outputs for product photos,
 * ingredient cutouts, and editorial imagery.
 */
// ↓ OUTPUT DIR: Create optimized images directory
await mkdir("public/images/optimized", { recursive: true });
// ↓ CUTOUT FUNCTION: Remove background from product/ingredient images
async function cutout(input, output, region) {
  let pipeline = sharp(input);
  if (region) pipeline = pipeline.extract(region);
  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0,
    tail = 0;
  function push(p) {
    if (p < 0 || p >= w * h || visited[p]) return;
    const i = p * 4;
    if (Math.min(data[i], data[i + 1], data[i + 2]) < 232) return;
    visited[p] = 1;
    queue[tail++] = p;
  }
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (head < tail) {
    const p = queue[head++];
    data[p * 4 + 3] = 0;
    if (p % w) push(p - 1);
    if (p % w < w - 1) push(p + 1);
    push(p - w);
    push(p + w);
  }
  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (data[(y * w + x) * 4 + 3]) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
  const left = Math.max(0, minX - 8),
    top = Math.max(0, minY - 8);
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({
      left,
      top,
      width: Math.min(w - left, maxX - minX + 17),
      height: Math.min(h - top, maxY - minY + 17),
    })
    .resize({ height: 900, withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 100 })
    .toFile(output);
}
// ↓ PRODUCTS: Process six signature drink cutouts
for (const name of ["latte", "ube", "matcha", "spanish", "barako", "coldbrew"])
  await cutout(
    `public/images/saya-${name}.png`,
    `public/images/optimized/${name}.webp`,
  );
// ↓ INGREDIENTS: Extract bean, leaf, cherry, ice from sprite sheet
const metadata = await sharp("public/images/ingredient-sheet.png").metadata();
const w = Math.floor(metadata.width / 2),
  h = Math.floor(metadata.height / 2);
for (const [index, name] of ["bean", "leaf", "cherry", "ice"].entries())
  await cutout(
    "public/images/ingredient-sheet.png",
    `public/images/optimized/${name}.webp`,
    {
      left: (index % 2) * w,
      top: Math.floor(index / 2) * h,
      width: w,
      height: h,
    },
  );
// ↓ EDITORIAL: Resize and optimize merienda (lifestyle) photo
await sharp("public/images/saya-merienda.png")
  .resize({ width: 1200 })
  .webp({ quality: 85 })
  .toFile("public/images/optimized/merienda.webp");
console.log(
  "Prepared six transparent products, four independent ingredients, and editorial photography.",
);
