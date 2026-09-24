// ↓ E2E TEST: Playwright smoke test for desktop + mobile
import { chromium } from "@playwright/test";
// ↓ BROWSER: Launch headless Chromium
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
// ↓ ERROR TRACKING: Capture runtime errors
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// ↓ NAVIGATE: Load dev server
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
// ↓ DESKTOP SCREENSHOT: Full page capture
await page.screenshot({ path: "/tmp/saya-desktop.png" });
// ↓ OVERFLOW CHECK: Detect horizontal overflow
console.log(
  "Desktop overflow:",
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
);
// ↓ STORY SCROLL: Navigate to scroll-story section
await page.locator("#flavors").scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/saya-story.png" });
// ↓ MENU SCROLL: Navigate to menu section
await page.locator("#menu").scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/saya-menu.png" });
// ↓ CUSTOMIZE: Open product modal and select options
await page
  .getByRole("button", { name: "Customize The Daily Saya", exact: true })
  .click();
await page.getByText("22 oz", { exact: false }).first().click();
await page.locator("label").filter({ hasText: "Oat" }).click();
await page.getByRole("button", { name: "Add to bag" }).click();
await page.waitForTimeout(400);
// ↓ PRICE CHECK: Verify customized item price
console.log(
  "Customized item price correct:",
  await page.locator(".cart-item-bottom").innerText(),
);
// ↓ CLOSE BAG: Dismiss bag modal
await page
  .locator(".bag-modal")
  .getByRole("button", { name: "Close dialog" })
  .click();
// ↓ BUNDLE: Test two-cup bundle offer
await page
  .locator("#together")
  .getByRole("button", { name: "Make it a coffee date" })
  .click();
console.log("Bundle discount:", await page.locator(".cart-totals").innerText());
// ↓ CHECKOUT: Place demo order
await page.getByLabel("A name for your cup").fill("Mika");
await page.getByRole("button", { name: "Place demo order" }).click();
console.log("Checkout success:", await page.locator(".receipt").innerText());
await page.getByRole("button", { name: "Close dialog" }).click();
// ↓ FILTER: Test "Not coffee" filter
await page
  .locator("#menu")
  .getByRole("button", { name: "Not coffee", exact: true })
  .click();
console.log(
  "Not coffee filter count:",
  await page.locator(".product-card").count(),
);
// ↓ MOBILE: Switch to mobile viewport
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/saya-mobile.png" });
// ↓ MOBILE OVERFLOW: Detect horizontal overflow on mobile
console.log(
  "Mobile overflow:",
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
);
// ↓ MOBILE NAV: Test mobile navigation menu
await page.getByRole("button", { name: "Open navigation" }).click();
await page
  .locator(".nav-modal")
  .getByRole("link", { name: "Our coffee" })
  .click();
console.log(
  "Mobile menu closed:",
  (await page.locator(".nav-modal").count()) === 0,
);
// ↓ REDUCED MOTION: Test accessibility preference
await page.emulateMedia({ reducedMotion: "reduce" });
await page.locator("#flavors").scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/saya-mobile-story.png" });
console.log(
  "Reduced motion active:",
  await page.evaluate(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  ),
);
// ↓ ERROR REPORT: Output any runtime errors
console.log("Runtime errors:", errors);
await browser.close();
