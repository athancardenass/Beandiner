# SAYA Coffee: art direction and implementation

## Original identity
SAYA is a fictional Filipino-inspired modern coffee brand. Saya means happiness. Tagline: A little cup of happy. Product names and copy were written for this campaign. No existing Philippine brand, Do Smoothie logo, artwork, character, or packaging was reused.

Visual world: sunlit editorial coffee campaign. Sea-glass mint #d3e8df, guava red #b9372c, warm paper #fbf5e9, botanical ink #343b32. Each flavor has a complementary background. DM Serif Display is the expressive headline and wordmark font; DM Sans is the interface/body family; Caveat is used sparingly for personal handwritten annotations. All are Google Fonts with SIL OFL licenses. Reference: https://github.com/google/fonts/tree/main/ofl/dmserifdisplay and sibling dmsans/caveat folders. Fonts served via Google Fonts with display=swap.

## Experience
Persuasion + experience: coffee is the continuous visual protagonist. Large-scale typography, independently animated hand-painted ingredients, photoreal product cutouts, and a six-flavor pinned scene. The reference was reviewed for product-led sequencing, not copied. The requested Impeccable and Taste skill repositories were consulted for composition, purposeful motion, responsive layout, real imagery, accessibility, and bounded verification. Brief-driven editorial typography and playful compositions take precedence over generic skill defaults.

Animation uses native CSS, a passive scroll listener coalesced with requestAnimationFrame, and IntersectionObserver. React only changes state when the active flavor changes; per-frame cup transforms are written directly to DOM elements. Product transitions translate, rotate, scale, and alter opacity; ingredients rotate and move independently; the palette and display typography change with flavor. No animation framework is loaded. Skipping to menu and directly selecting a flavor are both supported. Reduced motion disables loops, reveals, parallax and smooth scrolling; all products remain available in the menu and story navigation.

Mobile: re-composed type and product placement, simplified decoration, compact product stage, two-column menu, full-width mobile navigation, and single-column customization.

## Conversion behavior
Six drinks, prices in Philippine pesos, hot/iced selection, two sizes, dairy/oat where relevant, quantity controls, best-seller and non-coffee filters. Cart persists in localStorage when available. Two eligible regular-milk 16 oz iced Daily Sayas receive a ₱40 pair discount automatically; eligible quantities are paired downwards. No discount applies to other options. Checkout validates a first name and displays an honest demo receipt. No personal information is sent over the network or stored. No payment processor, inventory service, address, cafe opening hours or sourcing relationship is fabricated.

## Production handoff
This is a complete frontend campaign and demonstrable ordering interface, not an operating merchant backend. Before commercial launch: obtain appropriate rights assurance for the supplied image-generator output, replace the fictional business content as needed, connect validated inventory/pricing/payment/fulfillment services, define actual allergens, add jurisdiction-appropriate legal/privacy information, and set an absolute deployed URL for social previews. No real payment or fulfillment is implied.

Build: npm run build. Asset preparation: node scripts/prepare-assets.mjs. Browser smoke test: start Vite, then node scripts/check-site.mjs (requires Playwright Chromium and system dependencies).
