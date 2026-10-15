# iOS Safari Safe Area Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Do not change the drink-selection animation or desktop layout.

**Goal:** Remove the floating Messenger control and prevent the cream page canvas from showing through Safari's bottom chrome.

**Architecture:** Move the existing Messenger anchor into the existing footer, retaining its URL and mobile deep-link handler. Match the mobile document canvas to the solid footer background and enable safe-area coverage without changing scroll animation geometry.

**Tech Stack:** React 19, TypeScript, existing Tailwind/CSS, Vite singlefile; no new dependencies.

## Findings

- `src/index.css` sets the document root background to `#FFF0D6`; body is transparent. This is the identified cream canvas source, but its contribution to the reported Safari strip needs real-device confirmation.
- `.footer-artisanal` uses `--espresso` (`#121212`). Existing theme-color is already `#121212` and should remain unchanged.
- `index.html` lacks viewport-fit=cover.
- Messenger is rendered after the footer and modals as `.floating-messenger`. Its fixed desktop rule and mobile overrides cause it to track the browser viewport.
- There are no literal `100vh` layout declarations. Do not indiscriminately replace `svh` with `dvh`: changing story height changes scroll animation timing. The `460vh` scroll-story duration is deliberate and outside this fix.

## Task 1: Messenger placement

- [x] Move the complete existing Messenger anchor into `.footer-artisanal`, after the footer information content and before the closing footer tag. Rename its class to `footer-messenger`.
- [x] Keep getMessengerUrl(), target, rel, aria-label and mobile openMessengerApp() behavior. These helpers are shared with checkout; do not delete them.
- [x] Delete all `.floating-messenger` selectors, including hover, mobile span hiding, and 360–440px overrides. No independent positioning JS exists for this anchor.
- [x] Style the new in-flow link blue, with at least 44px height, comfortable horizontal padding, a visible keyboard focus state and 24px separation. No fixed/sticky positioning or viewport sizing.
- [x] Keep the existing footer Messenger navigation link unchanged unless the user requests deduplication.

## Task 2: Safari canvas and safe area

- [x] Set viewport meta to width=device-width, initial-scale=1, viewport-fit=cover.
- [x] Under the existing mobile breakpoint (max-width:820px), set html and body background to var(--espresso). Keep desktop root styling unchanged.
- [x] Extend the existing mobile footer bottom padding (120px) by env(safe-area-inset-bottom,0px). Preserve its existing bag-visible 100px reservation with the inset included. Avoid overwriting either reservation with only the inset.
- [x] Retain theme-color #121212, which matches header and footer.
- [x] Review remaining vh rules. If a literal 100vh rule is introduced or discovered in another source, add its existing vh fallback followed by the equivalent dvh rule; do not alter svh animation/dialog rules by blanket substitution.

## Task 3: Verification and delivery

- [x] Browser checks: footer link is inside footer, computes to normal flow, has >=44px target height and works by keyboard. No `.floating-messenger` remains.
- [x] Chromium Android-style responsive checks at 360x640 and 412x915; WebKit checks at iPhone portrait/landscape sizes; desktop comparison at 1440x900.
- [x] Check bag empty and nonempty, footer safe-area spacing, checkout Messenger links, and no horizontal overflow.
- [x] Run npx tsc --noEmit and npm run build. Inspect final diff for unintended layout changes.
- [ ] On actual iOS Safari or an iOS simulator, test initial load, scroll bottom/back, expanded/collapsed toolbars and orientation changes. Desktop WebKit cannot validate native Safari chrome; report this check as outstanding if unavailable.
- [x] Deliver actual diff, canvas source, verification evidence and list of retained fixed/viewport rules. Do not push/deploy without user instruction.

## Rules deliberately retained

- Fixed page-progress bar, focused skip link, toast and floating bag.
- Shared mobile Messenger deep-link timeout/visibility behavior, used by checkout.
- Story duration 460vh / mobile 440svh; panel 100svh; dialog 100svh and smaller svh limits. None are literal 100vh declarations.


Execution notes: Applied in the shared local checkout for the existing preview. Chromium and desktop WebKit checks passed at 360, 412, 430, 932, and 1440px; TypeScript, build and diff checks passed. Actual iPhone toolbar testing remains outstanding. Existing 932px desktop-header overflow was observed and left unchanged. No push or deployment performed.
