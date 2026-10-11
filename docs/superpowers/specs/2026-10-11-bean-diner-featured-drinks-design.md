# Bean Diner Featured Drink Selection

**Status:** Design approved by the user.

## Goal

Replace the six drinks shown in the homepage scroll selector and homepage drink cards with Bean Diner's six selected beverages, using the supplied photos and the descriptions, size options, and prices already listed in the Beverages menu. Use the requested featured labels, including “Oreo Milkshake” for the catalog item named “Oreo.” Keep the existing two Iced Spanish Lattes for ₱250 offer working.

## Scope

- The six featured drinks appear in the supplied image order: Strawberry Milk, Salted Caramel Macchiato, Oreo Milkshake, Double Dutch, Choco Pistachio, and Matcha Latte.
- The hero selector and homepage drink cards use the same featured list; the selector uses transparent cutouts and the cards keep the full-scene photos.
- The hero selector's “The Good Stuff” panel changes its ingredient notes with the selected drink. Notes are distilled only from each drink's Beverages menu description; do not add unsupported ingredient or sourcing claims.
- Product customization and bag/order data use catalog IDs and the exact size-price options from `src/beverages.ts`.
- The dedicated Beverages page remains the catalog source and is not otherwise redesigned.
- The existing Spanish Latte offer, its discount, legacy cart entries, and checkout wording remain supported independently of the new featured list.
- Supplied photos are converted to optimized WebP assets. Original files stay in the Downloads folder.

## Featured catalog mapping

Use the matching beverage records from `src/beverages.ts` as the source of names, descriptions, categories, IDs, and size-price maps:

| Image | Beverage record | Size and price |
| --- | --- | --- |
| `Strawberry milk drink 1 for hero slider.JPG` | `strawberry-milk` — Strawberry Milk | 16oz ₱160; 22oz ₱170 |
| `Salted Caramel Macchiato drink 2 for hero slider.JPG` | `iced-salted-caramel` — Salted Caramel Macchiato | 16oz ₱180; 22oz ₱190 |
| `Oreo Milkshake drink 3 for hero slider.JPG` | `shake-oreo` — menu name Oreo; featured label Oreo Milkshake | 16oz ₱180 |
| `Double Dutch drink 4 for hero slider.JPG` | `blend-double-dutch` — Double Dutch | 22oz ₱200 |
| `Choco Pistachio drink 5 for hero slider .JPG` | `blend-choco-pistachio` — Choco Pistachio | 22oz ₱200 |
| `Matcha Latte drink 6 for hero slider.JPG` | `iced-matcha-latte` — Matcha Latte | 16oz ₱170; 22oz ₱180 |

The three single-size menu entries expose only their listed size. The selector and cards show each beverage's `defaultSize` and corresponding price. Prices must come from each beverage's `prices` map; do not calculate 22oz prices with the old generic surcharge.

## Data flow and behavior

A single featured-drink mapping selects the six beverage records and associates each with its featured label and concise “The Good Stuff” ingredient notes. `ScrollStory` loads a matching transparent cutout by catalog ID, while the homepage drink grid keeps each full-scene photo. The featured label “Oreo Milkshake” is used for the `shake-oreo` catalog item, whose Beverages menu name is “Oreo.” Both views render the same mapping, so their order and labels cannot drift apart. The showcase keeps its current scroll tracking, flavor tabs, accessible labels, and add/customize action.

The homepage product modal opens at the beverage's `defaultSize` and shows only sizes listed for that drink. It calculates the base price from the selected size in `prices`; existing optional milk customization pricing remains a separate surcharge. All six featured drinks are served cold, with no hot option. Cart items use the beverage record ID so existing cart formatting can resolve the canonical name and serving size.

The Spanish Latte promo remains a separate offer product with the existing 16oz, regular-milk, iced eligibility rule and ₱250 pair price. It is not part of the six featured cards, but existing offer controls, discount math, and persisted cart entries continue to resolve the Spanish Latte record.

## Assets and presentation

Convert the six supplied photographs to full-scene WebP assets for homepage cards. Create a second, transparent cutout variant for each photo for the hero selector's layered scroll animation, preserving the cup and logo. Keep enough resolution for desktop and mobile display. The hero selector uses `object-fit: contain`; homepage cards keep the full-scene photographs. Preload the first hero cutout. Record the supplied-photo provenance and image-generation background removal in `ASSETS.md` without copying the original high-resolution files into the repository.

## Acceptance criteria

1. The selector and homepage drink cards show the six products in the specified order with matching names, descriptions, and photographs; “The Good Stuff” notes match the selected drink and stay within its menu description.
2. Selector navigation, reduced-motion behavior, accessible names, and product customization remain usable.
3. Size controls and prices match the Beverages menu for each drink, including the 16oz-only Oreo Milkshake and 22oz-only Double Dutch and Choco Pistachio.
4. Adding a featured drink to the bag records its canonical beverage ID, serving size, and correct price; order summaries resolve the correct featured label from that catalog ID.
5. The two-Iced-Spanish-Latte offer remains ₱250, keeps its eligibility rules, and retains the existing ₱40 pair savings.
6. Supplied images are optimized for the site, and the homepage preloads Strawberry Milk as the first selector item.
7. `npm run build` succeeds.

## Likely implementation files

- `src/App.tsx` — featured mapping, selector/cards, product customization and offer compatibility.
- `src/index.css` — image fit adjustments if needed for full-scene photos.
- `index.html` — first featured image preload.
- `public/images/optimized/` — six WebP derivatives.
- `ASSETS.md` — source and transformation notes.
