import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';

const white = 'rgb(255, 255, 255)';

async function assertFieldDoesNotZoomOrResize(field, label) {
  const measure = () => field.evaluate(el => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      fontSize: Number.parseFloat(style.fontSize),
      width: rect.width,
      height: rect.height,
      transform: style.transform,
      scale: style.scale,
      viewportScale: window.visualViewport?.scale,
    };
  });
  const before = await measure();
  assert.ok(before.fontSize >= 16, `${label} must use at least 16px text`);
  await field.focus();
  assert.deepEqual(await measure(), before, `${label} must not zoom or resize on focus`);
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
    const productBackgroundPosition = await page.evaluate(() => getComputedStyle(document.body).position);
    await page.getByRole('button', { name: 'Customize Strawberry Milk', exact: true }).last().click();
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).position), 'fixed', 'The Top 6 customization modal must lock the page behind it on iPhone Safari');
    const productBackgroundScroll = await page.evaluate(() => -Number.parseFloat(document.body.style.top || '0'));
    const simulatedProductKeyboard = await page.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'height', { configurable: true, value: 360 });
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 0 });
      viewport.dispatchEvent(new Event('resize'));
      const modal = document.querySelector('dialog.product-modal:not(.bite-customize-modal)');
      const rect = modal.getBoundingClientRect();
      return {
        keyboardOpen: modal.classList.contains('is-keyboard-open'),
        bottom: rect.bottom,
        viewportBottom: viewport.offsetTop + viewport.height,
      };
    });
    assert.equal(simulatedProductKeyboard.keyboardOpen, true, 'Top 6 customization must detect the keyboard-reduced visual viewport');
    assert.ok(simulatedProductKeyboard.bottom <= simulatedProductKeyboard.viewportBottom, 'Top 6 customization must stay above the keyboard');
    const baristaNote = page.locator('#item-note');
    const productBodyTop = await page.evaluate(() => document.body.style.top);
    await baristaNote.focus();
    await expect.poll(() => baristaNote.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const { offsetTop, height } = window.visualViewport;
      return rect.top >= offsetTop && rect.bottom <= offsetTop + height;
    })).toBe(true);
    const focusedProductNote = await page.evaluate(() => {
      const field = document.querySelector('#item-note').getBoundingClientRect();
      const modal = document.querySelector('dialog.product-modal:not(.bite-customize-modal)').getBoundingClientRect();
      const { offsetTop, height } = window.visualViewport;
      return {
        fieldVisible: field.top >= offsetTop && field.bottom <= offsetTop + height,
        modalVisible: modal.bottom <= offsetTop + height,
        bodyTop: document.body.style.top,
      };
    });
    assert.equal(focusedProductNote.fieldVisible, true, 'Focusing the Top 6 barista note must keep the field above the keyboard');
    assert.equal(focusedProductNote.modalVisible, true, 'Focusing the Top 6 barista note must keep its modal above the keyboard');
    assert.equal(focusedProductNote.bodyTop, productBodyTop, 'Focusing the Top 6 barista note must not move the menu behind it');
    await baristaNote.blur();
    await page.evaluate(() => {
      const viewport = window.visualViewport;
      delete viewport.height;
      delete viewport.offsetTop;
      viewport.dispatchEvent(new Event('resize'));
    });
    assert.ok(
      Number.parseFloat(await baristaNote.evaluate(el => getComputedStyle(el).fontSize)) >= 16,
      'The Top 6 barista note must use at least 16px text to prevent iPhone Safari auto-zoom',
    );
    assert.equal(await baristaNote.getAttribute('autocomplete'), 'off', 'The barista note must not invoke contact autofill');
    await assertFieldDoesNotZoomOrResize(baristaNote, 'Top 6 barista note');
    await page.getByRole('button', { name: 'Add to bag ₱160', exact: true }).click();
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).position), productBackgroundPosition, 'Closing Top 6 customization must restore page positioning');
    assert.ok(
      Math.abs(await page.evaluate(() => window.scrollY) - productBackgroundScroll) <= 5,
      'Closing Top 6 customization must restore menu scroll position within 5px',
    );
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
    await page.waitForTimeout(400);
    const bagModal = page.locator('dialog.bag-modal');
    const bagStepBounds = await bagModal.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    });
    await page.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
    await expect(page.locator('.checkout-form-title')).toHaveText('Order Information');
    const detailsStepBounds = await bagModal.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    });
    assert.ok(Math.abs(detailsStepBounds.height - bagStepBounds.height) <= 1, `Opening Fill Out Form must keep the bag modal height: ${JSON.stringify({ bagStepBounds, detailsStepBounds })}`);
    assert.ok(Math.abs(detailsStepBounds.top - bagStepBounds.top) <= 1, `Opening Fill Out Form must not jump the bag modal: ${JSON.stringify({ bagStepBounds, detailsStepBounds })}`);
    const dialog = page.getByRole('dialog', { name: 'Your order bag', exact: true });
    const simulatedKeyboard = await page.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'height', { configurable: true, value: 360 });
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 0 });
      viewport.dispatchEvent(new Event('resize'));
      const bag = document.querySelector('dialog.bag-modal');
      const rect = bag.getBoundingClientRect();
      return {
        keyboardOpen: bag.classList.contains('is-keyboard-open'),
        height: rect.height,
        bottom: rect.bottom,
        viewportBottom: viewport.offsetTop + viewport.height,
      };
    });
    assert.equal(simulatedKeyboard.keyboardOpen, true, 'Order Bag must detect the reduced iPhone visual viewport');
    assert.ok(simulatedKeyboard.height <= 360, 'Order Bag must fit inside the keyboard-reduced viewport');
    assert.ok(simulatedKeyboard.bottom <= simulatedKeyboard.viewportBottom, 'Order Bag must end above the keyboard');
    const secondTapViewport = await page.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 32 });
      viewport.dispatchEvent(new Event('scroll'));
      const rect = document.querySelector('dialog.bag-modal').getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        viewportTop: viewport.offsetTop,
        viewportBottom: viewport.offsetTop + viewport.height,
      };
    });
    assert.ok(Math.abs(secondTapViewport.top - secondTapViewport.viewportTop) <= 1, `Second field tap must move Order Bag with visualViewport.offsetTop: ${JSON.stringify(secondTapViewport)}`);
    assert.ok(Math.abs(secondTapViewport.bottom - secondTapViewport.viewportBottom) <= 1, `Second field tap must close the bottom cutout: ${JSON.stringify(secondTapViewport)}`);
    await page.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 0 });
      viewport.dispatchEvent(new Event('scroll'));
    });
    const orderTypeBodyTop = await page.evaluate(() => document.body.style.top);
    for (const [index, fieldSelector] of [[1, '#checkout-table'], [2, '#checkout-address'], [0, null]]) {
      await page.locator('.order-type-row label').nth(index).click();
      const state = await page.evaluate(() => {
        const bag = document.querySelector('dialog.bag-modal');
        const rect = bag.getBoundingClientRect();
        const { offsetTop, height } = window.visualViewport;
        return {
          keyboardOpen: bag.classList.contains('is-keyboard-open'),
          bagVisible: rect.top >= offsetTop && rect.bottom <= offsetTop + height,
          bodyTop: document.body.style.top,
        };
      });
      assert.equal(state.keyboardOpen, true, 'Changing order type must retain the keyboard viewport state');
      assert.equal(state.bagVisible, true, 'Changing order type must keep the Order Bag above the keyboard');
      assert.equal(state.bodyTop, orderTypeBodyTop, 'Changing order type must keep the menu fixed behind the Order Bag');
      if (fieldSelector) {
        const field = page.locator(fieldSelector);
        await field.scrollIntoViewIfNeeded();
        await field.focus();
        await expect.poll(() => field.evaluate(el => {
          const rect = el.getBoundingClientRect();
          const { offsetTop, height } = window.visualViewport;
          return rect.top >= offsetTop && rect.bottom <= offsetTop + height;
        })).toBe(true);
        await field.blur();
      }
    }
    await page.evaluate(() => {
      const viewport = window.visualViewport;
      delete viewport.height;
      delete viewport.offsetTop;
      viewport.dispatchEvent(new Event('resize'));
    });
    for (const field of await page.locator('#checkout-order-form input:not([type="radio"]), #checkout-order-form textarea, #checkout-order-form select').all()) {
      assert.equal(await field.getAttribute('autocomplete'), 'off', 'Every Order Bag text field must opt out of autocomplete');
    }
    assert.equal(await page.locator('#order-name').getAttribute('name'), null, 'The customer name field must not advertise a contact autofill name');
    assert.equal(await page.locator('#order-phone').getAttribute('name'), null, 'The phone field must not advertise a contact autofill name');
    assert.equal(await page.locator('#order-phone').getAttribute('type'), 'text', 'The phone field must avoid tel type heuristics while retaining its numeric keyboard');
    assert.equal(await page.locator('#order-phone').getAttribute('inputmode'), 'numeric', 'The phone field must keep its numeric keyboard');
    for (const selector of ['#order-name', '#order-phone', '#order-note']) {
      await assertFieldDoesNotZoomOrResize(page.locator(selector), selector);
    }
    for (const [orderTypeIndex, fieldSelector] of [
      [1, '#checkout-table'],
      [2, '#checkout-address'],
    ]) {
      await page.locator('.order-type-row label').nth(orderTypeIndex).click();
      assert.equal(await page.locator(fieldSelector).getAttribute('autocomplete'), 'off', `${fieldSelector} must opt out of autocomplete`);
      assert.equal(await page.locator(fieldSelector).getAttribute('name'), null, `${fieldSelector} must not advertise an autofill field name`);
      await assertFieldDoesNotZoomOrResize(page.locator(fieldSelector), fieldSelector);
    }
    await page.locator('.order-type-row label').first().click();
    const bagContentForScroll = dialog;
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
    await page.getByRole('radio', { name: 'Custom time', exact: true }).check();
    assert.equal(await page.locator('#checkout-custom-time').getAttribute('type'), 'time', 'Custom pickup time must use the native time picker instead of a text keyboard');
    assert.equal(await page.locator('#checkout-custom-time').getAttribute('min'), '10:00');
    assert.equal(await page.locator('#checkout-custom-time').getAttribute('max'), '20:59');
    await assertFieldDoesNotZoomOrResize(page.locator('#checkout-custom-time'), 'Custom pickup time');
    for (const selector of ['#order-name', '#order-phone', '#checkout-custom-time', '#order-note']) {
      assert.equal(await page.locator(selector).getAttribute('autocomplete'), 'off', `${selector} should opt out of browser autocomplete`);
    }
    const note = page.locator('#order-note');
    const bagViewportState = () => page.evaluate(() => {
      const modal = document.querySelector('dialog.bag-modal');
      const rect = modal.getBoundingClientRect();
      const { offsetTop, height } = window.visualViewport;
      return {
        height: rect.height,
        top: rect.top,
        bottom: rect.bottom,
        viewportTop: offsetTop,
        viewportBottom: offsetTop + height,
      };
    });
    const setBagVisualViewport = (height, offsetTop, eventName) => page.evaluate(({ height, offsetTop, eventName }) => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'height', { configurable: true, value: height });
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: offsetTop });
      viewport.dispatchEvent(new Event(eventName));
    }, { height, offsetTop, eventName });
    for (const selector of ['#order-name', '#order-phone', '#order-note']) {
      const field = page.locator(selector);
      await field.scrollIntoViewIfNeeded();
      await field.focus();
      await setBagVisualViewport(360, 0, 'resize');
      const keyboardOpen = await bagViewportState();
      await setBagVisualViewport(360, 32, 'scroll');
      const afterViewportScroll = await bagViewportState();
      assert.ok(afterViewportScroll.height >= keyboardOpen.height - 1, `${selector} focus must not collapse the bag on visualViewport scroll: ${JSON.stringify(afterViewportScroll)}`);
      assert.ok(Math.abs(afterViewportScroll.top - afterViewportScroll.viewportTop) <= 1, `${selector} scroll must keep the bag aligned to the visible viewport: ${JSON.stringify(afterViewportScroll)}`);

      await page.waitForTimeout(120);
      await setBagVisualViewport(326, 32, 'resize');
      await page.waitForTimeout(120);
      const afterFirstAutofillBarStep = await bagViewportState();
      assert.ok(afterFirstAutofillBarStep.height >= 325 && afterFirstAutofillBarStep.height <= 326, `${selector} first AutoFill-bar height change must resize the bag: ${JSON.stringify(afterFirstAutofillBarStep)}`);
      await setBagVisualViewport(300, 32, 'resize');
      await page.waitForTimeout(120);
      const afterAutofillBar = await bagViewportState();
      assert.ok(afterAutofillBar.height >= 299 && afterAutofillBar.height <= 300, `${selector} AutoFill-bar resize must refresh bag height: ${JSON.stringify(afterAutofillBar)}`);
      assert.ok(Math.abs(afterAutofillBar.top - afterAutofillBar.viewportTop) <= 1, `${selector} must keep the bag top inside the visible viewport after AutoFill-bar resize: ${JSON.stringify(afterAutofillBar)}`);
      assert.ok(Math.abs(afterAutofillBar.bottom - afterAutofillBar.viewportBottom) <= 1, `${selector} must keep the bag bottom above the keyboard after AutoFill-bar resize: ${JSON.stringify(afterAutofillBar)}`);

      await setBagVisualViewport(360, 0, 'scroll');
      const restoredKeyboard = await bagViewportState();
      assert.ok(restoredKeyboard.height >= keyboardOpen.height - 1, `${selector} must recover the full keyboard viewport height: ${JSON.stringify(restoredKeyboard)}`);
      await field.blur();
    }
    await page.evaluate(() => {
      const viewport = window.visualViewport;
      delete viewport.height;
      delete viewport.offsetTop;
      viewport.dispatchEvent(new Event('resize'));
    });
    await page.setViewportSize({ width: 390, height: 360 });
    await note.scrollIntoViewIfNeeded();
    await note.focus();
    await expect.poll(() => dialog.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    })).toBe(true);
    await expect.poll(() => note.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    })).toBe(true);
    const bagScrollState = () => dialog.evaluate(el => {
      const content = el.querySelector('.bag-content');
      return {
        dialogOverflow: getComputedStyle(el).overflowY,
        contentOverflow: getComputedStyle(content).overflowY,
        dialogCanScroll: el.scrollHeight > el.clientHeight,
        contentCanScroll: content.scrollHeight > content.clientHeight,
      };
    });
    await expect.poll(bagScrollState).toEqual({ dialogOverflow: 'auto', contentOverflow: 'visible', dialogCanScroll: true, contentCanScroll: false });
    const upwardScroll = await dialog.evaluate(el => {
      el.scrollTop = el.scrollHeight;
      const bottom = el.scrollTop;
      el.scrollTop = Math.max(0, bottom - 120);
      return { bottom, after: el.scrollTop };
    });
    assert.ok(upwardScroll.bottom > 0 && upwardScroll.after < upwardScroll.bottom, 'Order Bag content must scroll upward while an input has focus');
    const submit = page.getByRole('button', { name: 'Send order via Messenger', exact: true });
    await submit.scrollIntoViewIfNeeded();
    await expect.poll(() => submit.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const { offsetTop, height } = window.visualViewport;
      return rect.top >= offsetTop && rect.bottom <= offsetTop + height;
    })).toBe(true);
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
          return rect.top >= 0 && rect.bottom <= innerHeight;
        })).toBe(true);
      }
    }
    for (const height of [844, 460, 660, 900]) {
      await page.setViewportSize({ width: 390, height });
      await page.locator('#order-name').focus();
      for (const end of ['bottom', 'top']) {
        await dialog.evaluate((el, end) => {
          el.scrollTop = end === 'bottom' ? el.scrollHeight : 0;
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
    console.log(`${engine.name()}: Order Bag locks the menu and scrolls its focused 16px fields without zooming`);
  } finally {
    await browser.close();
  }
}
