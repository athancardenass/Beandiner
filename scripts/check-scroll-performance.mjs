import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const baseUrl = process.env.SITE_URL || "http://127.0.0.1:5173";
const profileOnly = process.env.SCROLL_PROFILE === "1";
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.__scrollReads = null;
    const count = (name) => {
      if (window.__scrollReads) window.__scrollReads[name]++;
    };
    const rect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (...args) {
      count("rect");
      return rect.apply(this, args);
    };
    const computed = window.getComputedStyle;
    window.getComputedStyle = function (...args) {
      count("computedStyle");
      return computed.apply(this, args);
    };
    const height = Object.getOwnPropertyDescriptor(Element.prototype, "scrollHeight");
    Object.defineProperty(Element.prototype, "scrollHeight", {
      ...height,
      get() {
        if (this === document.documentElement) count("scrollHeight");
        return height.get.call(this);
      },
    });
    const query = Element.prototype.querySelectorAll;
    Element.prototype.querySelectorAll = function (...args) {
      if (this.classList.contains("story-stage")) count("storyQuery");
      return query.apply(this, args);
    };
    const property = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function (name, ...args) {
      if (name === "--scroll" || name === "--progress") count("inheritedVariable");
      return property.call(this, name, ...args);
    };
  });
  await page.goto(baseUrl);
  await page.locator(".hero").waitFor();
  await page.evaluate(() => document.fonts.ready);
  const session = await page.context().newCDPSession(page);
  await session.send("Performance.enable");
  const metrics = async () => Object.fromEntries(
    (await session.send("Performance.getMetrics")).metrics.map(({ name, value }) => [name, value]),
  );
  const sample = async (name, start) => {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), start);
    await page.waitForTimeout(800);
    const before = await metrics();
    const reads = await page.evaluate(async (top) => {
      window.__scrollReads = { rect: 0, computedStyle: 0, scrollHeight: 0, storyQuery: 0, inheritedVariable: 0 };
      for (let i = 0; i < 60; i++) {
        await new Promise(requestAnimationFrame);
        window.scrollTo({ top: top + i * 4, behavior: "instant" });
      }
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const result = window.__scrollReads;
      window.__scrollReads = null;
      return result;
    }, start);
    const after = await metrics();
    const result = {
      name, reads,
      layouts: after.LayoutCount - before.LayoutCount,
      styleRecalcs: after.RecalcStyleCount - before.RecalcStyleCount,
    };
    console.log(JSON.stringify(result));
    return result;
  };
  const hero = await sample("hero", 80);
  const storyTop = await page.locator("#flavors").evaluate((node) => node.getBoundingClientRect().top + scrollY);
  const story = await sample("story", storyTop + 200);
  if (!profileOnly) {
    for (const { name, reads } of [hero, story]) {
      assert.ok(reads.rect <= 2 && reads.computedStyle <= 2 && reads.scrollHeight <= 2,
        `${name}: scroll frames must not repeatedly read layout: ${JSON.stringify(reads)}`);
      assert.equal(reads.storyQuery, 0, `${name}: reuse cached story nodes`);
      assert.equal(reads.inheritedVariable, 0, `${name}: animate elements without invalidating ancestor variables`);
    }
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), "auto");

    for (const width of [1920, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["", "?page=beverages", "?page=diner-bites"]) {
        await page.goto(`${baseUrl}/${route}`);
        const bar = page.locator(".menu-sticky");
        await expect(bar).not.toHaveClass(/is-stuck/);
        const top = await page.locator(".menu-sticky-sentinel").evaluate((node) =>
          node.getBoundingClientRect().top + scrollY);
        await page.evaluate((y) => window.scrollTo({ top: y + 20, behavior: "instant" }), top);
        await expect(bar).toHaveClass(/is-stuck/);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await expect(bar).not.toHaveClass(/is-stuck/);
        if (width === 1920) {
          assert.equal(await bar.evaluate((node) => getComputedStyle(node).backdropFilter), "none");
        }
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
        await expect.poll(() => page.locator(".page-progress").evaluate((node) =>
          Number(getComputedStyle(node).transform.match(/^matrix\(([^,]+)/)?.[1]) || 0,
        )).toBeGreaterThan(0.99);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(baseUrl);
    await page.getByRole("button", { name: "Explore Iced Matcha Latte", exact: true }).click();
    await expect(page.getByRole("button", { name: "Explore Iced Matcha Latte", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => page.locator(".story-product").first().evaluate((node) => node.style.transform)).toBe("none");
    await page.locator(".story-top a").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /^All drinks/ })).toBeFocused();
    await page.locator(".header-nav a[href*='page=beverages']").click();
    await expect(page.locator(".bev-item-card").first()).toBeVisible();
    await page.locator(".header-nav a[href*='page=diner-bites']").click();
    await expect(page.locator(".food-page-item").first()).toBeVisible();
    await page.locator(".header-nav a[href$='#menu']").click();
    await expect(page.locator("#menu")).toBeInViewport();
    await page.getByRole("button", { name: /^Not coffee/ }).click();
    await page.evaluate(async () => {
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    });
    await expect.poll(() => page.locator(".page-progress").evaluate((node) =>
      Number(getComputedStyle(node).transform.match(/^matrix\(([^,]+)/)?.[1]) || 0,
    )).toBeGreaterThan(0.99);
    assert.deepEqual(errors, []);
    console.log("Scroll checks passed: cached reads, sticky jumps/reverse, resize/routes/filter progress, flavor click, reduced motion, desktop/mobile overflow.");
  }
} finally {
  await browser.close();
}
