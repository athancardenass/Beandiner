# Bean Diner phased revisions

Completed locally: 20 October 2026. No deployment or actual Messenger order submission performed.

## Phase 1 — order reliability

- Latest pending summary survives a refresh in the same browser tab using sessionStorage, with a fixed two-hour lifetime and an explicit clear action.
- An existing summary remains accessible alongside new bag items. Clearing it does not clear those new items.
- Storage failure leaves the current page functional; refresh recovery is unavailable when browser storage is blocked.
- Preferred timing validates the existing daily 10 AM–9 PM Manila schedule, future same-day custom times, and relative intervals. No inventory, payment, merchant confirmation, or backend was added.

## Phase 2 — visual and checkout fixes

- Footer phone contrast improved from 2.34:1 to approximately 5.17:1 on white, using the approved accent-on-light color.
- The light navigation overlay now uses dark logo lettering.
- Checkout fields and receipt-summary surfaces use white design tokens.
- The existing order summary precedes the Send action in DOM order. The external submit control remains associated with the checkout form and triggers its existing validation.
- The preload now targets the actual video poster. The obsolete reference to a deleted decorative cherry image was removed; unrelated deleted assets were not restored.
- Delivery remains message-to-order. A small functional note explains that arrangements are confirmed in Messenger; no fee calculator, fee policy, or free-delivery claim was introduced.

## Phase 3 — performance and release checks

- Original 4K hero footage is retained unchanged (29.64 MB).
- Responsive variants: mobile 720p 3.54 MB (about 88% smaller); desktop 1080p 7.95 MB (about 73% smaller). Same video footage and frame rate; silent H.264 with progressive-playback metadata first.
- Browser currentSrc checks confirmed mobile loads the 720p file and desktop loads the 1080p file. Full encoding/download size is not a measured page-load time.
- Added reproducible encoding script, asset regression tests, npm test command, and refreshed the five core browser-check entry points around the current interface.
- Vite environment loading now honors mode-specific VITE_SITE_URL configuration. The planned beandiner.com domain is unregistered, so production URL remains blank. Absolute canonical/social/schema substitution was verified with a reserved .invalid origin in temporary output only; normal dist output was not configured with that test origin.
- The generated single-file `dist/index.html` and responsive video assets are updated.

## Verification

| Check | Result |
| --- | --- |
| npm test | 14 tests passed: timing boundaries, parsing, pending-summary expiry/storage behavior, media references, poster preload, video size and MP4 metadata order. |
| npx tsc --noEmit | Passed. |
| npm run build | Passed. Single HTML approximately 473.05 kB / 126.96 kB gzip; public images/videos remain external assets as before. |
| git diff --check | Passed after normalizing source HTML line endings. |
| Refreshed browser checkAll functions | Passed through the connected browser's documented APIs: 20 page/viewport combinations, bundle/bag, synthetic pending-summary recovery, validation, footer/logo, and document backgrounds. Standalone CLI browser launchers were not separately executed. |
| Compiled build smoke checks | All four routes at mobile and desktop widths: no horizontal overflow or observed broken images. Compiled bundle/bag persistence and footer/mobile-logo checks passed. |
| Independent review | No actionable P1/P2 findings in Phase 1 or final scoped review. |
| Client text preservation | AST comparison confirmed all existing App JSX text retained. Functional recovery buttons, validation messages, and delivery helper were additions. Existing card sizes, menu font sizes, prices, and catalog files remain unchanged. |
| Existing user changes | The 90 pre-existing asset deletions and unrelated untracked revision plan remain preserved. Original hero video has no diff. |

## Remaining external verification

- Register/connect the domain, then set the actual VITE_SITE_URL and verify sharing metadata on the deployed host. No domain was purchased or deployment performed.
- Check physical iOS Safari and Android, real mobile keyboards, browser clipboard behavior, and an owner-approved actual Messenger handoff before launch.
- No full WCAG certification, Lighthouse/Core Web Vitals claim, or network-throttled load-time claim is made. The legacy scroll-profiling utility is outside these refreshed functional checks.
