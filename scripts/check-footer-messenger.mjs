import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts/footer-messenger', { recursive: true });
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium ? { channel: 'msedge' } : {});
  try {
    for (const [width, height] of [[360,640], [412,915], [430,740], [932,430], [1440,900]]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:5173/');
      await expect(page.locator('.floating-messenger')).toHaveCount(0);
      const link = page.locator('footer .footer-messenger');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute('href', 'https://www.facebook.com/messages/t/100959311683531');
      assert.equal(await link.evaluate(el => getComputedStyle(el).position), 'static');
      await link.scrollIntoViewIfNeeded();
      assert.ok((await link.boundingBox()).height >= 44);
      await link.focus();
      await expect(link).toBeFocused();
      const state = await page.evaluate(() => ({
        viewport: document.querySelector('meta[name=viewport]').content,
        canvas: getComputedStyle(document.documentElement).backgroundColor,
        overflow: document.documentElement.scrollWidth > innerWidth,
        footerPadding: parseFloat(getComputedStyle(document.querySelector('footer')).paddingBottom),
      }));
      assert.ok(state.viewport.includes('viewport-fit=cover'));
      assert.equal(state.canvas, width <= 820 ? 'rgb(18, 18, 18)' : 'rgb(255, 240, 214)');
      // The existing desktop header overflows at 932px; outside this footer fix.
      if (width <= 820 || width >= 1200) assert.equal(state.overflow, false);
      const linkBounds = await link.boundingBox();
      assert.ok(linkBounds.x >= 0 && linkBounds.x + linkBounds.width <= width);
      if (width <= 820) assert.ok(state.footerPadding >= 120);
      await page.screenshot({ path: `artifacts/footer-messenger/${engine.name()}-${width}.png` });
      await page.evaluate(() => localStorage.setItem('beandiner-bag-v2', JSON.stringify([{key:'latte',id:'latte',quantity:1,price:145,size:'16 oz'}])));
      await page.reload();
      await page.locator('footer .footer-messenger').scrollIntoViewIfNeeded();
      assert.ok(await page.locator('footer').evaluate(el => parseFloat(getComputedStyle(el).paddingBottom) >= 100));
      await page.getByRole('button', { name: /^Open bag,/ }).click();
      await expect(page.locator('.bag-modal')).toBeVisible();
      await page.getByRole('button', { name: 'Close dialog' }).click();
      assert.deepEqual(errors, []);
      console.log(`${engine.name()} ${width}x${height}: footer, canvas, keyboard, and bag passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
