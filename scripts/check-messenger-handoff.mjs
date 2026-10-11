import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const mode of ['success', 'fallback', 'failure']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.addInitScript((mode) => {
      localStorage.setItem('beandiner-bag-v2', JSON.stringify([{ key: 'latte', id: 'latte', quantity: 1, price: 145, size: '16 oz' }]));
      window.copyCalls = 0;
      window.resolveCopy = null;
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: () => { window.copyCalls++; return new Promise((resolve, reject) => { window.resolveCopy = () => mode === 'success' || window.copyCalls > 1 ? resolve() : reject(new Error('Blocked')); }); },
      } });
      document.execCommand = () => mode === 'fallback';
    }, mode);
    await page.goto('http://127.0.0.1:5173/');
    await page.clock.install({ time: new Date('2026-10-11T04:00:00Z') });
    await page.getByRole('button', { name: /^Open bag,/ }).click();
    await page.getByRole('button', { name: /Proceed to Details/ }).click();
    await page.locator('#order-name').fill('Karl Santos');
    await page.locator('#order-phone').fill('09123456789');
    await page.getByRole('button', { name: /Continue to Messenger/ }).click();
    await expect(page.getByRole('button', { name: /Copying order/ })).toBeDisabled();
    await expect(page.locator('.receipt')).toHaveCount(0);
    await page.evaluate(() => window.resolveCopy());
    await expect(page.locator('.receipt')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Messenger', exact: false })).toBeInViewport();
    const position = await page.evaluate(() => ({ action: document.querySelector('.receipt-actions-group').getBoundingClientRect().top, guide: document.querySelector('.ordering-steps-handoff').getBoundingClientRect().top }));
    assert.ok(position.action < position.guide);
    if (mode === 'failure') {
      await expect(page.locator('#manual-order-copy')).toContainText('Karl Santos');
      await expect(page.locator('.receipt-intro')).toContainText('failed');
      await page.getByRole('button', { name: 'Select order text' }).click();
      assert.ok(await page.locator('#manual-order-copy').evaluate(el => el.selectionEnd === el.value.length));
      await page.getByRole('button', { name: 'Copy Text' }).click();
      await page.evaluate(() => window.resolveCopy());
      await expect(page.locator('#manual-order-copy')).toHaveCount(0);
    }
    await expect(page.locator('.receipt-intro')).toContainText('copied');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('beandiner-bag-v2')).length), 1);
    console.log(`Handoff ${mode} passed`);
    await page.close();
  }
  const page = await browser.newPage();
  for (const route of ['beverages', 'diner-bites']) {
    await page.goto('http://127.0.0.1:5173/?page=' + route);
    const tabs = page.locator('.menu-tabs .menu-tab');
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(tabs.nth(1).locator('.menu-tab-selected')).toHaveCount(1);
    assert.ok((await tabs.nth(1).innerText()).includes(route === 'beverages' ? 'Hot coffee' : 'Croffles'));
  }
  await page.close();
} finally { await browser.close(); }
