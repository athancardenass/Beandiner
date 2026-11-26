# Site URL and hosting

## Current setup (2026-11-26)

- **Production:** https://beandiner.com and `www.beandiner.com`, served by the Cloudflare Pages project `beandiner`.
- **Domain:** `beandiner.com` is registered at Cloudflare Registrar and expires 2027-11-26. Keep auto-renew on. DNS has two proxied CNAME records, `@` and `www`, both pointing at `beandiner.pages.dev`.
- **Deploys:** `.github/workflows/deploy-cloudflare-pages.yml` runs on every push to `main`. It runs `npm ci`, `npm test`, and `npm run build` with `VITE_SITE_URL=https://beandiner.com`, then `wrangler pages deploy dist`. It needs the repo secret `CLOUDFLARE_API_TOKEN`: an account token with Cloudflare Pages → Edit.
- **Old Vercel address:** the Vercel project was deleted on 2026-11-26, so `beandiner.vercel.app` now returns 404. Every published link and printed QR uses `https://beandiner.com`.

## VITE_SITE_URL

`vite.config.ts` loads `VITE_SITE_URL` at build time and replaces the `__SITE_URL__` placeholders in `index.html`: canonical, `og:url`, `og:image`, `twitter:image`, and the JSON-LD `url`/`image`. It trims whitespace and trailing slashes. If the value is unset, the build prints a warning and emits relative URLs, which social crawlers ignore.

For a local build that matches production:

```powershell
$env:VITE_SITE_URL="https://beandiner.com"; npm run build
```

## Link preview

`og:image` is `public/images/og-beandiner.jpg`, a 1200x630 JPEG crop of the lit store sign. After you change it, open https://developers.facebook.com/tools/debug/?q=https%3A%2F%2Fbeandiner.com%2F and press **Scrape Again** so Messenger and Facebook drop the cached preview. The debugger's `fb:app_id` warning is safe to ignore; that ID only matters for Facebook Insights.

## Print QR codes

`scripts/print/generate_qr_standees.py` encodes `https://beandiner.com/`. To regenerate the 20 table standees and the preview:

```powershell
uv run --no-project --python 3.12 --with-requirements scripts/print/requirements-standee.txt python scripts/print/generate_qr_standees.py
```

```powershell
node scripts/print/render_qr_standee_preview.mjs
```

Output goes to `artifacts/print/qr-standee-proposal/`.

## Cloudflare Pages limits to remember

- Each file can be at most 25 MiB. The 4K hero master (31 MB) is kept at `assets/videos/bean-diner-hero-4k-source.mp4` and is not deployed. `scripts/prepare-hero-video.mjs` builds the served copies, and `scripts/assets.test.mjs` caps the 4K one at 24 MB.
- Pages serves `index.html` for unknown paths instead of a 404 (for example `/robots.txt`). There is no `robots.txt` or sitemap yet.
