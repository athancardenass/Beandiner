import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, devices, expect } from "@playwright/test";

const baseUrl = process.env.SITE_URL || "http://127.0.0.1:5173";
const screenshots = join(tmpdir(), "beandiner-ordering-check");
await mkdir(screenshots, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
});

try {
  for (const width of [1440, 390, 320]) {
    const mobile = width < 700;
    const context = await browser.newContext({
      ...(mobile ? devices["iPhone 13"] : {}),
      viewport: { width, height: mobile ? 844 : 1000 },
    });
    const errors = [];
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    // Prevent contacting Facebook while exercising real anchor/new-tab behavior.
    await context.route("https://www.facebook.com/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "Messenger test destination" }),
    );
    await page.addInitScript(() => {
      localStorage.setItem("beandiner-bag-v2", JSON.stringify([
        { key: "latte", id: "latte", size: "16 oz", milk: "Regular",
          temperature: "Iced", quantity: 1, price: 145 },
      ]));
      window.__copiedOrder = "";
      window.__openedUrls = [];
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async (text) => { window.__copiedOrder = text; } },
      });
      window.open = (...args) => { window.__openedUrls.push(args); return null; };
    });
    await page.goto(baseUrl);
    await expect(page.locator(".social-ordering-guide li")).toHaveCount(3);
    await page.locator(".social-ordering-guide").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(screenshots, `menu-${width}.png`) });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

    await page.getByRole("button", { name: /^Open bag,/ }).click();
    await page.locator("#order-name").fill("Ordering Check");
    await page.locator("#order-phone").fill("09123456789");
    const historyLength = await page.evaluate(() => history.length);
    const originalUrl = page.url();
    await page.getByRole("button", { name: "Copy Order & See Sending Guide" }).click();
    await expect(page.locator(".receipt")).toBeVisible();
    await expect(page.locator(".ordering-steps-handoff li")).toHaveCount(3);
    assert.equal(page.url(), originalUrl);
    assert.equal(context.pages().length, 1);
    assert.deepEqual(await page.evaluate(() => window.__openedUrls), []);
    assert.equal(await page.evaluate(() => history.length), historyLength);
    const summary = await page.locator(".clipboard-preview-box").innerText();
    assert.match(summary, /Name: Ordering Check/);
    assert.equal(await page.evaluate(() => window.__copiedOrder), summary);
    await page.locator(".bag-modal").evaluate((dialog) => { dialog.scrollTop = 0; });
    await page.screenshot({ path: join(screenshots, `receipt-${width}.png`) });
    assert.equal(await page.locator(".bag-modal").evaluate((el) => el.scrollWidth > el.clientWidth), false);
    for (const selector of [".button-copy-messenger", ".messenger-browser-fallback", ".button-facebook-page-fallback", ".button-continue-shopping", ".modal-close"]) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box.height >= 44, `${selector} is ${box.height}px high at ${width}px`);
    }
    const links = page.locator('a[href*="facebook.com/messages/t/"]');
    for (const link of await links.all()) {
      assert.equal(await link.getAttribute("target"), "_blank");
      assert.match(await link.getAttribute("rel"), /noopener/);
    }
    if (mobile) {
      await page.locator(".button-copy-messenger").click();
      await expect.poll(() => page.evaluate(() => window.__openedUrls.length)).toBe(1);
      assert.deepEqual(await page.evaluate(() => window.__openedUrls[0]), [
        "https://www.facebook.com/messages/t/100959311683531", "_blank", "noopener,noreferrer",
      ]);
      assert.equal(page.url(), originalUrl);
      assert.equal(await page.evaluate(() => history.length), historyLength);
    } else {
      const popupPromise = page.waitForEvent("popup");
      await page.locator(".button-copy-messenger").click();
      const popup = await popupPromise;
      await popup.waitForLoadState();
      assert.match(popup.url(), /facebook.com\/messages\/t\/100959311683531/);
      assert.equal(page.url(), originalUrl);
      await popup.close();
    }
    const fallbackPopup = page.waitForEvent("popup");
    await page.locator(".messenger-browser-fallback").click();
    await (await fallbackPopup).close();
    await page.getByRole("button", { name: "Back to Menu / Keep Exploring" }).click();
    await expect(page.locator(".bag-modal")).toHaveCount(0);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: checkout stays local, clipboard, guides, Messenger tabs, touch targets, overflow, dismissal`);
    await context.close();
  }
  console.log(`Screenshots: ${screenshots}`);
} finally {
  await browser.close();
}
