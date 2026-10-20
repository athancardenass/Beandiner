import assert from 'node:assert/strict';
import { chromium, webkit } from '@playwright/test';

const engines = [
  { browserType: chromium, launchOptions: { channel: 'msedge' } },
  { browserType: webkit, launchOptions: {} },
];
const espresso = 'rgb(18, 18, 18)';

for (const { browserType, launchOptions } of engines) {
  const browser = await browserType.launch(launchOptions);
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
    await page.locator('main > .video-hero').waitFor();

    const surfaces = await page.evaluate(() => ({
      backdrop: getComputedStyle(document.querySelector('main')).backgroundColor,
      sections: [...document.querySelectorAll('main > section')].map(section => ({
        name: section.className,
        background: getComputedStyle(section).backgroundColor,
      })),
    }));
    assert.ok(surfaces.sections.length > 0, 'The homepage has full-width sections');
    assert.ok(
      surfaces.sections.every(section => section.background === espresso),
      'Every homepage section is dark, so its exposed underlay must also be dark',
    );
    assert.equal(
      surfaces.backdrop,
      espresso,
      'The mobile homepage backing stays dark if Safari briefly misses a section paint',
    );

    const scrollBackdrops = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise(resolve => requestAnimationFrame(resolve));
      const values = [];
      for (let y = window.scrollY; y >= 0; y -= 48) {
        window.scrollTo(0, y);
        await new Promise(resolve => requestAnimationFrame(resolve));
        values.push(getComputedStyle(document.querySelector('main')).backgroundColor);
      }
      return values;
    });
    assert.ok(
      scrollBackdrops.every(color => color === espresso),
      'The backing stays dark throughout a fast upward mobile scroll',
    );

    console.log(`${browserType.name()}: dark homepage backing holds during upward scroll`);
    await page.close();
  } finally {
    await browser.close();
  }
}
