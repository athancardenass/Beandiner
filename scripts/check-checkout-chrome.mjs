import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';

const white = 'rgb(255, 255, 255)';

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const canvas = () => page.evaluate(() => ({
      root: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      scheme: getComputedStyle(document.documentElement).colorScheme,
      theme: document.querySelector('meta[name="theme-color"]').content,
    }));
    const viewportBackground = () => page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--viewport-background').trim(),
    );
    const pageContentVisibility = () => page.locator('.header').evaluate(el => getComputedStyle(el).visibility);
    const bagBackdrop = () => page.locator('dialog.bag-modal').evaluate(el => {
      const style = getComputedStyle(el, '::backdrop');
      return { background: style.backgroundColor, filter: style.backdropFilter };
    });
    await page.goto('http://127.0.0.1:5173/?page=beverages');
    await page.getByRole('button', { name: 'Customize Strawberry Milk', exact: true }).last().click();
    await page.getByRole('button', { name: 'Add to bag ₱160', exact: true }).click();
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, 0);
    });
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await expect.poll(viewportBackground).toBe('#FFFFFF');
    await expect.poll(bagBackdrop).toEqual({ background: white, filter: 'none' });
    await expect.poll(pageContentVisibility).toBe('hidden');
    await page.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Your order bag', exact: true });
    await page.getByRole('radio', { name: 'Custom time', exact: true }).check();
    for (const selector of ['#order-name', '#order-phone', '#checkout-custom-time', '#order-note']) {
      assert.equal(await page.locator(selector).getAttribute('autocomplete'), 'off', `${selector} should opt out of browser autocomplete`);
    }
    const note = page.locator('#order-note');
    await note.scrollIntoViewIfNeeded();
    await note.focus();
    // iOS Safari shrinks the visible viewport when its keyboard opens.
    await page.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'height', { configurable: true, value: 360 });
      viewport.dispatchEvent(new Event('resize'));
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 24 });
      viewport.dispatchEvent(new Event('scroll'));
    });
    await expect.poll(() => dialog.evaluate(el => el.style.getPropertyValue('--bag-viewport-top'))).toBe('24px');
    await expect.poll(() => dialog.evaluate(el => el.getBoundingClientRect().height)).toBeLessThanOrEqual(360);
    await expect.poll(() => page.locator('.bag-content').evaluate(el => el.getBoundingClientRect().height)).toBeLessThanOrEqual(360);
    await expect.poll(() => note.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const { offsetTop, height } = window.visualViewport;
      return rect.top >= offsetTop && rect.bottom <= offsetTop + height;
    })).toBe(true);
    const submit = page.getByRole('button', { name: 'Send order via Messenger', exact: true });
    await submit.evaluate(el => el.scrollIntoView({ block: 'end' }));
    await expect.poll(() => submit.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const { offsetTop, height } = window.visualViewport;
      return rect.top >= offsetTop && rect.bottom <= offsetTop + height;
    })).toBe(true);
    const firstOrderType = page.locator('.order-type-row label').first();
    await firstOrderType.scrollIntoViewIfNeeded();
    const scrollBeforeViewportShift = await dialog.evaluate(el => [el.scrollTop, el.querySelector('.bag-content').scrollTop]);
    await page.evaluate(async () => {
      Object.defineProperty(window.visualViewport, 'offsetTop', { configurable: true, value: 32 });
      window.visualViewport.dispatchEvent(new Event('scroll'));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const scrollAfterViewportShift = await dialog.evaluate(el => [el.scrollTop, el.querySelector('.bag-content').scrollTop]);
    assert.deepEqual(scrollAfterViewportShift, scrollBeforeViewportShift, 'Safari viewport shifts must not pull the form back to the last focused input');
    for (const selector of [
      '.order-type-row label',
      '.timing-choice-row label',
      '.payment-choice-row label',
      '#order-name',
      '#order-phone',
      '#order-note',
    ]) {
      const controls = page.locator(selector);
      for (const control of await controls.all()) {
        await control.scrollIntoViewIfNeeded();
        await expect.poll(() => control.evaluate(el => {
          const rect = el.getBoundingClientRect();
          const { offsetTop, height } = window.visualViewport;
          return rect.top >= offsetTop && rect.bottom <= offsetTop + height;
        })).toBe(true);
      }
    }
    await page.evaluate(() => {
      delete window.visualViewport.height;
      window.visualViewport.dispatchEvent(new Event('resize'));
    });
    await expect.poll(() => dialog.evaluate(el => el.style.getPropertyValue('--bag-viewport-top'))).toBe('0px');
    await page.evaluate(() => {
      delete window.visualViewport.offsetTop;
      window.visualViewport.dispatchEvent(new Event('resize'));
    });
    for (const height of [844, 460, 660, 900]) {
      await page.setViewportSize({ width: 390, height });
      await page.locator('#order-name').focus();
      for (const end of ['bottom', 'top']) {
        await dialog.evaluate((el, end) => {
          for (const node of [el, el.querySelector('.bag-content')]) {
            node.scrollTop = end === 'bottom' ? node.scrollHeight : 0;
          }
        }, end);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
        assert.equal(await dialog.evaluate(el => getComputedStyle(el).backgroundColor), white, 'Checkout surface stays white');
      }
    }
    await page.getByRole('button', { name: 'Back to Bag', exact: true }).click();
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(pageContentVisibility).toBe('visible');
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await expect.poll(viewportBackground).toBe('');
    // Reopening and Escape must also restore the menu canvas without leaked state.
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await expect.poll(viewportBackground).toBe('#FFFFFF');
    await page.keyboard.press('Escape');
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await expect.poll(viewportBackground).toBe('');
    await page.goto('http://127.0.0.1:5173/');
    await expect.poll(viewportBackground).toBe('#121212');
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
    await expect.poll(viewportBackground).toBe('#FFFFFF');
    await expect.poll(bagBackdrop).toEqual({ background: white, filter: 'none' });
    await expect.poll(pageContentVisibility).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect.poll(viewportBackground).toBe('#121212');
    await expect.poll(pageContentVisibility).toBe('visible');
    assert.deepEqual(errors, []);
    console.log(`${engine.name()}: checkout options stay reachable with the keyboard open and browser chrome stays white`);
  } finally {
    await browser.close();
  }
}
