# Hero Drink Image Refresh Spec

## Goal
Use the six current numbered drink photos in the existing scroll-driven hero selector, with transparent cup cutouts and product details that match the beverages menu.

## Numbered image order
1. Honey Lemon Butterfly Pea
2. Strawberry Milk
3. Oreo Milkshake
4. Double Dutch
5. Choco Pistachio
6. Matcha Latte

## Scope
- Remove only the photo backgrounds and normalize cup scale/framing on transparent canvases.
- Use the six menu-backed featured drinks in both `ScrollStory` and the homepage signature cards, including their matching names, descriptions, prices, available sizes, and transparent photos.
- Keep hero copy/layout, Spanish Latte offer, and scroll behavior unchanged.
- Use the supplied Salted Caramel Macchiato photo as the main hero drink, with its menu name and starting price.
- Keep the original source photos untouched.

## Acceptance
- Six transparent WebP cutouts are stored under `public/images/hero-drinks/` in numbered order.
- Full cup, lid, visible drink details, and Bean Diner branding remain intact.
- All cups appear at a comparable height in the selector.
- Homepage cards and selector use the same six menu-backed drinks and transparent photos.
- Prices and sizes match the beverages menu in the homepage cards, selector, and ordering modal.
- The Spanish Latte offer remains unchanged.
- The main hero image and caption show the Salted Caramel Macchiato.
- `npm run build` succeeds.
