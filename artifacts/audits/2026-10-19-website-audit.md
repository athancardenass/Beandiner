# Bean Diner website audit

Inspection date: 19 October 2026. Local working tree; no storefront code, client copy, prices, or card/font sizes changed. Existing asset deletions were present before inspection.

## Coverage and evidence

| Surface / flow | Result |
| --- | --- |
| Home | Inspected video hero, drink hero, Better Together, final CTA, footer, contact-link destinations, and anchors. Missing cherry artwork confirmed. |
| Our Story | Desktop/mobile visual review; direct load, reload, Back and Forward exercised. Single H1 and no horizontal overflow in the responsive matrix. |
| Diner Bites | All 8 categories exercised; rendered card counts 8/11/8/4/2/8/4/8, totaling 53. Empty search and clear recovery verified. Mobile Pasta selection closed the category panel and rendered 8 cards. |
| Beverages | All 10 catalog categories exercised on mobile: 8/7/10/5/6/4/4/5/5/7, totaling 61. Top 6, Best seller, and 17 add-ons/substitutions inspected. Direct best-sellers URL rendered the correct 2 signatures. |
| Beverage search | Americano found both hot and iced products across categories. No-results state and Escape clearing exercised. |
| Food search | Current-category scope and recovery verified. The placeholder explicitly states this scope; different scope from beverage search is not classified as a defect. |
| Signature customization | Opened all 6 dialogs; inspected available choices and verified Escape dismissal. Not every possible option combination was purchased or added. |
| Food customization | Quesadilla Chicken, note, and quantity 2 produced the correct 390-peso bag line. |
| Standard drink sizes | Hot Americano 12oz selected and added at 110 pesos. |
| Better Together | Added Salted Caramel Macchiato 180 + Matcha Latte 170, both 16oz; total 350 pesos. |
| Bag | Mixed food/drink bag persisted across routes and reloads. Quantity adjustment, removal, free substitution, Undo, empty bag, and Explore menu exercised. Espresso Shot quantity 2 totaled 70 pesos. |
| Checkout | Pickup, dine-in, delivery, payment selection, required name/phone/address/custom-time checks, local summary generation, and refresh recovery inspected. No actual order sent and no Messenger/Facebook link activated. |
| Keyboard | Skip link followed by Tab reached main-content action. Modal Shift+Tab stayed inside the dialog; Escape dismissed and restored focus to bag trigger. This is a focused check, not full assistive-technology certification. |
| Responsive matrix | Four pages at five requested viewport widths: 320, 390, 768, 1024, 1440. No document horizontal overflow in all 20 cases. Browser reported effective inner widths 311, 379, 746, 994, 1398 respectively; these are desktop emulations, not physical-device results. |
| Visual inspection | Desktop Home/Story/Food; mobile Story/Food/navigation/customization/bag/checkout/footer; tablet Food. Earlier same-session desktop/mobile Beverages and checkout inspection also informs findings. |
| Build / types | `npx tsc --noEmit` passed. `npm run build -- --outDir "$env:TEMP\beandiner-audit-build"` passed; single HTML approximately 470.31 kB, 125.95 kB gzip. Temporary output avoided overwriting the existing dist working-tree changes. |
| Detector | Impeccable detector completed. Two bounce-easing warnings only; these are style preferences and are not treated as demonstrated usability defects. |

## Verified issues

P1 means prioritize before relying on the affected flow. P2 means improvement for the next focused pass. No P0 purchase-blocking failure was established; the site intentionally uses a Messenger handoff.

| Priority | Finding | Evidence and impact | Recommended direction |
| --- | --- | --- | --- |
| P1 | Local order summary is lost after refresh | `src/App.tsx:1163`, `2581`, `2584`: lastOrder is React state and the bag clears immediately. A locally generated 850-peso summary disappeared after reload, leaving zero items. Clipboard contents are not an in-site recovery mechanism. | Keep a recoverable pending draft with deliberate clearing and an appropriate expiry for customer details. |
| P1 | Scheduling does not respect store hours | Closed indicator was present while ASAP remained selectable. A local summary accepted 23:30 although published closing is 21:00. Custom time validation checks only nonempty text (`src/App.tsx:2532`). | Validate timing against confirmed operating rules and distinguish requested from confirmed timing. Owner input is needed for exceptional hours and scheduling policy. |
| P1 | Footer phone text fails normal-text contrast | Computed color rgb(212,158,119), size 11px, on the white `.footer-info-card`: calculated contrast 2.34:1, below WCAG AA 4.5:1 for normal text. | Darken the phone link while retaining exact wording and font size. |
| P1 | Delivery amount is ambiguous | Selecting delivery keeps the same items-only amount under Total. No fee amount or fee-confirmation explanation appears in the inspected checkout. | Separate items subtotal from delivery pricing once the client confirms the fee policy. Do not invent a fee or promise free delivery. |
| P2 | Missing homepage decoration and stale preload | Browser repeatedly showed broken `./images/optimized/cherry.webp`; `Ingredient` resolves it dynamically. Static file check also found `index.html:59` preloading missing `./images/optimized/latte.webp`. These relate to pre-existing asset deletions. | Reconcile intended artwork with available assets; update preload to an actual relevant asset. Do not restore unrelated deleted files without checking intent. |
| P2 | Mobile navigation logo loses contrast | Cream brand lettering appears on white in the mobile navigation overlay. This is a visual readability finding, not a WCAG logo-text failure claim. | Use the approved dark logo treatment on light surfaces. |
| P2 | Mobile summary follows the final action | Checkout DOM and mobile screenshot put Send order via Messenger before the order summary. | Move the unchanged summary above the final action; retain all client copy. |
| P2 | Video has a substantial transfer-size risk | Existing hero MP4 was measured at about 29.6 MB. Poster and metadata preload exist; code also pauses playback offscreen and for reduced motion. No throttled performance measurement was performed. | Provide a lighter mobile encode while preserving the approved video content and visual treatment. |
| P2 | Production absolute URL is unconfigured in this environment | Build warned that VITE_SITE_URL is unset; canonical, social image, and structured-data URLs fall back to relative values. This does not establish the deployed production environment is misconfigured. | Verify the actual production domain setting at deployment. |
| P2 | Existing browser-check scripts contain obsolete assumptions | `scripts/check-ordering.mjs` expects removed homepage `.social-ordering-guide` and old CTA wording; `check-bag-navigation.mjs` expects old heading Your Order; Safari script targets old #flavors / .story-stage structure. | Update regression scripts to the current approved UI before using them as release gates. They were inspected, not run as current passing suites. |

## Client-preference refinements, not defects

- Preserve all client-supplied wording, current compact cards, small text, section order, product images, and approved palette.
- Signature card CSS applies font-weight 700 broadly to headings, buttons, paragraphs, and spans. A selective weight adjustment could improve scanability without increasing font size or deleting text, subject to the client's visual approval.
- Align prices, button placement, border strength, and spacing through styling changes only.
- The absence of a hero menu CTA and the large menu introduction were noted earlier as potential conversion opportunities. They are not proven failures and are not approved copy/layout changes.

## Boundaries

This was a site-wide local audit covering every page and menu category, with representative ordering variations. It was not exhaustive testing of every product, flavor, size, or payment combination. It does not certify WCAG compliance or factual correctness of the client's menu and business claims.

Physical iOS Safari/Android, real mobile keyboards and safe areas, screen-reader output, text-zoom layouts, storage-denied recovery, network-throttled load metrics, production hosting, third-party destination availability, actual clipboard success across browsers, and merchant-side Messenger receipt remain unverified. Links were inspected locally; no external message was sent.

## Suggested revision order

1. Recoverable draft and scheduling rules.
2. Footer contrast, missing asset/preload references, and navigation logo treatment.
3. Mobile summary order and delivery-price clarity, using approved wording.
4. Video optimization, production URL configuration, and current regression checks.

No backend is required for these improvements. Any customer-facing wording or policy changes require client-approved content.

## Phase 1 implementation update

Implemented pending-summary recovery in sessionStorage with a fixed two-hour lifetime, explicit clearing, access alongside a new bag, and graceful storage failure handling. Added validation for the published Manila operating hours, future same-day custom times, and relative timing windows. Original audit findings above describe the pre-fix baseline.

Verification: 11 Node regression tests in `scripts/checkout-reliability.test.mjs`; browser checks for summary reload recovery, explicit clearing, expired/malformed summaries, preservation of a new bag, disabled closed-store timing options, and rejected 23:30 checkout. A local QA fixture seeds synthetic pending summaries without contacting Messenger. Full successful checkout during opening hours is covered at the timing/storage helper level; the live browser checks ran after closing.

Remaining phases: visual/asset fixes, delivery-policy clarification, mobile summary placement, video optimization, deployment URL verification, and updated broader browser scripts. Physical-device and real merchant handoff limitations still apply.

## Final phased revision update — 20 October 2026

All three implementation phases are complete locally. See `2026-10-20-phased-revisions.md` in this directory for the final changes, verification evidence, and deployment/device limitations. The preceding findings and Phase 1 section are historical baseline records.
