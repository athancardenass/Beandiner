# Safari product modal pre-main inspection

Date: 26 October 2026, Asia/Manila. Base: main at 866b055.

## Review result

An independent review found two P2 regressions in the full candidate-versus-main diff. Both were fixed and independently rechecked:

- Restore initial focus, modal semantics and Tab cycling in the Safari product dialog. Focus moves to Close without page scrolling; Tab/Shift+Tab wrap Add and Close; background content remains inert.
- Keep the form scrollable on wide short touch-Safari viewports. Before the fix, Add was below the 390px landscape viewport and could not be reached by user scrolling. At 844×390, wheel input now scrolls the form from 0 to 279 without moving the page and makes Add visible.

The reviewer reported no remaining P1/P2 findings in the fix diff. Actual VoiceOver announcements and native keyboard rotation were not judged by browser emulation.

## Scope

- src/ui/Modal.tsx: specialized Safari product flow preserves the opening offset, fits the form to the keyboard area and anchors to current scrollY instead of delayed visualViewport.pageTop; restores classes/styles/theme/offset on close; restores keyboard focus and removes an unreachable experiment from the Bag branch.
- src/index.css: scoped product document/keyboard layouts and bounded form scrolling, including wide short viewports.
- scripts/check-product-modal.mjs and package.json: permanent npm run test:product-modal command, using SITE_URL or localhost:5173.
- All 52 tracked public assets match main byte-for-byte. No catalog, price, checkout-data, navigation or hosting configuration changes.
- The preexisting untracked revision plan remains untouched. No diagnostic recorder, temporary build or phone measurements are included in the source patch.

## Verification

- TypeScript, lint, 27 unit tests and production build passed.
- Permanent browser regression passed: six drinks, keyboard focus/Tab wrap, stale viewport values, 430px/332px keyboard geometry, user scrolling, normal bottom padding, exact class/style/theme/inert cleanup and return focus after keyboard activation.
- Wide Safari checks passed at 844×390, 1024×600 and 834×1194, including tablet keyboard reachability. Touch capability and Safari UA remain enabled; isMobile=false permits WebKit wheel input in the harness. No locator scrollIntoView is used to make the wide Add button reachable.
- Eight Chromium/WebKit product-and-Bag compatibility cases passed.
- Both Chromium and touch Safari passed all four routes at five widths (40 route/viewport combinations), navigation dismissal, Bag, footer and background checks.
- User confirmed physical iPhone v20 no longer lifts after Note focus. The final focus/landscape review fixes still need a quick native-device smoke check; emulation cannot prove native compositor or browser-bar rendering.

## Commit/deployment state

Reviewed files are prepared as an uncommitted working-tree diff. No commit, push or deployment was performed by this inspection. Final local production output is dist/index.html; the normal hosting pipeline will rebuild from source when a main commit is pushed.
