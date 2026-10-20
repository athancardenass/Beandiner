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
    assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - productBackgroundScroll) <= 4, 'Closing Top 6 customization must restore menu scroll position within browser scroll rounding');
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
    assert.equal(await page.locator('meta[name="color-scheme"]').getAttribute('content'), 'light', 'Checkout keeps the form palette stable in dark mode');
    await expect.poll(viewportBackground).toBe('');
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).position), 'fixed', 'The Order Bag must lock the page behind it on iPhone Safari');
    assert.equal(await page.evaluate(() => Math.round(document.body.getBoundingClientRect().top)), -backgroundScrollBeforeBag, 'Opening the Order Bag must keep the menu visually anchored');
    await expect.poll(bagBackdrop).toEqual({ background: 'rgba(18, 18, 18, 0.75)', image: 'none', filter: 'blur(5px)' });
    await expect.poll(pageContentVisibility).toBe('visible');
    await page.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
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
    const bagContentForScroll = page.locator('.bag-modal-body');
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
    const customTime = page.locator('#checkout-custom-time');
    assert.equal(await customTime.getAttribute('type'), 'time', 'Custom pickup time must use the native time picker instead of a text keyboard');
    assert.equal(await customTime.getAttribute('min'), '10:00');
    assert.equal(await customTime.getAttribute('max'), '20:59');
    await customTime.fill('16:30');
    assert.equal(await page.locator('#checkout-time-error').count(), 0, 'A valid custom time must not insert a blur validation message');
    await assertFieldDoesNotZoomOrResize(customTime, 'Custom pickup time');
    for (const selector of ['#order-name', '#order-phone', '#checkout-custom-time', '#order-note']) {
      assert.equal(await page.locator(selector).getAttribute('autocomplete'), 'off', `${selector} should opt out of browser autocomplete`);
    }
    const note = page.locator('#order-note');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => { window.scrollTo(0, 0); });
    await page.locator('#checkout-order-form').evaluate(el => { window.__checkoutFormNode = el; });
    await note.evaluate(el => { window.__checkoutNoteNode = el; });
    await note.focus();
    await note.fill('Please add less ice');
    await page.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'height', { configurable: true, value: 320 });
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 28 });
      viewport.dispatchEvent(new Event('resize'));
      viewport.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(1100);
    const focusedNoteState = await page.evaluate(() => {
      const sheet = document.querySelector('dialog.bag-modal');
      const header = sheet.querySelector('.bag-modal-header');
      const body = sheet.querySelector('.bag-modal-body');
      const noteField = document.querySelector('#order-note');
      const noteRect = noteField.getBoundingClientRect();
      const bodyRect = body?.getBoundingClientRect();
      const sheetRect = sheet.getBoundingClientRect();
      const { offsetTop, height } = window.visualViewport;
      return {
        sameInput: window.__checkoutNoteNode === noteField,
        sameForm: window.__checkoutFormNode === document.querySelector('#checkout-order-form'),
        focused: document.activeElement === noteField,
        bodyExists: Boolean(body),
        sheetTop: sheetRect.top,
        sheetBottom: sheetRect.bottom,
        viewportTop: offsetTop,
        viewportBottom: offsetTop + height,
        fieldVisibleAboveAccessory: Boolean(bodyRect) && noteRect.top >= Math.max(bodyRect.top, offsetTop) && noteRect.bottom <= Math.min(bodyRect.bottom, offsetTop + height) - 52,
        headerTop: header?.getBoundingClientRect().top ?? null,
        bodyScrollTop: body?.scrollTop ?? null,
        bodyRect: bodyRect ? { top: bodyRect.top, bottom: bodyRect.bottom } : null,
        fieldRect: { top: noteRect.top, bottom: noteRect.bottom },
        keyboardOpen: sheet.classList.contains('is-keyboard-open'),
        windowScrollY: window.scrollY,
        bodyTop: document.body.style.top,
      };
    });
    assert.equal(focusedNoteState.sameInput, true, 'The Step 2 note input must not remount after its controlled value changes');
    assert.equal(focusedNoteState.sameForm, true, 'Typing a note must not remount the Step 2 form');
    assert.equal(focusedNoteState.focused, true, 'The Step 2 note must remain focused after the keyboard settles');
    assert.equal(focusedNoteState.bodyExists, true, 'The mobile Order Bag must keep header and scrollable body separate');
    assert.ok(Math.abs(focusedNoteState.sheetTop - focusedNoteState.viewportTop) <= 1, 'The Order Bag top must follow visualViewport.offsetTop');
    assert.ok(Math.abs(focusedNoteState.sheetBottom - focusedNoteState.viewportBottom) <= 1, 'The Order Bag height must follow visualViewport.height');
    assert.equal(focusedNoteState.fieldVisibleAboveAccessory, true, `The focused note must stay above the AutoFill bar and keyboard: ${JSON.stringify(focusedNoteState)}`);
    assert.ok(focusedNoteState.headerTop >= focusedNoteState.viewportTop && focusedNoteState.headerTop < focusedNoteState.viewportBottom, 'The Order Bag header must stay visible above the keyboard');
    assert.equal(focusedNoteState.windowScrollY, 0, 'Focusing the note must not scroll the page behind the Order Bag');
    assert.equal(focusedNoteState.bodyTop, `${-backgroundScrollBeforeBag}px`, 'The page lock must preserve its original scroll position');
    const focusedBody = page.locator('.bag-modal-body');
    const initialFocusedBodyScrollTop = focusedNoteState.bodyScrollTop;
    for (const [height, offsetTop] of [[340, 34], [365, 18], [320, 42]]) {
      await page.evaluate(({ height, offsetTop }) => {
        const viewport = window.visualViewport;
        Object.defineProperty(viewport, 'height', { configurable: true, value: height });
        Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: offsetTop });
        viewport.dispatchEvent(new Event('resize'));
        viewport.dispatchEvent(new Event('scroll'));
      }, { height, offsetTop });
      const viewportState = await page.evaluate(() => {
        const sheet = document.querySelector('dialog.bag-modal').getBoundingClientRect();
        const body = document.querySelector('.bag-modal-body').getBoundingClientRect();
        const field = document.querySelector('#order-note').getBoundingClientRect();
        const { offsetTop, height } = window.visualViewport;
        return {
          focused: document.activeElement?.id === 'order-note',
          sheetTop: sheet.top,
          sheetBottom: sheet.bottom,
          viewportTop: offsetTop,
          viewportBottom: offsetTop + height,
          fieldVisibleAboveAccessory: field.top >= Math.max(body.top, offsetTop) && field.bottom <= Math.min(body.bottom, offsetTop + height) - 52,
        };
      });
      assert.equal(viewportState.focused, true, 'Changing keyboard height must not blur the Step 2 note');
      assert.ok(Math.abs(viewportState.sheetTop - viewportState.viewportTop) <= 1, 'Viewport offset changes must not clip the sheet header');
      assert.ok(Math.abs(viewportState.sheetBottom - viewportState.viewportBottom) <= 1, 'Keyboard height changes must resize the Order Bag sheet');
      assert.equal(viewportState.fieldVisibleAboveAccessory, true, 'Keyboard height changes must keep the note above the AutoFill bar');
      assert.equal(await focusedBody.evaluate(el => el.scrollTop), initialFocusedBodyScrollTop, 'Viewport resize must not reset the focused form scroll position');
    }
    const headerTopBeforeInnerScroll = await page.locator('.bag-modal-header').evaluate(el => el.getBoundingClientRect().top);
    const summaryHeader = page.locator('.checkout-summary-header');
    await summaryHeader.scrollIntoViewIfNeeded();
    assert.ok(await summaryHeader.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const { offsetTop, height } = window.visualViewport;
      return rect.bottom > offsetTop && rect.top < offsetTop + height;
    }), 'The Order Summary must remain reachable within the keyboard viewport');
    assert.equal(await page.locator('.bag-modal-header').evaluate(el => el.getBoundingClientRect().top), headerTopBeforeInnerScroll, 'Scrolling checkout details must not move the sheet header');
    await focusedBody.evaluate(el => { el.scrollTop = el.scrollHeight; });
    const keyboardSendButton = page.getByRole('button', { name: 'Send order via Messenger', exact: true });
    assert.ok(await keyboardSendButton.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const { offsetTop, height } = window.visualViewport;
      return rect.top >= offsetTop && rect.bottom <= offsetTop + height - 52;
    }), 'The Send button must remain reachable above the AutoFill bar and keyboard');
    assert.equal(await page.locator('.bag-modal-header').evaluate(el => el.getBoundingClientRect().top), headerTopBeforeInnerScroll, 'The fixed header must stay visible when scrolling to Send');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'order-note', 'Scrolling to checkout content must not blur the note field');
    for (const device of [
      { width: 320, height: 568, keyboardHeight: 260, offsetTop: 12 },
      { width: 375, height: 667, keyboardHeight: 356, offsetTop: 18 },
      { width: 390, height: 844, keyboardHeight: 420, offsetTop: 24 },
      { width: 402, height: 874, keyboardHeight: 430, offsetTop: 18 },
      { width: 430, height: 932, keyboardHeight: 500, offsetTop: 20 },
      { width: 440, height: 956, keyboardHeight: 510, offsetTop: 20 },
      { width: 667, height: 375, keyboardHeight: 160, offsetTop: 8 },
      { width: 852, height: 393, keyboardHeight: 170, offsetTop: 8 },
    ]) {
      await note.blur();
      await page.evaluate(() => {
        const viewport = window.visualViewport;
        delete viewport.height;
        delete viewport.offsetTop;
        viewport.dispatchEvent(new Event('resize'));
      });
      await page.setViewportSize({ width: device.width, height: device.height });
      await note.focus();
      await page.evaluate(({ keyboardHeight, offsetTop }) => {
        const viewport = window.visualViewport;
        Object.defineProperty(viewport, 'height', { configurable: true, value: keyboardHeight });
        Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: offsetTop });
        viewport.dispatchEvent(new Event('resize'));
        viewport.dispatchEvent(new Event('scroll'));
      }, device);
      await page.waitForTimeout(350);
      const deviceNoteState = await page.evaluate(() => {
        const dialog = document.querySelector('dialog.bag-modal');
        const sheet = dialog.getBoundingClientRect();
        const body = document.querySelector('.bag-modal-body').getBoundingClientRect();
        const field = document.querySelector('#order-note').getBoundingClientRect();
        const { offsetTop, height } = window.visualViewport;
        return {
          touchSheet: dialog.classList.contains('is-touch-form-modal'),
          focused: document.activeElement?.id === 'order-note',
          sheetTop: sheet.top,
          sheetBottom: sheet.bottom,
          viewportTop: offsetTop,
          viewportBottom: offsetTop + height,
          fieldVisible: field.top >= Math.max(body.top, offsetTop) && field.bottom <= Math.min(body.bottom, offsetTop + height) - 52,
          bodyRect: { top: body.top, bottom: body.bottom },
          fieldRect: { top: field.top, bottom: field.bottom },
          bodyScroll: document.querySelector('.bag-modal-body').scrollTop,
          bodyClientHeight: document.querySelector('.bag-modal-body').clientHeight,
          bodyScrollHeight: document.querySelector('.bag-modal-body').scrollHeight,
        };
      });
      assert.equal(deviceNoteState.touchSheet, true, `iPhone viewport ${device.width}x${device.height} must use touch-safe Order Bag layout`);
      assert.equal(deviceNoteState.focused, true, `iPhone viewport ${device.width}x${device.height} must preserve note focus`);
      assert.ok(Math.abs(deviceNoteState.sheetTop - deviceNoteState.viewportTop) <= 1, `iPhone viewport ${device.width}x${device.height} must align the sheet with visualViewport.offsetTop`);
      assert.ok(Math.abs(deviceNoteState.sheetBottom - deviceNoteState.viewportBottom) <= 1, `iPhone viewport ${device.width}x${device.height} must fit the sheet to visualViewport.height`);
      assert.equal(deviceNoteState.fieldVisible, true, `iPhone viewport ${device.width}x${device.height} must keep the note above the keyboard accessory bar: ${JSON.stringify(deviceNoteState)}`);
      await page.locator('.bag-modal-body').evaluate(el => { el.scrollTop = el.scrollHeight; });
      const sendVisible = await page.getByRole('button', { name: 'Send order via Messenger', exact: true }).evaluate(el => {
        const rect = el.getBoundingClientRect();
        const { offsetTop, height } = window.visualViewport;
        return rect.top >= offsetTop && rect.bottom <= offsetTop + height - 52;
      });
      assert.equal(sendVisible, true, `iPhone viewport ${device.width}x${device.height} must keep Send reachable above the keyboard accessory`);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'order-note', `Scrolling the Order Bag at ${device.width}x${device.height} must not blur the note`);
    }
    await page.evaluate(() => {
      const viewport = window.visualViewport;
      delete viewport.height;
      delete viewport.offsetTop;
      viewport.dispatchEvent(new Event('resize'));
    });
    await page.setViewportSize({ width: 390, height: 844 });
    for (const selector of ['#order-name', '#order-phone', '#checkout-custom-time', '#order-note']) {
      const field = page.locator(selector);
      await field.focus();
      await page.evaluate(() => {
        const viewport = window.visualViewport;
        Object.defineProperty(viewport, 'height', { configurable: true, value: 420 });
        Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 24 });
        viewport.dispatchEvent(new Event('resize'));
        viewport.dispatchEvent(new Event('scroll'));
      });
      await page.waitForTimeout(350);
      const state = await page.evaluate(selector => {
        const sheet = document.querySelector('dialog.bag-modal').getBoundingClientRect();
        const body = document.querySelector('.bag-modal-body').getBoundingClientRect();
        const field = document.querySelector(selector).getBoundingClientRect();
        const { offsetTop, height } = window.visualViewport;
        return {
          focused: document.activeElement === document.querySelector(selector),
          bodyScrollTop: document.querySelector('.bag-modal-body').scrollTop,
          fieldVisible: field.top >= Math.max(body.top, offsetTop) && field.bottom <= Math.min(body.bottom, offsetTop + height) - 52,
          sheetTop: sheet.top,
          sheetBottom: sheet.bottom,
          viewportTop: offsetTop,
          viewportBottom: offsetTop + height,
        };
      }, selector);
      assert.equal(state.focused, true, `${selector} must retain focus after the keyboard opens`);
      assert.equal(state.fieldVisible, true, `${selector} must stay visible above the keyboard accessory`);
      assert.ok(Math.abs(state.sheetTop - state.viewportTop) <= 1, `${selector} focus must align the sheet to visualViewport.offsetTop`);
      assert.ok(Math.abs(state.sheetBottom - state.viewportBottom) <= 1, `${selector} focus must size the sheet to visualViewport.height`);
      await page.evaluate(() => {
        const viewport = window.visualViewport;
        Object.defineProperty(viewport, 'height', { configurable: true, value: 380 });
        Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 12 });
        viewport.dispatchEvent(new Event('resize'));
        viewport.dispatchEvent(new Event('scroll'));
      });
      assert.equal(await page.evaluate(() => document.activeElement?.id), selector.slice(1), `${selector} must not blur when keyboard height changes`);
      assert.equal(await page.locator('.bag-modal-body').evaluate(el => el.scrollTop), state.bodyScrollTop, `${selector} scroll position must not reset on keyboard resize`);
      await field.blur();
      await page.evaluate(() => {
        const viewport = window.visualViewport;
        delete viewport.height;
        delete viewport.offsetTop;
        viewport.dispatchEvent(new Event('resize'));
      });
    }
    const bagScrollState = () => dialog.evaluate(el => {
      const content = el.querySelector('.bag-modal-body');
      return {
        dialogOverflow: getComputedStyle(el).overflowY,
        contentOverflow: getComputedStyle(content).overflowY,
        dialogCanScroll: el.scrollHeight > el.clientHeight,
        contentCanScroll: content.scrollHeight > content.clientHeight,
      };
    });
    await expect.poll(bagScrollState).toEqual({ dialogOverflow: 'hidden', contentOverflow: 'auto', dialogCanScroll: false, contentCanScroll: true });
    const upwardScroll = await focusedBody.evaluate(el => {
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
        await focusedBody.evaluate((el, end) => {
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
