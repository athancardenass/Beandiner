# Site Stability Implementation Plan

> Execute inline using executing-plans; preserve existing user changes.

**Goal:** Resolve the checkout browser timeout and resize warning, audit deleted media, and verify the current storefront.

**Architecture:** Keep existing React checkout and viewport hooks. Patch only mechanisms demonstrated to fail; keep the single-file Vite build.

**Tech Stack:** React 19, TypeScript, Vite, Playwright Chromium/WebKit, Node test runner.

**Spec:** User-approved stability cleanup in this chat, 2026-10-20.

## Constraints and Review Focus

- Preserve the existing 90 media deletions unless a live reference requires recovery.
- Keep white menu content and dark overscroll chrome; preserve ordering and cart behavior.
- No new dependencies or unrelated redesign; no external order messages.
- Native iPhone Safari validation remains a device check; WebKit is automated coverage only.

## Tasks

- [x] Reproduce `checkOrdering` timeout in `scripts/site-checks.mjs`; inspect actual checkout UI and patch the responsible layer. Run focused ordering proof.
- [x] Instrument existing ResizeObserver callbacks to identify the source of WebKit warnings; add a focused browser regression and fix the owning hook. Verify header/menu offsets and observer cleanup.
- [x] Audit deleted public media against source and runtime requests. Recover only required assets, and document confirmed unused deletions.
- [x] Run unit tests, TypeScript, build, Chromium/WebKit site checks and menu overscroll checks. Review final diff/status and record remaining device verification.

## Results

- Checkout failure reproduced: name validation on blur inserted an error row between pointer down/up, moving Custom time from y=795.7 to y=831.3. The click landed on the timing container. Keep errors visible during focus and validate edited values on input; remove the redundant focus state and blur updates. Focused ordering checks now pass in Chromium/WebKit; regression asserts submitted name errors remain visible and corrected name/phone errors clear.
- Layout regression failed with three WebKit ResizeObserver loop errors before the fix. Header offset writes changed ancestor layout inside the observer delivery cycle. Schedule them in one animation frame, skip unchanged properties, and cancel pending work on cleanup. Regression now passes in Chromium/WebKit across four widths, four routes, explicit header resizing, and route teardown.
- Audited 45 deleted public images and 45 matching dist copies: no literal live source references. Existing asset/ingredient reference tests pass. Browser coverage decodes images on all four routes and every desktop menu category; no broken rendered media. No further assets removed or restored.
- `npm test`: 14/14 pass. `npx tsc --noEmit`: pass. `npm run build`: pass; refreshed `dist/index.html`.
- `checkAll`: Chromium and WebKit pass, including checkout, cart, routes at 320/390/768/1024/1440px, footer, canvas and media checks. `check-layout-stability.mjs` and `check-menu-overscroll.mjs`: Chromium and WebKit pass.
- Remaining: actual iPhone Safari toolbar/bounce check; production `VITE_SITE_URL` must be configured before final social-sharing validation. Build reports this existing configuration warning. No push, commit, deployment or external order message.
