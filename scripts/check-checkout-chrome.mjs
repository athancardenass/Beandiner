import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';

const dark = 'rgb(18, 18, 18)';
const white = 'rgb(255, 255, 255)';

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const canvas = () => page.evaluate(() => ({
      root: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      theme: document.querySelector('meta[name="theme-color"]').content,
    }));
    await page.goto('http://127.0.0.1:5173/?page=beverages');
    await page.getByRole('button', { name: 'Customize Strawberry Milk', exact: true }).last().click();
    await page.getByRole('button', { name: 'Add to bag ₱160', exact: true }).click();
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, 0);
    });
    await expect.poll(canvas).toEqual({ root: white, body: white, theme: white });
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
    await expect.poll(canvas).toEqual({ root: dark, body: dark, theme: '#121212' });
    await page.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Your order bag', exact: true });
    for (const height of [844, 460, 660, 900]) {
      await page.setViewportSize({ width: 390, height });
      await page.locator('#order-name').focus();
      for (const end of ['bottom', 'top']) {
        await dialog.evaluate((el, end) => {
          for (const node of [el, el.querySelector('.bag-content')]) {
            node.scrollTop = end === 'bottom' ? node.scrollHeight : 0;
          }
        }, end);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect.poll(canvas).toEqual({ root: dark, body: dark, theme: '#121212' });
        assert.equal(await dialog.evaluate(el => getComputedStyle(el).backgroundColor), white, 'Checkout surface stays white');
      }
    }
    await page.getByRole('button', { name: 'Back to Bag', exact: true }).click();
    await expect.poll(canvas).toEqual({ root: dark, body: dark, theme: '#121212' });
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(canvas).toEqual({ root: white, body: white, theme: white });
    // Reopening and Escape must also restore the menu canvas without leaked state.
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
    await expect.poll(canvas).toEqual({ root: dark, body: dark, theme: '#121212' });
    await page.keyboard.press('Escape');
    await expect.poll(canvas).toEqual({ root: white, body: white, theme: white });
    assert.deepEqual(errors, []);
    console.log(`${engine.name()}: bag/details keep dark browser canvas across dialog scroll and viewport changes; closing restores white menu`);
  } finally {
    await browser.close();
  }
}
