import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect } from "@playwright/test";

const baseUrl = process.env.SITE_URL || "http://127.0.0.1:5173";
const screenshots = join(tmpdir(), "beandiner-bag-check");
await mkdir(screenshots, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
});

try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    // Exercise the session-only fallback as well as normal localStorage persistence.
    if (width === 390) {
      await context.addInitScript(() => {
        Storage.prototype.getItem = () => { throw new Error("Storage unavailable"); };
        Storage.prototype.setItem = () => { throw new Error("Storage unavailable"); };
      });
    }
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(baseUrl);
    await page.evaluate(() => { window.__navigationSentinel = "same document"; });
    const bubble = page.locator(".floating-bag-bubble");
    await expect(bubble).toHaveCount(0);
    await page.getByRole("button", { name: "Customize Iced Spanish Latte", exact: true }).click();
    await page.getByRole("button", { name: "Increase quantity", exact: true }).click();
    await page.getByRole("button", { name: /^Add to bag/ }).click();
    await expect(page.getByRole("heading", { name: "Your Order", exact: true })).toBeVisible();
    await expect(page.locator(".button-order-more")).toHaveCount(2);
    await expect(page.locator(".cart-total strong")).toHaveText("₱250");
    await page.locator(".button-order-more").first().click();
    await expect(bubble).toHaveAccessibleName("View order bag with 2 items");
    await expect(bubble.locator(".floating-bag-price")).toHaveText("₱250");

    const navigate = async (name) => {
      if (width < 700) {
        await page.getByRole("button", { name: "Open navigation", exact: true }).click();
        await page.locator(".mobile-nav-list").getByRole("link", { name }).click();
        await expect(page.locator(".nav-modal")).toHaveCount(0);
      } else {
        await page.locator(".header-nav").getByRole("link", { name }).click();
      }
    };
    const checkBrowsing = async (surface) => {
      await expect(bubble).toBeVisible();
      assert.equal(await page.evaluate(() => window.__navigationSentinel), "same document");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const bagBox = await bubble.boundingBox();
      const messengerBox = await page.locator(".floating-messenger").boundingBox();
      assert.ok(bagBox.height >= 44 && bagBox.width >= 44);
      assert.ok(bagBox.x >= 0 && bagBox.x + bagBox.width <= width);
      assert.ok(bagBox.x + bagBox.width < messengerBox.x || bagBox.y + bagBox.height < messengerBox.y);
      await page.screenshot({ path: join(screenshots, `${surface}-${width}.png`) });
    };

    await navigate(/Diner bites/);
    await expect(page.locator(".food-page-hero")).toBeVisible();
    await expect(page).toHaveURL(/page=diner-bites/);
    await page.locator(".food-page-menu").getByRole("button", { name: /^Add .* to bag$/ }).first().click();
    await expect(page.locator(".cart-item")).toHaveCount(2);
    const total = await page.locator(".cart-total strong").innerText();
    for (const selector of [".button-order-more", ".cart-item-remove", ".cart-item .quantity button"]) {
      for (const control of await page.locator(selector).all()) {
        const box = await control.boundingBox();
        assert.ok(box.height >= 44 && box.width >= 44, `${selector} at ${width}px`);
      }
    }
    assert.equal(await page.locator(".bag-content").evaluate((el) => el.scrollWidth > el.clientWidth), false);
    await page.screenshot({ path: join(screenshots, `bag-${width}.png`) });
    await page.locator(".button-order-more").last().click();
    await expect(bubble.locator(".floating-bag-badge")).toHaveText("3");
    await expect(bubble.locator(".floating-bag-price")).toHaveText(total);
    await checkBrowsing("food");

    await page.getByRole("link", { name: "Explore our drinks", exact: true }).click();
    await expect(page.locator("#menu")).toBeVisible();
    await expect(page.locator(".food-page-hero")).toHaveCount(0);
    await checkBrowsing("drinks");
    await page.goBack();
    await expect(page.locator(".food-page-hero")).toBeVisible();
    await page.goForward();
    await expect(page.locator("#menu")).toBeVisible();
    await navigate(/Diner bites/);
    await page.locator(".header .logo").click();
    await expect(page.locator(".hero")).toBeVisible();
    assert.equal(await page.evaluate(() => window.__navigationSentinel), "same document");
    await expect(bubble.locator(".floating-bag-badge")).toHaveText("3");

    if (width === 1440) {
      await page.reload();
      await expect(bubble.locator(".floating-bag-badge")).toHaveText("3");
    }
    await bubble.click();
    await expect(page.locator(".cart-item")).toHaveCount(2);
    await page.getByRole("button", { name: "Remove one Iced Spanish Latte", exact: true }).click();
    await expect(page.locator(".bundle-note")).toHaveCount(0);
    await page.locator(".cart-item-remove").last().click();
    await expect(page.locator(".cart-item")).toHaveCount(1);
    await page.locator(".button-order-more").first().click();
    await expect(bubble.locator(".floating-bag-price")).toHaveText("₱145");
    await bubble.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Remove Iced Spanish Latte from bag", exact: true }).click();
    await expect(page.locator(".empty-bag")).toBeVisible();
    await expect(bubble).toHaveCount(0);
    await page.getByRole("button", { name: "Explore the menu", exact: true }).click();
    await expect(page.locator(".bag-modal")).toHaveCount(0);
    if (width !== 390) {
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("beandiner-bag-v2"))), []);
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: client navigation, history, cart, discounts, removal, touch targets, overflow, floating controls${width === 390 ? ", unavailable storage" : ""}`);
    await context.close();
  }
  console.log(`Screenshots: ${screenshots}`);
} finally {
  await browser.close();
}
