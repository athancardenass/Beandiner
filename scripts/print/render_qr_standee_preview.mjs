import { readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "../..");
const outputDir = resolve(root, "artifacts/print/qr-standee-proposal");
const svgPath = resolve(outputDir, "table-standee-template.svg");
const previewPath = resolve(outputDir, "client-preview.png");
const svg = await readFile(svgPath, "utf8");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bean Diner QR standee proposal</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 1600px; height: 1100px; overflow: hidden; }
    body {
      color: #121212;
      background:
        radial-gradient(ellipse at 17% 18%, rgba(212,158,119,.14), transparent 34%),
        linear-gradient(135deg, #f5ecdf 0%, #eee2d3 100%);
      font-family: Arial, sans-serif;
    }
    .canvas { position: relative; width: 1600px; height: 1100px; padding: 76px 116px; }
    .eyebrow { color: #8e6246; font-size: 16px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; }
    .layout { display: grid; grid-template-columns: 580px 1fr; gap: 130px; align-items: center; height: 850px; margin-top: 32px; }
    .mockup { position: relative; width: 505px; justify-self: center; filter: drop-shadow(0 32px 36px rgba(37, 26, 18, .22)); }
    .mockup svg { display: block; width: 100%; height: auto; border-radius: 4px; }
    .stand-base { position: absolute; z-index: -1; width: 570px; height: 42px; left: -32px; bottom: -26px; border-radius: 4px 4px 12px 12px; background: linear-gradient(180deg, #342920, #171412); box-shadow: 0 18px 25px rgba(37, 26, 18, .19); }
    .details { max-width: 610px; padding-bottom: 12px; }
    .kicker { color: #986c50; font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
    h1 { margin: 21px 0 0; font: 400 64px/.99 Georgia, serif; letter-spacing: -2.3px; }
    .subhead { margin: 28px 0 0; color: #6e6256; font-size: 21px; line-height: 1.55; }
    .spec { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 51px; padding: 24px 0; border-top: 1px solid rgba(52, 39, 29, .2); border-bottom: 1px solid rgba(52, 39, 29, .2); }
    .spec-label { display: block; color: #8e6246; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .spec-value { display: block; margin-top: 9px; font: 400 22px Georgia, serif; }
    .destination { display: grid; grid-template-columns: 4px 1fr; gap: 18px; margin-top: 34px; max-width: 550px; }
    .destination::before { content: ""; border-radius: 5px; background: #d49e77; }
    .destination-label { color: #8e6246; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .destination p { margin: 8px 0 0; color: #51463c; font-size: 16px; line-height: 1.6; }
    .footer { position: absolute; right: 116px; bottom: 63px; color: #8c7b6b; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
  </style>
</head>
<body>
  <main class="canvas">
    <div class="eyebrow">Bean Diner · Client proposal</div>
    <section class="layout">
      <div class="mockup" aria-label="Table 01 QR standee mockup">
        <div class="stand-base"></div>
        ${svg}
      </div>
      <div class="details">
        <div class="kicker">Table service</div>
        <h1>The menu,<br>at your table.</h1>
        <p class="subhead">A tabletop menu standee designed to make browsing the Bean Diner menu quick and easy.</p>
        <div class="spec">
          <div><span class="spec-label">Print size</span><span class="spec-value">15 × 20 cm</span></div>
          <div><span class="spec-label">Set</span><span class="spec-value">Table 01–20</span></div>
          <div><span class="spec-label">Bleed</span><span class="spec-value">3 mm</span></div>
        </div>
        <div class="destination">
          <div>
            <div class="destination-label">QR destination · proposal only</div>
            <p>This demo QR opens beandiner.vercel.app. It can be updated to beandiner.com once the domain is active.</p>
          </div>
        </div>
      </div>
    </section>
    <div class="footer">Bean Diner · Bayambang, Pangasinan</div>
  </main>
</body>
</html>`;

await mkdir(dirname(previewPath), { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: previewPath, fullPage: true, animations: "disabled" });
  console.log(`Created client-preview.png (${await page.locator("body").evaluate((el) => el.scrollWidth)} x ${await page.locator("body").evaluate((el) => el.scrollHeight)} CSS px, 2x).`);
} finally {
  await browser.close();
}
