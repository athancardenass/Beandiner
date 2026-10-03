# Bean Diner storefront: art direction and implementation

## Current direction
The page presents Bean Diner in Bayambang with a modern, warm, coffee/diner-inspired brand identity. The client-approved palette features:
- **Dirty Cream (`#FFF0D6`)** as the primary light background, light sections, cards, and light text on dark backgrounds.
- **Warm Pine / Caramel (`#D49E77`, hover `#B9825F`)** as the primary CTA button fill, brand accents, highlights, active states, and visual emphasis.
- **Warm Gray / Brown (`#6E6256`, light `#8A7D70`)** for secondary and muted body text, supporting UI, and subtle borders.
- **Black (`#121212`, raised `#1c1c1c`)** as the dominant dark tone for header, hero, footer, major dark sections, and primary dark text.
Facebook and Messenger keep their recognizable blue (`#0084FF`). DM Serif Display carries the larger editorial headings, DM Sans supports interface text, and Caveat is reserved for handwritten accents; Bricolage Grotesque adds weight to selected display labels. Fonts load from Google Fonts.

The homepage keeps its hero, flavor story, drinks menu, a two-item diner bites preview, brand story, two-cup offer, and footer. A dedicated `?page=diner-bites` view presents four existing priced foods and 11 clearly labeled sample menu ideas in a photo-free editorial menu. Sample items have no listed price or ordering action until their real details are confirmed. The hero and offer still use drink photography; food items use names, descriptions, and badges without substitute images.

## Interaction and responsive behavior
The flavor story supports both scrolling and direct flavor selection. Native CSS, a passive scroll listener, and IntersectionObserver drive the motion; reduced-motion preferences disable animated transitions and smooth scrolling. The menu can filter all drinks, best sellers, coffee, or non-coffee. Drink customization supports hot or iced, two sizes, milk choices where available, and quantity controls. The bag persists in localStorage when available and carries across the homepage and food view. The food view uses two columns on larger screens and one column on phones. Mobile layouts recompose the homepage hero and product stage, keep the header available, use a two-column drinks menu, and provide a navigation dialog. Buttons and controls use larger mobile targets, and menu selectors have accessible group labels and selected states.

## Prices and ordering
The owner-approved reference price is **Iced Spanish Latte ₱145**. The offer remains **two 16 oz iced Spanish Lattes with regular milk for ₱250** (₱40 off the ₱290 combined menu price). The cart applies the pair discount to eligible quantities automatically; other sizes, milk, or temperatures do not qualify. The cup price, offer price, savings, and “usual” total are derived together in the interface.

Checkout validates a pickup name, copies the name and order summary to the clipboard, and opens Bean Diner’s Messenger conversation for the customer to paste and finalize the order. This frontend does not process payment, confirm availability, or submit the order to a merchant system. Cart data is held in localStorage; the checkout flow acts only after the customer submits the form.

## Handoff notes
Before relying on the page for live commerce, verify current menu details, location and business claims, image rights, allergens, availability, and offer terms with the owner. Connect actual inventory, pricing, payment, and fulfillment systems if the site should take orders directly. Add appropriate privacy and legal information for the real operation. No payment or fulfillment is implied by the current interface.

Build: `npm run build -- --configLoader runner`. Asset preparation: `node scripts/prepare-assets.mjs`. The repository also includes a browser smoke-check script at `node scripts/check-site.mjs`.
