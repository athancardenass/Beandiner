import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage();
  for (const width of [390, 430, 768, 820]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('http://127.0.0.1:5173/');
    for (const height of [844, 932, 740]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => page.locator('.video-hero').evaluate(el =>
        Math.round(el.getBoundingClientRect().bottom - innerHeight),
      ), { message: `Hero fills viewport at ${width}x${height}` }).toBe(0);
    }
  }
  console.log('PASS: mobile hero fills first screen at four widths and three viewport heights');
} finally {
  await browser.close();
}
