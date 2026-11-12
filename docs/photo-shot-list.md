# Bean Diner menu photo shot list

The website shows a photo only for items that have their own real photo. 17 of 106 menu items have one today. Every new photo goes live by adding one line to the menu data (see "Adding a photo" below), with no design change.

## How to shoot

- **Where:** the same counter and backlit "BEAN DINER" wall used for the existing category photos, so every photo matches.
- **Light:** daylight or the usual café lights. No flash.
- **Angle:**
  - Drinks: straight on, at cup height.
  - Plates and bowls: about 45° from above.
- **Frame:** square (1:1). The item fills about two-thirds of the frame and sits in the center.
- **One item per photo:**
  - Use the real serving cup, plate or basket.
  - Use the real portion as served.
  - Don't add garnish that customers don't get.
- **Phone:** any recent phone. Use the main camera (1x), not the zoom or wide lens. Wipe the lens first.
- **File name:** the item ID from the tables below, for example `iced-spanish-latte.jpg`.

## Shoot first (earned badges, no photo yet)

These items carry a Best Seller, House Special, Signature, Chef's Pick, New Special, Best Value or Oatside Collab badge. Customers look for them first.

### Drinks

| Item | Category | ID | Badge |
|------|----------|----|-------|
| Spanish Latte (iced) | Over Iced - Coffee Base Latte | iced-spanish-latte | Best Seller |
| Spanish Latte (hot) | Hot Beverage - Coffee Base | hot-spanish-latte | Best Seller |
| Sea Salt Crème | Over Iced - Cloudy Coffee | sea-salt-creme | Best Seller |
| Biscoff (blend) | Iced Blends - Coffee Base | blend-biscoff | Best Seller |
| Biscoff (milkshake) | Iced Blends - Milkshake | shake-biscoff | Best Seller |
| Salted Caramel Macchiato (hot) | Hot Beverage - Coffee Base | hot-salted-caramel | House Special |
| Chocolate Ash Mocha | Over Iced - Cloudy Coffee | chocolate-ash-mocha | House Special |
| Sea Salt Crème Matcha | Over Iced - Matcha Mania | sea-salt-matcha | House Special |
| Oreo Matcha (milkshake) | Iced Blends - Milkshake | shake-oreo-matcha | House Special |
| Caramel Macchiato (hot) | Hot Beverage - Coffee Base | hot-caramel-macchiato | Signature |
| Toffee Oat Latte | Over Iced - Coffee Base Latte | iced-toffee-oat | Signature |
| Kalmado | Iced Blends - Non-Coffee | blend-kalmado | Signature |
| Pistachio Latte | Over Iced - Coffee Base Latte | iced-pistachio-latte | New Special |
| Spanish Oat Latte | Over Iced - Coffee Base Latte | iced-spanish-oat | Oatside Collab |
| Matcha Oat Latte | Over Iced - Matcha Mania | iced-matcha-oat | Oatside Collab |

### Diner bites

| Item | Category | ID | Badge |
|------|----------|----|-------|
| Chocolate croffle | Croffle | chocolate-croffle | Best Seller |
| Chicken Wings | Appetizer | chicken-wings | Best Seller |
| Chicken Alfredo | Pasta | chicken-alfredo-pasta | Best Seller |
| Fish & Chips | Appetizer | fish-chips | House Special |
| Beef Caldereta | Rice Plate | beef-caldereta | House Special |
| Shrimp Red Pesto | Pasta | shrimp-red-pesto | House Special |
| Nutella Almond croffle | Croffle | nutella-almond-croffle | Chef's Pick |
| Truffle Mushroom | Pasta | truffle-mushroom-pasta | Chef's Pick |
| Garlic Parmesan Chicken | Rice Bowl | garlic-parmesan-chicken-bowl | Signature |
| Pistachio croffle | Croffle | pistachio-croffle | New Special |
| Chicken Barbecue | Rice Plate | chicken-barbecue | New Special |
| Potato Fries (flavored) | Appetizer | potato-fries-flavored | Best Value |
| Teriyaki Chicken Katsu | Rice Bowl | teriyaki-chicken-katsu | Best Value |

That's 28 items. A relaxed half-day covers them, since many drinks share a cup and only the drink changes.

## Already have a real photo

- **Drinks:**
  - Top 6: Honey Lemon Butterfly Pea, Strawberry Milk, Oreo Milkshake, Double Dutch, Choco Pistachio, Matcha Latte.
  - Also: iced Salted Caramel Macchiato, iced Cafe Latte, iced Caramel Macchiato.
- **Diner bites:** Biscoff Caramel croffle, Mexican Nachos, Potato Feast, BD Crispy Chicken, Korean Beef Mushroom, Chicken Caesar salad, Chicken Pesto, Chicken Caesar Wrap.

## Adding a photo

1. Export the photo square, about 1200×1200, as `.webp`. Put it in `public/images/menu/<item-id>.webp`.
2. In `src/beverages.ts` or `src/dinerBites.ts`, find the item by its `"id"` and add this line below it:
   `"photo": "./images/menu/<item-id>.webp",`
3. Run `npm run build`. The card and the order bag show the photo from then on.

Never use a photo of a different item, a category photo, a stock photo or an AI-generated image for a menu item. Guests expect to receive what they see.
