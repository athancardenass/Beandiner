import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:5173/?page=beverages');
    await page.getByRole('button', { name: 'Customize Strawberry Milk', exact: true }).last().click();
    await page.getByRole('button', { name: 'Add to bag ₱160', exact: true }).click();
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
    await page.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
    const form = page.locator('#checkout-order-form');
    assert.equal(await form.getAttribute('autocomplete'), 'off', 'Checkout must not offer contact autofill');
    assert.equal(await page.locator('#order-name').getAttribute('autocomplete'), 'off');
    assert.equal(await page.locator('#order-phone').getAttribute('autocomplete'), 'off');
    for (const field of ['#order-name', '#order-phone', '#order-note']) {
      const input = page.locator(field);
      await input.focus();
      const style = await input.evaluate(el => {
        const computed = getComputedStyle(el);
        return { border: computed.borderTopColor, shadow: computed.boxShadow, outline: computed.outlineStyle };
      });
      assert.equal(style.border, 'rgb(110, 98, 86)', `${field} should use a neutral focus border`);
      assert.equal(style.shadow, 'none', `${field} should not add a focus glow`);
      assert.equal(style.outline, 'none', `${field} should not add a focus outline`);
    }
    const labels = page.locator('.timing-choice-row label');
    assert.ok(await labels.count());
    for (const label of await labels.all()) {
      const selection = await label.evaluate(el => {
        const style = getComputedStyle(el);
        return style.webkitUserSelect || style.userSelect;
      });
      assert.equal(selection, 'none', 'Time controls must not start text selection on touch');
    }
    await page.getByText('Custom time', { exact: true }).click();
    await expect(page.getByRole('radio', { name: 'Custom time', exact: true })).toBeChecked();
    const input = page.locator('#checkout-custom-time');
    await input.fill('2:45 PM');
    await input.evaluate(el => el.select());
    assert.deepEqual(await input.evaluate(el => [el.selectionStart, el.selectionEnd]), [0, 7], 'Editable time text remains selectable');
    await page.getByRole('radio', { name: 'Custom time', exact: true }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('radio', { name: 'Custom time', exact: true })).toBeChecked();
    for (const name of ['For pick up', 'Custom time', 'GCash']) {
      const radio = page.getByRole('radio', { name, exact: true });
      await radio.focus();
      await page.keyboard.press('Space');
      const focus = await radio.evaluate(el => {
        const style = getComputedStyle(el.closest('label'));
        return { visible: el.matches(':focus-visible'), outline: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      assert.ok(focus.visible && focus.outline !== 'none' && focus.width >= 2, `${name} needs a visible keyboard focus indicator`);
    }
    console.log(`${engine.name()}: no time-label text selection; custom input editing and keyboard focus work for all checkout selectors`);
  } finally {
    await browser.close();
  }
}
