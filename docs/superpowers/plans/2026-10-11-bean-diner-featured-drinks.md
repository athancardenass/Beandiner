# Bean Diner Featured Drinks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the six homepage selector drinks and featured drink cards with the selected Beverages menu items, photos, prices, sizes, descriptions, requested display labels, and matching “The Good Stuff” notes.

**Architecture:** Keep one ordered featured-product mapping in `src/App.tsx`, sourced by canonical IDs from `allBeverages`, with the requested display labels and only small visual metadata and ingredient notes alongside it. Use that mapping for the scroll selector and drink cards; retain the Spanish Latte as separate legacy offer data so the existing offer and stored `latte` cart entries continue to work.

**Tech Stack:** React 19, TypeScript, Vite, `sharp` (already installed for image optimization).

**Spec:** `docs/superpowers/specs/2026-10-11-bean-diner-featured-drinks-design.md`

## Global Constraints

- The hero selector and homepage drink cards use the same featured list; the selector uses transparent cutouts while cards keep the full-scene photos.
- Product customization and bag/order data use catalog IDs and the exact size-price options from `src/beverages.ts`.
- The dedicated Beverages page remains the catalog source and is not otherwise redesigned.
- The existing Spanish Latte offer, its discount, legacy cart entries, and checkout wording remain supported independently of the new featured list.
- All six featured drinks are served cold, with no hot option.
- Original files stay in the Downloads folder.
- Prices come from each beverage's `prices` map; do not calculate 22oz prices with the old generic surcharge.

## Review Focus

- Single-size drinks expose only their listed size; 22oz-only drinks default to 22oz.
- Every displayed size uses the corresponding menu price, including the old generic size surcharge being removed for these six items.
- New cart entries store canonical beverage IDs and resolve to the correct featured labels in summaries, including `shake-oreo` → “Oreo Milkshake.”
- Existing `latte` cart entries and the ₱250 pair offer keep their current eligibility and ₱40 savings.
- “The Good Stuff” notes stay within the selected drink's Beverages description and change with selector navigation.

---

### Task 1: Prepare optimized supplied drink photos

**Files:**
- Create: `public/images/optimized/strawberry-milk.webp`
- Create: `public/images/optimized/iced-salted-caramel.webp`
- Create: `public/images/optimized/shake-oreo.webp`
- Create: `public/images/optimized/blend-double-dutch.webp`
- Create: `public/images/optimized/blend-choco-pistachio.webp`
- Create: `public/images/optimized/iced-matcha-latte.webp`
- Modify: `index.html` — preload `./images/optimized/strawberry-milk.webp`.
- Modify: `ASSETS.md` — record the supplied source filenames and WebP conversion.

**Interfaces:**
- Consumes: six original JPEG photos from `C:\Users\Menaze\Downloads\Bean Diner`.
- Produces: six optimized WebP assets at the paths above; the original source photos remain in Downloads.

- [x] Convert each source photograph listed in the spec to its matching WebP output under `public/images/optimized/`. Retain enough detail for the desktop selector and homepage card crops.
- [x] Replace the homepage preload target in `index.html` with Strawberry Milk, the first selector item.
- [x] Append asset provenance to `ASSETS.md`, identifying the six user-supplied source filenames and their optimized output filenames. Do not copy the originals into the repository.
- [x] Confirm all six output files exist.

### Task 2: Wire the featured catalog into the homepage

**Files:**
- Modify: `src/App.tsx` — product model, featured mapping, selector, “The Good Stuff” notes, homepage cards, customization modal, cart compatibility, and offer data.
- Modify: `src/index.css` — adjust the selector image framing for the full-scene photos only if needed.

**Interfaces:**
- Consumes: `allBeverages: BeverageItem[]`, each beverage's `id`, `name`, `description`, `prices`, `defaultSize`, `type`, and `badge` from `src/beverages.ts`; photo paths produced by Task 1.
- Produces: one ordered `featuredProducts` array used by `ScrollStory` and the homepage drink grid; a separate Spanish Latte offer product retaining legacy ID `latte` and current ₱145 base price.

- [x] Map the six canonical IDs in spec order: `strawberry-milk`, `iced-salted-caramel`, `shake-oreo`, `blend-double-dutch`, `blend-choco-pistachio`, `iced-matcha-latte`. Use the requested featured label “Oreo Milkshake” for `shake-oreo`, whose catalog name is “Oreo.” Read the other names, descriptions, categories, default sizes, and price maps from their catalog records. Keep only image name, visual color/word, and “The Good Stuff” notes as featured metadata; derive those notes only from the matching menu description.
- [x] Keep a separate Spanish Latte legacy product with ID `latte`, name `Iced Spanish Latte`, and ₱145 base price. Keep `spanishLatteBundlePrice` at ₱250 and its savings at ₱40; continue accepting persisted `latte` cart entries.
- [x] Render both the scroll selector and homepage drink grid from `featuredProducts`. Show each item's featured label, menu description, default size, exact price, matching image, and current “The Good Stuff” notes. Keep selector order, accessible names, scroll tracking, reduced-motion behavior, and add/customize actions.
- [x] Update the product modal to initialize the catalog `defaultSize`, offer only keys present in the product's `prices`, calculate base price from the selected size, and keep the existing optional milk surcharge separate. Fix temperature to iced for all six featured drinks. Store canonical beverage IDs for new cart items.
- [x] Update homepage drink filter counts to match the selected records' `type` and badge-based Best sellers filter; preserve filter behavior, the Spanish Latte offer controls, and checkout wording.
- [x] Keep each product prominent in the scroll selector without clipping; its transparent cutout uses `object-fit: contain`, while cards retain the full-scene image.
- [x] Run `npm run build` and confirm Vite completes successfully.

### Follow-up: Transparent hero cutouts

- Generate transparent PNG cutouts from the six user-supplied hero photos using the built-in image generator's background removal.
- Crop each cutout to its largest connected foreground component with transparent padding, then convert to alpha WebP variants under `public/images/optimized/*-cutout.webp`; preserve original full-scene WebPs for homepage cards.
- Load cutout variants only in `ScrollStory`, use `object-fit: contain`, and preload the first cutout.
- Keep swipe cups visible outside their image frame, with centered and shorter horizontal travel on mobile to prevent edge clipping.
- Record provenance in `ASSETS.md` and verify the production build.
