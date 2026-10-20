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
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(150);

    await expect.poll(
      () => page.locator('.header').evaluate((header) => getComputedStyle(header).position),
      { message: `${route} lets the top navigation scroll out on mobile menu pages` },
    ).not.toBe('sticky');
    await expect.poll(
      () => page.locator('.menu-sticky').evaluate((toolbar) => getComputedStyle(toolbar).position),
      { message: `${route} keeps the category controls sticky while browsing` },
    ).toBe('sticky');
    await expect.poll(
      () => page.locator('.menu-sticky').evaluate((toolbar) => Math.round(toolbar.getBoundingClientRect().top)),
      { message: `${route} pins the category controls at the top after the nav scrolls away` },
    ).toBe(0);
  }

  await page.goto('http://127.0.0.1:5173/');
  await page.waitForSelector('.header');
  await expect.poll(
    () => page.locator('.header').evaluate((header) => getComputedStyle(header).position),
    { message: 'the homepage keeps its sticky navigation' },
  ).toBe('sticky');

  console.log('PASS: mobile menu pages scroll the top nav away and keep menu controls pinned');
} finally {
  await browser.close();
}
