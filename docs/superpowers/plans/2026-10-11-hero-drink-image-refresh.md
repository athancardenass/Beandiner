# Hero Drink Image Refresh Implementation Plan

> **For agentic workers:** Use inline execution for this bounded asset update.

**Goal:** Refresh the six homepage featured drinks and `ScrollStory` with numbered transparent cutouts and menu-matched product details.

**Architecture:** Store normalized transparent WebP assets in `public/images/hero-drinks/`. Use the shared six-item `heroSelectorProducts` collection for both homepage signature cards and the hero selector, deriving prices, descriptions, and available sizes from `allBeverages`.

**Tech Stack:** React, TypeScript, Vite, Sharp, built-in image generation.

**Spec:** `docs/superpowers/specs/2026-10-11-hero-drink-image-refresh.md`

## Global Constraints
- Preserve cup, drink, lid, and Bean Diner branding from each supplied photo.
- Match selector names, descriptions, prices, and sizes to the beverages menu.
- Preserve the hero copy/layout, the Spanish Latte offer, and scroll animation.
- Keep changes within the current managed worktree.

## Review Focus
- Transparent edge cleanup around clear lids.
- Consistent visible cup height despite source aspect ratio differences.
- Correct numbered order for all six files.
- Homepage drink cards and selector use the same six transparent drink images.

---

### Task 1: Prepare and connect hero selector assets

**Files:**
- Create: `public/images/hero-drinks/drink-01-honey-lemon.webp`
- Create: `public/images/hero-drinks/drink-02-strawberry-milk.webp`
- Create: `public/images/hero-drinks/drink-03-oreo-milkshake.webp`
- Create: `public/images/hero-drinks/drink-04-double-dutch.webp`
- Create: `public/images/hero-drinks/drink-05-choco-pistachio.webp`
- Create: `public/images/hero-drinks/drink-06-matcha-latte.webp`
- Modify: `src/App.tsx` at the `ScrollStory` image source mapping.

**Interfaces:**
- Consumes: the six numbered source photos and approved image-only scope.
- Produces: `heroStoryImages[i]` as the URL for drink number `i + 1`.

- [x] Create the six transparent cutouts, preserving their cup and branding.
- [x] Normalize each cup to the same visible height and transparent canvas.
- [x] Use the new URLs only in the `ScrollStory` image list.
- [x] Run `npm run build`; expected result: successful Vite build.

### Task 2: Match selector products to the beverages menu

**Files:**
- Modify: `src/App.tsx` featured selector product data, order modal, and cart product lookup.
- Modify: `docs/superpowers/specs/2026-10-11-hero-drink-image-refresh.md` and this plan.

**Interfaces:**
- Consumes: the six numbered photos and matching entries in `allBeverages`.
- Produces: six selector items whose display details and order sizes/prices follow the beverages menu.

- [x] Add featured product data tied to the six beverage menu entries.
- [x] Show menu default sizes and prices in the selector and exact menu size prices in the order modal.
- [x] Reuse the six menu-backed selector products in homepage signature cards and preserve the Spanish Latte two-cup offer.

### Task 3: Use Salted Caramel Macchiato in the main hero

**Files:**
- Create: `public/images/hero-drinks/salted-caramel-macchiato-header.webp`
- Modify: `src/App.tsx` main hero image and caption.

- [x] Create a transparent cutout from the supplied header drink photo.
- [x] Match the visible hero label and price to the iced Salted Caramel Macchiato menu entry.
- [x] Leave the main hero copy/layout and Spanish Latte promo unchanged.
