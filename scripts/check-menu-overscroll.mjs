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
    const canvas = () => page.evaluate(() => ({
      root: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      scheme: getComputedStyle(document.documentElement).colorScheme,
      theme: document.querySelector('meta[name="theme-color"]').content,
    }));
    for (const route of ['beverages', 'diner-bites']) {
      await page.goto(`http://127.0.0.1:5173/?page=${route}`);
      await page.locator('main > section').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      for (const height of [844, 660, 900]) {
        await page.setViewportSize({ width: 390, height });
        await page.evaluate(async () => {
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          window.scrollTo(0, document.documentElement.scrollHeight);
          await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
          window.scrollTo(0, document.documentElement.scrollHeight);
        });
        await expect.poll(canvas).toEqual({ root: dark, body: dark, scheme: 'dark', theme: '#121212' });
        assert.equal(await page.locator('footer').count(), 0, 'Menu footer stays removed');
        assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).backgroundColor), white);
        await page.evaluate(async () => {
          window.originalHitTest = document.elementsFromPoint;
          // Safari may expose only the canvas, or a stale menu layer, during bounce.
          document.elementsFromPoint = () => [document.querySelector('main > section:last-child')];
          window.dispatchEvent(new Event('scroll'));
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        await expect.poll(canvas).toEqual({ root: dark, body: dark, scheme: 'dark', theme: '#121212' });
        await page.evaluate(async () => {
          document.elementsFromPoint = () => [];
          window.dispatchEvent(new Event('scroll'));
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        await expect.poll(canvas).toEqual({ root: dark, body: dark, scheme: 'dark', theme: '#121212' });
        await page.evaluate(() => {
          document.elementsFromPoint = window.originalHitTest;
          window.scrollTo(0, Math.max(0, document.documentElement.scrollHeight - innerHeight - 300));
        });
        await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: white });
      }
      console.log(`${engine.name()}: ${route} keeps dark bottom chrome and white menu content at three viewport heights`);
    }
  } finally {
    await browser.close();
  }
}
