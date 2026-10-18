import { webkit, expect } from '@playwright/test';

const browser = await webkit.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 430, height: 740 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'no-preference',
  });
  await page.goto('http://127.0.0.1:5173/');
  await page.addStyleTag({
    content: 'html { --mobile-toolbar-range: 80px !important; }',
  });
  await page.evaluate(() => window.scrollTo(0, 0));

  const viewportHeight = await page.evaluate(() => innerHeight);
  await expect.poll(() => page.locator('#drink-hero').evaluate(el =>
    Math.round(el.getBoundingClientRect().top - innerHeight),
  ), { message: 'Drink hero stays below the modeled Safari toolbar range' })
    .toBeGreaterThanOrEqual(80);

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 48);
  });
  await expect.poll(() => page.locator('#drink-hero').evaluate(el =>
    Math.round(el.getBoundingClientRect().top),
  ), { message: 'A short touch scroll does not expose the drink hero under the toolbar' })
    .toBeGreaterThanOrEqual(viewportHeight);

  const drinkHeroScroll = await page.locator('#drink-hero').evaluate(el => el.offsetTop + 250);
  await page.evaluate(scrollY => window.scrollTo(0, scrollY), drinkHeroScroll);
  await expect.poll(() => page.locator('#drink-hero h2').evaluate(el =>
    getComputedStyle(el).translate,
  ), { message: 'Touch scrolling does not add parallax motion to the drink heading' })
    .toBe('none');
  await expect.poll(() => page.locator('#drink-hero .hero-product-wrap').evaluate(el =>
    getComputedStyle(el).transform,
  ), { message: 'Touch scrolling does not add parallax motion to the drink product' })
    .toBe('none');

  console.log('PASS: mobile toolbar overlap and touch-scroll stability');
} finally {
  await browser.close();
}
