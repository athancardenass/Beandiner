import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(() => {
      localStorage.setItem('beandiner-bag-v2', JSON.stringify([{ key: 'latte', id: 'latte', size: '16 oz', milk: 'Regular', temperature: 'Iced', quantity: 1, price: 145 }]));
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/?page=beverages');
    await page.getByRole('button', { name: /^Open bag,/ }).click();
    await page.getByRole('button', { name: /Proceed to Details/ }).click();
    const submit = page.getByRole('button', { name: /Continue to Messenger/ });
    await submit.click();
    await expect(page.locator('#order-name')).toBeFocused();
    await expect(page.locator('#order-name-error')).toBeVisible();
    await page.locator('#order-name').fill('Karl Santos');
    await page.locator('#order-phone').fill('+639123456789');
    await expect(page.locator('#order-phone')).toHaveValue('0912-345-6789');
    for (const type of ['pickup', 'dine-in', 'delivery']) {
      await page.locator(`input[name="checkoutOrderType"]`).nth(['pickup', 'dine-in', 'delivery'].indexOf(type)).locator("..").click();
      await expect(page.locator('#checkout-address')).toHaveCount(type === 'delivery' ? 1 : 0);
      await expect(page.locator('#checkout-table')).toHaveCount(type === 'dine-in' ? 1 : 0);
    }
    await submit.click();
    await expect(page.locator('#checkout-address')).toBeFocused();
    await expect(page.locator('#checkout-address-error')).toBeVisible();
    await page.locator('#checkout-address').fill('123 Antonio Luna St., Zone 2, Bayambang');
    await page.locator('#checkout-landmark').fill('Opposite barangay hall');
    await page.getByText('Custom time', { exact: true }).click();
    await page.locator('#checkout-custom-time').fill('09:30');
    await submit.click();
    await expect(page.locator('#checkout-time-error')).toContainText('10:00 AM');
    await submit.click();
    await expect(page.locator('#checkout-custom-time')).toBeFocused();
    // Freeze Manila time at noon so a valid afternoon handoff is deterministic.
    await page.clock.install({ time: new Date('2026-10-11T04:00:00Z') });
    await page.locator('#checkout-custom-time').fill('14:45');
    assert.equal(await page.locator('.bag-modal').evaluate(el => el.scrollWidth > el.clientWidth), false);
    await submit.click();
    await expect(page.locator('.receipt')).toBeVisible();
    await expect(page.locator('.receipt-summary-text')).toContainText('Landmark: Opposite barangay hall');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('beandiner-bag-v2')).length), 1);
    const actions = await page.locator('.receipt-menu-actions .button').evaluateAll(els => els.map(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, width: rect.width };
    }));
    assert.ok(actions[1].top - actions[0].bottom >= 16);
    assert.equal(actions[0].width, actions[1].width);
    await page.getByRole('button', { name: 'Back to Menu', exact: true }).click();
    await expect(page.locator('.bag-modal')).toHaveCount(0);
    await expect.poll(() => page.locator('#drinks-menu').evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(200);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('beandiner-bag-v2')).length), 1);
    await page.getByRole('button', { name: /^Open bag,/ }).click();
    await page.getByRole('button', { name: /Proceed to Details/ }).click();
    await submit.click();
    await expect(page.locator('.receipt')).toBeVisible();
    await page.getByRole('button', { name: 'Clear bag and start a new order' }).click();
    await expect(page.locator('.bag-modal')).toHaveCount(0);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('beandiner-bag-v2')).length), 0);
    assert.deepEqual(errors, []);
    console.log(`Checkout details passed at ${width}px`);
    await context.close();
  }
} finally { await browser.close(); }
