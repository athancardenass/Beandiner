import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';

const white = 'rgb(255, 255, 255)';

async function assertFieldDoesNotShiftOnFocus(field, label) {
  const measure = () => field.evaluate(el => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      fontSize: Number.parseFloat(style.fontSize),
      width: rect.width,
      height: rect.height,
      minHeight: style.minHeight,
      transform: style.transform,
      scale: style.scale,
      translate: style.translate,
      viewportScale: window.visualViewport?.scale,
    };
  });
  const before = await measure();
  assert.ok(before.fontSize >= 16, `${label} must use at least 16px text`);
  await field.focus();
  const after = await measure();
  assert.deepEqual(after, before, `${label} must not resize or transform when focused`);
  await field.evaluate(el => el.blur());
}

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
      return { background: style.backgroundColor, image: style.backgroundImage, filter: style.backdropFilter };
    });
    await page.goto('http://127.0.0.1:5173/?page=beverages');
    await page.getByRole('button', { name: 'Customize Strawberry Milk', exact: true }).last().click();
    const baristaNote = page.locator('#item-note');
    assert.ok(
      Number.parseFloat(await baristaNote.evaluate(el => getComputedStyle(el).fontSize)) >= 16,
      'The Top 6 barista note must use at least 16px text to prevent iPhone Safari auto-zoom',
    );
    assert.equal(await baristaNote.getAttribute('autocomplete'), 'off', 'The barista note must not invoke contact autofill');
    await assertFieldDoesNotShiftOnFocus(baristaNote, 'Top 6 barista note');
    await page.getByRole('button', { name: 'Add to bag ₱160', exact: true }).click();
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, 0);
    });
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const backgroundScrollBeforeBag = await page.evaluate(() => window.scrollY);
    const backgroundBodyPosition = await page.evaluate(() => getComputedStyle(document.body).position);
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).evaluate(button => button.click());
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await expect.poll(viewportBackground).toBe('');
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).position), 'fixed', 'The Order Bag must lock the page behind it on iPhone Safari');
    assert.equal(await page.evaluate(() => Math.round(document.body.getBoundingClientRect().top)), -backgroundScrollBeforeBag, 'Opening the Order Bag must keep the menu visually anchored');
    await expect.poll(bagBackdrop).toEqual({ background: 'rgba(18, 18, 18, 0.75)', image: 'none', filter: 'blur(5px)' });
    await expect.poll(pageContentVisibility).toBe('visible');
    await page.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Your order bag', exact: true });
    for (const field of await page.locator('#checkout-order-form input:not([type="radio"]), #checkout-order-form textarea, #checkout-order-form select').all()) {
      assert.equal(await field.getAttribute('autocomplete'), 'off', 'Every Order Bag text field must opt out of autocomplete');
    }
    assert.equal(await page.locator('#order-name').getAttribute('name'), null, 'The customer name field must not advertise a contact autofill name');
    assert.equal(await page.locator('#order-phone').getAttribute('name'), null, 'The phone field must not advertise a contact autofill name');
    assert.equal(await page.locator('#order-phone').getAttribute('type'), 'text', 'The phone field must avoid tel type heuristics while retaining its numeric keyboard');
    assert.equal(await page.locator('#order-phone').getAttribute('inputmode'), 'numeric', 'The phone field must keep its numeric keyboard');
    for (const selector of ['#order-name', '#order-phone', '#order-note']) {
      await assertFieldDoesNotShiftOnFocus(page.locator(selector), selector);
    }
    for (const [orderTypeIndex, fieldSelector] of [
      [1, '#checkout-table'],
      [2, '#checkout-address'],
    ]) {
      await page.locator('.order-type-row label').nth(orderTypeIndex).click();
      assert.equal(await page.locator(fieldSelector).getAttribute('autocomplete'), 'off', `${fieldSelector} must opt out of autocomplete`);
      assert.equal(await page.locator(fieldSelector).getAttribute('name'), null, `${fieldSelector} must not advertise an autofill field name`);
    }
    await page.locator('.order-type-row label').first().click();
    await page.locator('.order-type-row label').nth(1).click();
    await assertFieldDoesNotShiftOnFocus(page.locator('#checkout-table'), 'Dine-in table field');
    await page.locator('.order-type-row label').nth(2).click();
    await assertFieldDoesNotShiftOnFocus(page.locator('#checkout-address'), 'Delivery address field');
    await page.locator('.order-type-row label').first().click();
    await page.getByRole('radio', { name: 'Custom time', exact: true }).check();
    await assertFieldDoesNotShiftOnFocus(page.locator('#checkout-custom-time'), 'Custom pickup time field');
    const bagContentForScroll = page.locator('.bag-content');
    if (engine.name() === 'chromium') {
      const bagContentBounds = await bagContentForScroll.boundingBox();
      await page.mouse.move(bagContentBounds.x + bagContentBounds.width / 2, bagContentBounds.y + bagContentBounds.height / 2);
      await page.mouse.wheel(0, 240);
    } else {
      await bagContentForScroll.evaluate(el => { el.scrollTop = 160; });
    }
    await expect.poll(() => bagContentForScroll.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    assert.equal(await page.evaluate(() => Math.round(document.body.getBoundingClientRect().top)), -backgroundScrollBeforeBag, 'Scrolling the Order Bag must not move the menu behind it');
    const fieldFontSizes = await dialog.evaluate(el => {
      const probe = document.createElement('div');
      probe.innerHTML = '<input type="text"><select><option>Option</option></select><textarea></textarea>';
      el.querySelector('.bag-content').append(probe);
      const sizes = Array.from(el.querySelectorAll('input, select, textarea'), control => ({
        type: control.type ?? control.tagName.toLowerCase(),
        size: Number.parseFloat(getComputedStyle(control).fontSize),
      }));
      probe.remove();
      return sizes;
    });
    assert.ok(fieldFontSizes.length > 0, 'Order Bag should expose form controls');
    assert.ok(fieldFontSizes.every(({ size }) => size >= 16), `Every Order Bag form control must be at least 16px: ${JSON.stringify(fieldFontSizes)}`);
    assert.doesNotMatch(await page.locator('meta[name="viewport"]').getAttribute('content'), /maximum-scale|user-scalable\s*=\s*no/i, 'Viewport must keep pinch zoom available');
    for (const selector of ['#order-name', '#order-phone', '#checkout-custom-time', '#order-note']) {
      assert.equal(await page.locator(selector).getAttribute('autocomplete'), 'off', `${selector} should opt out of browser autocomplete`);
    }
    const note = page.locator('#order-note');
    await note.scrollIntoViewIfNeeded();
    const pageScrollBeforeKeyboard = await page.evaluate(() => window.scrollY);
    const dialogScrollBeforeKeyboard = await dialog.evaluate(el => el.scrollTop);
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
    await expect.poll(() => dialog.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const { offsetTop, height } = window.visualViewport;
      return rect.top >= offsetTop && rect.bottom <= offsetTop + height;
    })).toBe(true);
    assert.equal(await page.evaluate(() => window.scrollY), pageScrollBeforeKeyboard, 'Opening the keyboard must not scroll the page behind the Order Bag');
    assert.equal(await dialog.evaluate(el => el.scrollTop), dialogScrollBeforeKeyboard, 'Keyboard adjustment must not move the dialog outside its own content scroller');
    const keyboardBackdrop = await bagBackdrop();
    assert.ok(keyboardBackdrop.image.startsWith('linear-gradient('), 'Keyboard-open backdrop should use a scoped white gap');
    assert.ok(keyboardBackdrop.image.includes('rgb(255, 255, 255)'), 'Keyboard gap should be white');
    assert.ok(keyboardBackdrop.image.includes('rgba(18, 18, 18, 0.75)'), 'Area above the keyboard gap should keep the dark backdrop');
    assert.ok(keyboardBackdrop.image.indexOf('rgba(18, 18, 18, 0.75)') < keyboardBackdrop.image.indexOf('rgb(255, 255, 255)'), 'The white gap must begin below the dark top area');
    assert.equal(keyboardBackdrop.filter, 'blur(5px)');
    const bandBounds = await dialog.evaluate(el => ({
      start: Number.parseFloat(el.style.getPropertyValue('--bag-dialog-bottom')),
      end: Number.parseFloat(el.style.getPropertyValue('--bag-viewport-bottom')),
      dialogBottom: Math.ceil(el.getBoundingClientRect().bottom),
      viewportBottom: Math.ceil(window.visualViewport.offsetTop + window.visualViewport.height),
    }));
    assert.deepEqual(bandBounds, {
      start: Math.min(bandBounds.viewportBottom, bandBounds.dialogBottom),
      end: bandBounds.viewportBottom,
      dialogBottom: bandBounds.dialogBottom,
      viewportBottom: bandBounds.viewportBottom,
    });
    const bagScrollState = () => dialog.evaluate(el => {
      const content = el.querySelector('.bag-content');
      return {
        dialogOverflow: getComputedStyle(el).overflowY,
        contentOverflow: getComputedStyle(content).overflowY,
        contentCanScroll: content.scrollHeight > content.clientHeight,
      };
    });
    await expect.poll(bagScrollState).toEqual({ dialogOverflow: 'hidden', contentOverflow: 'auto', contentCanScroll: true });
    const upwardScroll = await dialog.evaluate(el => {
      const content = el.querySelector('.bag-content');
      content.scrollTop = content.scrollHeight;
      const bottom = content.scrollTop;
      content.scrollTop = Math.max(0, bottom - 120);
      return { bottom, after: content.scrollTop };
    });
    assert.ok(upwardScroll.bottom > 0 && upwardScroll.after < upwardScroll.bottom, 'Order Bag content must scroll upward while an input has focus');
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
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).position), backgroundBodyPosition, 'Closing the Order Bag must restore body positioning');
    assert.equal(await page.evaluate(() => window.scrollY), backgroundScrollBeforeBag, 'Closing the Order Bag must restore the menu scroll position');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(pageContentVisibility).toBe('visible');
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await expect.poll(viewportBackground).toBe('');
    // Reopening and Escape must also restore the menu canvas without leaked state.
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await expect.poll(viewportBackground).toBe('');
    await page.keyboard.press('Escape');
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await expect.poll(viewportBackground).toBe('');
    await page.goto('http://127.0.0.1:5173/');
    await expect.poll(viewportBackground).toBe('#121212');
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
    await expect.poll(viewportBackground).toBe('#121212');
    await expect.poll(bagBackdrop).toEqual({ background: 'rgba(18, 18, 18, 0.75)', image: 'none', filter: 'blur(5px)' });
    await expect.poll(pageContentVisibility).toBe('visible');
    await page.keyboard.press('Escape');
    await expect.poll(viewportBackground).toBe('#121212');
    await expect.poll(pageContentVisibility).toBe('visible');
    assert.deepEqual(errors, []);
    console.log(`${engine.name()}: Order Bag locks the menu, preserves 16px fields, and scopes the keyboard gap`);
  } finally {
    await browser.close();
  }
}
