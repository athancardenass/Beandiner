import { webkit, expect } from '@playwright/test';

const browser = await webkit.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  for (const [route, menuSelector] of [
    ['?page=beverages', '.bev-page-menu'],
    ['?page=diner-bites', '.food-page-menu'],
  ]) {
    await page.goto(`http://127.0.0.1:5173/${route}`);
    await page.waitForSelector(menuSelector);
    await page.evaluate(() => {
      Object.defineProperty(window.visualViewport, 'offsetTop', {
        configurable: true,
        get: () => 24,
      });
      window.visualViewport.dispatchEvent(new Event('scroll'));
      window.scrollTo(0, document.documentElement.scrollHeight);
    });

    await expect.poll(
      () => page.locator('.header').evaluate((header) => Math.round(header.getBoundingClientRect().top)),
      { message: `${route} keeps the sticky navigation inside the visible viewport at page end` },
    ).toBeGreaterThanOrEqual(24);
    await expect.poll(
      () => page.evaluate(() => {
        const header = document.querySelector('.header').getBoundingClientRect();
        const toolbar = document.querySelector('.menu-sticky').getBoundingClientRect();
        return Math.round(toolbar.top - header.bottom);
      }),
      { message: `${route} keeps the sticky category controls below the navigation` },
    ).toBeGreaterThanOrEqual(0);
  }

  console.log('PASS: sticky navigation follows the mobile visual viewport offset');
} finally {
  await browser.close();
}
