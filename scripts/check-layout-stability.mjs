import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { runBrowserCheck } from './site-checks.mjs';

async function checkLayoutStability({ page, goto, setViewport }) {
  for (const width of [390, 768, 1024, 390]) {
    await setViewport({ width, height: 844 });
    for (const route of ['', '?page=beverages', '?page=diner-bites', '?page=our-story']) {
      await goto(`http://127.0.0.1:5173/${route}`);
      await page.locator('h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const offset = () => page.evaluate(() => {
        const header = document.querySelector('.header');
        const root = getComputedStyle(document.documentElement);
        const expected = getComputedStyle(header).position === 'sticky' ? header.offsetHeight : 0;
        return { expected, sticky: parseFloat(root.getPropertyValue('--sticky-top')), header: parseFloat(root.getPropertyValue('--header-h')) };
      });
      await expect.poll(async () => {
        const value = await offset();
        return value.sticky === value.expected && value.header === value.expected;
      }).toBe(true);
      // Exercise the observer after a real header resize, then restore its size.
      await page.locator('.header').evaluate(el => { el.style.paddingBottom = '24px'; });
      await expect.poll(async () => {
        const value = await offset();
        return value.sticky === value.expected && value.header === value.expected;
      }).toBe(true);
      await page.locator('.header').evaluate(el => el.style.removeProperty('padding-bottom'));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
  }
}

await runBrowserCheck(checkLayoutStability, ['chromium', 'webkit']);
