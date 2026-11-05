import assert from 'node:assert/strict';
import { webkit, devices, expect } from '@playwright/test';
const base = (process.env.SITE_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const origin = new URL(base).origin;
const failures = [];
const pageState = page => page.evaluate(() => ({
  htmlClass: document.documentElement.className,
  htmlStyle: document.documentElement.getAttribute('style') || '',
  bodyClass: document.body.className,
  bodyStyle: document.body.getAttribute('style') || '',
  rootStyle: document.getElementById('root').getAttribute('style') || '',
  rootInert: document.getElementById('root').inert,
  theme: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
}));
const browser = await webkit.launch();
try {
  for (const product of ['Honey Lemon Butterfly Pea', 'Strawberry Milk', 'Oreo Milkshake', 'Double Dutch', 'Choco Pistachio', 'Matcha Latte']) {
    const context = await browser.newContext({ ...devices['iPhone 14'], isMobile: false, viewport: { width: 414, height: 750 }, reducedMotion: 'reduce' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin && route.request().resourceType() !== 'media' ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(`${base}/?page=beverages`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.classList.contains('js-ready'));
    const trigger = page.getByRole('button', { name: 'Customize ' + product, exact: true }).last();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.evaluate(el => el.focus({ preventScroll: true }));
    const originalState = await pageState(page);
    // Keyboard activation preserves the focused opener in Safari.
    await page.keyboard.press('Enter');
    const dialog = page.locator('dialog.product-modal[open]');
    await expect(dialog).toBeVisible();
    try {
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('dialog.product-modal[open] .modal-close')), true, 'Opening must move focus to Close without scrolling');
      assert.equal(await dialog.getAttribute('aria-modal'), 'true', 'The product dialog must announce modal semantics');
      const focusY = await page.evaluate(() => scrollY);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('dialog.product-modal[open] .add-row > button')), true, 'Shift+Tab from Close must wrap to Add');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('dialog.product-modal[open] .modal-close')), true, 'Tab from Add must wrap to Close');
      assert.equal(await page.evaluate(() => scrollY), focusY, 'Tab cycling must not pan the page');
    } catch (error) { failures.push(product + ': ' + error.message); }
    await page.evaluate(() => { for (const a of document.querySelector('.modal-inner').getAnimations()) a.finish(); });
    assert.equal(await page.locator('#item-note').count(), 0, 'Barista note input must not exist in product modal');
    const before = await page.evaluate(() => ({ y: scrollY, height: document.body.style.minHeight, box: document.querySelector('.modal-inner').getBoundingClientRect().toJSON() }));
    const geometry = await dialog.evaluate(el => {
      const form = el.querySelector('.customize-form');
      const action = el.querySelector('.add-row');
      const card = el.querySelector('.modal-inner');
      return { card: card.getBoundingClientRect().toJSON(), formHeight: form.clientHeight, formRange: form.scrollHeight - form.clientHeight, actionHeight: action.getBoundingClientRect().height, bottomPadding: parseFloat(getComputedStyle(form).paddingBottom) };
    });
    try {
      assert.ok(geometry.card.height <= 750 + 1, 'The card must fit within the phone viewport');
      assert.ok(geometry.bottomPadding <= 20, 'Normal form padding below Add');
    } catch (error) { failures.push(product + ': ' + error.message); }
    console.log(JSON.stringify({ product, openingY: before.y, geometry }));
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    assert.equal(await page.evaluate(() => scrollY), before.y, 'Closing restores the opening offset');
    assert.equal(await page.evaluate(() => document.documentElement.style.overflowY), '', 'Page lock is cleaned up');
    assert.deepEqual(await pageState(page), originalState, 'Closing must restore classes, styles, root inertness and theme exactly');
    assert.equal(await trigger.evaluate(el => document.activeElement === el), true, 'Focus returns to the original trigger');
    assert.equal(await page.locator('[data-product-backdrop-edge]').count(), 0, 'No backdrop remains after close');
    await context.close();
  }
  for (const viewport of [{ width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 834, height: 1194 }]) {
    const context = await browser.newContext({ ...devices['iPad Pro 11'], isMobile: false, viewport, reducedMotion: 'reduce' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin && route.request().resourceType() !== 'media' ? route.continue() : route.abort());
    const page = await context.newPage();
    try {
      await page.goto(`${base}/?page=beverages`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Customize Strawberry Milk', exact: true }).last().click();
      const dialog = page.locator('dialog.product-modal[open]');
      await expect(dialog).toBeVisible();
      const openingY = await page.evaluate(() => scrollY);
      const form = page.locator('.customize-form');
      const layout = await form.evaluate(el => ({ overflow: getComputedStyle(el).overflowY, height: el.clientHeight, content: el.scrollHeight, box: el.getBoundingClientRect().toJSON() }));
      assert.ok(['auto', 'scroll'].includes(layout.overflow), 'Wide Safari form must remain scrollable');
      assert.ok(layout.box.top >= -1 && layout.box.bottom <= viewport.height + 1, 'Wide form must fit the visible viewport');
      if (layout.content > layout.height) {
        const box = await form.boundingBox();
        await page.mouse.move(box.x + 30, Math.max(0, box.y) + 30);
        await page.mouse.wheel(0, 800);
        await page.waitForTimeout(150);
        assert.ok(await form.evaluate(el => el.scrollTop) > 0, 'User scrolling must move the wide form');
        assert.equal(await page.evaluate(() => scrollY), openingY, 'Form scrolling must preserve the page offset');
      }
      // Scroll the form itself; locator.click/scrollIntoView would mask hidden-page overflow.
      await form.evaluate(el => { el.scrollTop = el.scrollHeight; });
      const action = await page.locator('.add-row').boundingBox();
      assert.ok(action.y >= 0 && action.y + action.height <= viewport.height + 1, 'Add must be reachable inside a wide short viewport');
      await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
      await expect(dialog).toHaveCount(0);
      assert.equal(await page.evaluate(() => scrollY), openingY, 'Wide dialog restores the page offset');
      console.log(`${viewport.width}x${viewport.height}: wide Safari scrolling passed`);
    } catch (error) { failures.push(`${viewport.width}x${viewport.height}: ${error.message}`); }
    finally { await context.close(); }
  }
} finally { await browser.close(); }
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('PASS: Safari product focus, stale keyboard viewports, six-drink scrolling, wide layouts and cleanup');