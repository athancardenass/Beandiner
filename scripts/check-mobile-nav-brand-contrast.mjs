import assert from 'node:assert/strict';
import { chromium, webkit } from '@playwright/test';

function luminance(color) {
  const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

for (const browserType of [chromium, webkit]) {
  const browser = await browserType.launch(browserType === chromium ? { channel: 'msedge' } : {});
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.locator('.nav-modal .logo-title').waitFor({ state: 'visible' });

    const brand = await page.locator('.nav-modal').evaluate(dialog => {
      const title = dialog.querySelector('.logo-title');
      const location = dialog.querySelector('.logo-location');
      const background = getComputedStyle(dialog).backgroundColor;
      return {
        background,
        title: getComputedStyle(title).color,
        location: getComputedStyle(location).color,
      };
    });

    for (const name of ['title', 'location']) {
      const ratio = contrastRatio(brand[name], brand.background);
      assert.ok(
        ratio >= 4.5,
        `${browserType.name()} navigation ${name} contrast is ${ratio.toFixed(2)}:1; expected at least 4.5:1`,
      );
    }

    console.log(`${browserType.name()}: navigation brand text has readable contrast on white`);
    await page.close();
  } finally {
    await browser.close();
  }
}
