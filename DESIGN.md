# Bean Diner storefront: art direction and implementation

## Current direction
The page presents Bean Diner in Bayambang with a modern, warm, coffee/diner-inspired brand identity. The client-approved palette features:
- **Cream (`#FFF0D6`)** for typography on dark backgrounds. Cream is not used for UI backgrounds, gradients, borders, or decorative surface fills.
- **White (`#FFFFFF`)** for light page surfaces, menu cards, sticky menu controls, and buttons. Buttons use `#1A1A1A` text, `#D0D0D0` borders, and `#F7F7F7` hover backgrounds; card borders use `#EAEAEA`.
- **Warm Pine / Caramel (`#D49E77`)** for brand accents on dark sections; `#8c6546` keeps accent text readable on white surfaces.
- **Warm Gray / Brown (`#6E6256`, light `#8A7D70`)** for secondary and muted body text, supporting UI, and subtle borders.
- **Black (`#121212`, raised `#1c1c1c`)** as the dominant dark tone for header, hero, footer, major dark sections, and primary dark text.
Facebook remains recognizable through its icon and label. Messenger actions follow the white-button treatment. DM Serif Display carries the larger editorial headings, DM Sans supports interface text, and Caveat is reserved for handwritten accents; Bricolage Grotesque adds weight to selected display labels. Fonts load from Google Fonts.

The homepage contains the latest video hero, drink hero, Better Together offer, final call to action, and footer. Their existing `#121212` section backgrounds remain. Story content lives at `?page=our-story` on white and ends without the shared footer. Top 6 signatures is the first and default category within the main beverage directory, followed by Best seller and the existing beverage categories. One shared sticky category bar and search field serve the directory; web and tablet category chips scroll horizontally, while phones keep Top 6 and Best seller visible and offer the remaining categories in an expandable list that closes after selection. The mobile control continues to show the selected category after closing, and search covers the full beverage catalog regardless of selected category. Signature cards keep their individual media-panel colors inside white cards. Both menu pages omit All Drinks/All Menu tabs, closing promotional banners, and the shared footer. Home retains the shared footer. Product data and prices come from the existing beverage and food catalogs rather than duplicated preview records.

## Interaction and responsive behavior
Native CSS, passive scroll handling, and IntersectionObserver retain the existing hero motion and reduced-motion support. The beverage directory starts with all six featured drinks. Top 6 and Best seller use the shared category search and preserve their image hover interaction, customization modal, and bold card text. Their colored image panels extend to the card's top and side edges; text and actions keep their inset spacing. Category and query state live beside the existing customization state in App; the menu page renders the selected category and its matching result count. Clearing search retains that category. Mobile category controls use 44px targets, visible focus, and accessible selected states. Top 6 links select its six-card view; Best sellers links select the two-card view. The bag persists in localStorage and carries across all four pages. Signature cards use compact responsive columns and two columns on phones; full beverage and food catalogs use one column on phones. The Our Story route omits the shared footer. Mobile browser surfaces follow the visible white or dark section.

## Prices and ordering
The Better Together offer adds one 16 oz Salted Caramel Macchiato and one 16 oz Matcha Latte. Its displayed price is derived from those canonical menu prices, currently ₱180 + ₱170 = ₱350. Other menu prices, size options, and cart behavior remain sourced from the existing catalog and customization code.

Checkout validates a pickup name, copies the name and order summary to the clipboard, and opens Bean Diner’s Messenger conversation for the customer to paste and finalize the order. This frontend does not process payment, confirm availability, or submit the order to a merchant system. Cart data is held in localStorage; the checkout flow acts only after the customer submits the form.

## Handoff notes
Before relying on the page for live commerce, verify current menu details, location and business claims, image rights, allergens, availability, and offer terms with the owner. Connect actual inventory, pricing, payment, and fulfillment systems if the site should take orders directly. Add appropriate privacy and legal information for the real operation. No payment or fulfillment is implied by the current interface.

Verify types with `npx tsc --noEmit` and build with `npm run build`. Asset preparation: `node scripts/prepare-assets.mjs`. The latest hero video remains at `public/videos/bean-diner-hero-4k30.mp4`.
