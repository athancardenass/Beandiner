# Delegation Brief — sayav2 codebase cleanup (formatting + element mapping comments)

## TASK
Clean up the sayav2 React 19 + Vite 7 + Tailwind 4 + TypeScript coffee landing page codebase by:
1. Formatting all code files with proper indentation, line breaks, and spacing (pretty-print)
2. Adding element mapping comments that connect code lines to visual elements on the page, so clients can read and understand where to add/change images, text, etc.

## CONTEXT
- Existing architecture: Single-page React app with App.tsx containing all sections (hero, product story, menu, brand story, offer, cart, modals), plus utility components in src/utils/
- Why this change is needed: Clients need to be able to read the code and understand which lines control which visual elements (so they know where to add/change images, text, etc.)
- Existing behavior that MUST be preserved: ALL code logic, values, selectors, functionality must remain 100% intact

## REQUIREMENTS
Functional:
1. Format ALL files listed below with proper indentation, line breaks, spacing
2. Add element mapping comments throughout using the style examples provided
3. Do NOT change any code logic, values, selectors, or functionality
4. Do NOT rename anything
5. Do NOT refactor or optimize
6. ONLY add whitespace/line breaks for readability
7. ONLY add comments that map code to visual elements

Business rules:
- Comment style examples to follow:
  - `// ↓ HERO SECTION: Main landing area with floating cup animation`
  - `// ↓ PRODUCT GRID: 3-column menu layout (All/Coffee/Not coffee filter)`
  - `// ↓ PRODUCT IMAGE: Loads WebP from /images/optimized/{name}.webp`
  - `/* ↓ HERO PRODUCT WRAPPER: Floating cup animation container */`
  - `<!-- HERO SECTION: Main landing area -->`

Validation:
- Run `npx prettier --check src/App.tsx src/index.css` to verify formatting
- Verify the dev server still starts with `npm run dev`

## CONSTRAINTS
- Do not modify unrelated modules.
- No new dependencies without explicit approval in this brief.
- No destructive Git operations; never commit/push/branch (human-owned).
- Preserve existing functionality unless this brief explicitly instructs otherwise.
- Do NOT change any code logic, values, selectors, or functionality
- Do NOT rename anything
- Do NOT refactor or optimize
- ONLY add whitespace/line breaks for readability
- ONLY add comments that map code to visual elements
- Keep all existing code intact

## FILES TO INSPECT AND EDIT
- `C:\Users\Menaze\Documents\samploes\sayav2\src\App.tsx` — main app (hero, product story, menu, brand story, offer, cart, modals)
- `C:\Users\Menaze\Documents\samploes\sayav2\src\index.css` — all styles (single file, ~3000+ lines)
- `C:\Users\Menaze\Documents\samploes\sayav2\src\main.tsx` — React entry point
- `C:\Users\Menaze\Documents\samploes\sayav2\src\utils\cn.ts` — className utility
- `C:\Users\Menaze\Documents\samploes\sayav2\scripts\prepare-assets.mjs` — PNG to WebP converter
- `C:\Users\Menaze\Documents\samploes\sayav2\scripts\check-site.mjs` — Playwright QA
- `C:\Users\Menaze\Documents\samploes\sayav2\index.html` — HTML entry

## EXPECTED BEHAVIOR
- All files are formatted with proper indentation, line breaks, spacing
- Element mapping comments are added throughout connecting code to visual elements
- All original code logic, values, selectors, functionality remain 100% intact
- `npx prettier --check src/App.tsx src/index.css` passes
- `npm run dev` starts successfully

## TESTS TO RUN
- Run `npx prettier --check src/App.tsx src/index.css` to verify formatting
- Run `npm run dev` to verify the dev server starts
- Pi must run these after implementing. If they fail: diagnose and FIX the implementation, then re-run — do not report a bare failure and stop.

## DEFINITION OF DONE
Task complete ONLY when ALL true (Pi states each explicitly in its final output):
1. Requested behavior implemented — all files formatted + comments added.
2. Existing functionality preserved — no logic/selectors/values changed.
3. Relevant tests pass (actual run output shown) — prettier check + dev server start.
4. New behavior has test coverage — N/A (formatting/comments only).
5. `git diff` reviewed — zero unrelated changes (only whitespace + comments).
6. No unnecessary files/dependencies.
7. Implementation follows AGENTS.md + existing architecture.
8. CHANGELOG.md entry appended (date, what, files, why) — optional for this task.

---
DISPATCH COMMAND (Hermes runs after writing this):
`cd C:/Users/Menaze/Documents/samploes/sayav2 && pi --provider 9router --model bai/hy3 -p "<full brief text>"`
