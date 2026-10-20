import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:5173/');
  const video = page.locator('.video-hero-media');
  await expect.poll(() => video.evaluate(el => el.currentTime), { timeout: 20000 }).toBeGreaterThan(0);
  await video.evaluate(el => { el.pause(); window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
  await expect.poll(() => video.evaluate(el => el.paused)).toBe(false);
  await video.evaluate(el => { el.pause(); document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(() => video.evaluate(el => el.paused)).toBe(false);
  for (const height of [844, 660, 900]) {
    await page.setViewportSize({ width: 390, height });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe('rgb(18, 18, 18)');
    await page.evaluate(() => {
      document.elementsFromPoint = () => [];
      window.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor), 'rgb(18, 18, 18)', 'Overscroll canvas must keep footer color');
  }
  console.log('PASS: video resumes after page restore/tab return; footer canvas stays dark across viewport heights and empty overscroll hit tests');
} finally {
  await browser.close();
}
