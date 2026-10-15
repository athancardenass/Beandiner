# Bean Diner QR Standee Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a client-ready, printable 20-table QR standee proposal for Bean Diner.

**Architecture:** A Python generator uses ReportLab to draw one shared vector layout, generate the QR, and write the 20-page PDF plus editable SVG template. A small Playwright renderer turns the SVG and a separate temporary-QR note into the client preview PNG.

**Tech Stack:** Python 3, ReportLab, pypdf for artifact checks, Node.js, existing Playwright dependency.

**Spec:** `docs/superpowers/specs/2026-10-15-qr-standee-design.md`

## Global Constraints

- Finished trim size is 150 × 200 mm, portrait, with 3 mm bleed.
- Set each PDF page to 156 × 206 mm overall, with a 150 × 200 mm TrimBox centered inside it.
- Use an espresso-dark, scan-first design with warm cream and tan accents.
- Use the Bean Diner logo and the “Scan to explore our menu” CTA.
- Generate unique labels `TABLE 01` through `TABLE 20`, one per PDF page.
- Proposal QR encodes `https://beandiner.vercel.app/`; do not print that temporary URL on the standee.
- Preserve a clear QR quiet zone and do not overlay graphics on the QR.
- Keep all work in print-proposal assets; do not change website behavior.

## Review Focus

- Wrong destination encoded in the QR — inspect the generator's single `QR_URL` value and decode a rendered sample where a local decoder is available.
- Missing, duplicated, or misordered table labels — extract PDF text and assert the ordered set `TABLE 01`–`TABLE 20`.
- Incorrect page size or missing bleed — inspect all 20 PDF MediaBoxes at 156 × 206 mm and TrimBoxes at 150 × 200 mm.
- QR contrast or quiet-zone loss — inspect the vector source and rendered PNG at full size.
- Temporary URL accidentally printed on the standee — search standee SVG/PDF text; allow the temporary destination only inside QR data and the separate client-preview note.

---

### Task 1: Generate print and client-preview assets

**Files:**
- Create: `scripts/print/generate_qr_standees.py`
- Create: `scripts/print/render_qr_standee_preview.mjs`
- Create: `scripts/print/requirements-standee.txt`
- Create: `artifacts/print/qr-standee-proposal/qr-standees.pdf`
- Create: `artifacts/print/qr-standee-proposal/client-preview.png`
- Create: `artifacts/print/qr-standee-proposal/table-standee-template.svg`

**Interfaces:**
- The Python generator owns `QR_URL`, table numbering, color tokens, page dimensions, QR generation, and the shared vector layout.
- The Node renderer consumes `table-standee-template.svg` and writes `client-preview.png`; its note is outside the printable standee artwork.

- [ ] Add a small print-only requirements file for `reportlab` and `pypdf`; do not add either to the website package dependencies.
- [ ] Implement the generator with the exact destination, 20 table labels, 150 × 200 mm trim, and 3 mm bleed. Draw the same layout into each PDF page and export a clean `TABLE 01` SVG template.
- [ ] Run the generator and confirm it creates the three specified vector/print outputs.
- [ ] Render the SVG in headless Playwright at print-proportional resolution; add a separate note that the demo QR uses the live Vercel site until the custom domain is purchased.
- [ ] Inspect the PNG, PDF page count and dimensions, ordered table text, QR quiet zone, and printed-text search for the temporary URL.
- [ ] Run `git diff --check` and confirm no website source files changed.
