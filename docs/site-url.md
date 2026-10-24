# Site URL configuration

## Domain status

The custom domain has not been purchased. `beandiner.com` is planned, not owned;
its availability has not been checked. Use **https://beandiner.vercel.app** as the
temporary production origin while the site remains on Vercel. This is a usable
public origin for absolute metadata now; it does not require buying a domain.

## Scope and current production output

`vite.config.ts` loads `VITE_SITE_URL` at build time and replaces the six
`__SITE_URL__` placeholders in `index.html`. It trims whitespace and trailing
slashes. An unset or blank value prints the build warning and emits relative URLs.

Observed in the production HTML at <https://beandiner.vercel.app/> on 2026-10-24:

| Metadata | Current unset output | Output with the recommended value |
| --- | --- | --- |
| Canonical and `og:url` | `./` | `https://beandiner.vercel.app/` |
| `og:image` and `twitter:image` | `./images/menu/diner-showcase.webp` | `https://beandiner.vercel.app/images/menu/diner-showcase.webp` |
| Restaurant JSON-LD `url` | `./` | `https://beandiner.vercel.app/` |
| Restaurant JSON-LD `image` | `./images/menu/diner-showcase.webp` | `https://beandiner.vercel.app/images/menu/diner-showcase.webp` |

The canonical is present and resolves to the production root in a browser; it is
not missing. Google supports relative canonicals but recommends absolute URLs.
The relative social-image and JSON-LD URLs do not explicitly identify the public
origin. Actual social-crawler acceptance and cached previews were not tested.

There is no sitemap or robots generator in this repo. WhatsApp links use the
independent constants in `src/utils/whatsapp.ts`. Browser checks use a separate
`SITE_URL` variable. Route changes update the title and description in `App.tsx`,
not these build-time URLs; this setting does not add per-route canonical URLs.

## Owner steps in Vercel

1. Open the **beandiner** project, then **Settings → Environment Variables**.
2. Add or edit **VITE_SITE_URL** with the literal value **https://beandiner.vercel.app**
   (no quotes or trailing slash). Use a Config/non-secret variable if prompted.
3. Select **Production** and **Preview**, applying Preview to all branches.
   Check for existing branch-specific overrides, which take precedence.
4. Save. In **Deployments**, redeploy the latest Production deployment. Redeploy
   any existing Preview deployment that you want to verify, too. Existing builds
   keep their old values; changing a variable alone does not update their HTML.
5. Confirm the warning disappears in the new build log. View the new page source
   and compare all six URLs with the table above; open the social-image URL.
   Then check a fresh social-share preview for the expected image.

Using the same value in Preview deliberately points its canonical and share
metadata to Production. The current connected `.vercel.app` origin is usable;
do not use the planned `beandiner.com` until it is owned and connected. Once a new
production domain is connected, update both environments and rebuild.

## Buying and connecting a domain later

1. Check availability and register the chosen domain in the client's account;
   confirm renewal pricing and ownership before purchase.
2. Choose one canonical hostname, with or without `www`. On Vercel, add it under
   **Settings → Domains** and use the DNS records shown for this project. Preserve
   existing email/verification records when changing DNS or nameservers.
3. Wait for working DNS and HTTPS, and configure the alternate hostname to
   redirect to the chosen one. Then update `VITE_SITE_URL` in both deployment
   environments and `.env.example`, rebuild, and verify the six metadata URLs.
4. Review temporary links and regenerate final print QR codes after cutover.
   The QR scripts below currently encode the temporary Vercel address.

## Vercel-specific audit (documentation only)

| Area inspected | Finding and migration consequence |
| --- | --- |
| Tracked hosting configuration | No `vercel.json`, Vercel adapter, `api/` functions, middleware, or GitHub Actions deployment workflow found. No tracked host redirects/headers configuration found. |
| Local linking | Ignored `.vercel/repo.json` links `origin` to project `beandiner` at repo root. `.gitignore` excludes `.vercel`. This is local Vercel metadata, not portable hosting configuration. |
| Dependencies and application | No Vercel SDK, analytics package, or `VERCEL_*` usage found. `vite.config.ts` and `npm run build` produce prebuilt files in `dist/`, including public assets; the single-file plugin and URL replacement are host-independent. |
| Temporary host references | `.env.example`, this note, earlier design/QR notes, `scripts/print/generate_qr_standees.py`, and `scripts/print/render_qr_standee_preview.mjs` reference the temporary host. These are configuration/documentation/print assets, not a Vercel runtime API. |
| Hosted settings | The earlier push produced a Vercel Production deployment. Dashboard environment variables, Node/build settings, redirects, headers, protection and domain/DNS settings were not audited here; repo inspection cannot establish their values. Review them before a move. |

No hosting configuration, ignored linking metadata, application source, print
scripts or assets were changed by this audit.

## Possible Cloudflare Pages move (not performed)

- Use a separate Pages project with repo root `.`, Production branch `main`,
  build command `npm run build`, and output directory `dist`. Match the tested
  Node version (currently 24.19.0); no Node version is pinned in this repo.
- Set `VITE_SITE_URL` for Pages Production and Preview to the chosen live
  production origin. At cutover this must be the connected custom domain or the
  actual assigned Pages production URL, not a guessed `pages.dev` hostname.
  The current `beandiner.vercel.app` address remains managed by Vercel.
- **Migration blocker:** `public/videos/bean-diner-hero-4k30.mp4` is 31,083,148
  bytes (about 29.64 MiB), and the build copies it into `dist/videos/`. Pages
  limits each asset to 25 MiB. Agree a separate publish/storage strategy before
  deploying there. The master is preserved; this task does not move or delete it.
- Connect a purchased domain through **Pages → Custom domains** before updating
  DNS. An apex domain requires a Cloudflare zone/nameservers; a subdomain can
  use an external DNS provider's CNAME after associating it with Pages.
- Before cutover, verify all query-string routes, assets/video seeking, bag and
  checkout, metadata and social sharing. Review host headers/redirects and DNS;
  retain the old deployment for comparison. No Pages deployment was tested.

`.env.example` documents this value; Vite does not load that filename. For local
builds, copy it to the ignored `.env.local` if desired. No hostname is hardcoded
in application source. This task does not change hosting settings or deploy.

Sources: [Vercel environment settings](https://vercel.com/docs/environment-variables/managing-environment-variables),
[Vercel environment scopes](https://vercel.com/docs/environment-variables),
[Vite environment loading](https://vite.dev/guide/env-and-mode),
[Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
[Vercel custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain),
[Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/),
[Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/),
[Pages asset limits](https://developers.cloudflare.com/pages/platform/limits/).
