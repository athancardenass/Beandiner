import assert from 'node:assert/strict';
import { chromium, webkit, expect, devices } from '@playwright/test';

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
    const homepagePage = await browser.newPage({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce',
    });
    await homepagePage.goto('http://127.0.0.1:5173/?page=beverages');
    const homepageCanvas = () => homepagePage.evaluate(() => ({
      root: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
    }));
    await expect.poll(homepageCanvas).toEqual({ root: white, body: white });
    await homepagePage.getByRole('button', { name: 'Customize Strawberry Milk', exact: true }).last().click();
    await homepagePage.getByRole('button', { name: 'Add to bag ₱160', exact: true }).click();
    await homepagePage.goto('http://127.0.0.1:5173/');
    await expect.poll(homepageCanvas).toEqual({ root: 'rgb(18, 18, 18)', body: 'rgb(18, 18, 18)' });
    await homepagePage.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
    await homepagePage.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
    const homepageKeyboardOpen = await homepagePage.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'height', { configurable: true, value: 360 });
      viewport.dispatchEvent(new Event('resize'));
      return document.querySelector('dialog.bag-modal').classList.contains('is-keyboard-open');
    });
    assert.equal(homepageKeyboardOpen, true, 'The homepage Order Bag must detect the keyboard');
    await expect.poll(homepageCanvas).toEqual({ root: white, body: white });
    const homepageKeyboardSurface = await homepagePage.evaluate(() => ({
      theme: document.querySelector('meta[name="theme-color"]').content,
      html: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      dialog: getComputedStyle(document.querySelector('dialog.bag-modal')).backgroundColor,
    }));
    assert.deepEqual(homepageKeyboardSurface, { theme: '#FFFFFF', html: white, body: white, dialog: white }, `The homepage Order Bag must match its white sheet surface beneath native Safari bars: ${JSON.stringify(homepageKeyboardSurface)}`);
    await homepagePage.evaluate(() => {
      delete window.visualViewport.height;
      window.visualViewport.dispatchEvent(new Event('resize'));
    });
    await expect.poll(homepageCanvas).toEqual({ root: 'rgb(18, 18, 18)', body: 'rgb(18, 18, 18)' });
    await homepagePage.keyboard.press('Escape');
    await homepagePage.close();

    const context = await browser.newContext(engine.name() === 'webkit'
      ? { ...devices['iPhone 14'], reducedMotion: 'reduce' }
      : { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
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
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).evaluate(button => button.click());
    await expect.poll(canvas).toEqual({ root: white, body: white, scheme: 'light', theme: '#FFFFFF' });
    await expect.poll(viewportBackground).toBe('');
    const bagScrollLock = await page.evaluate(() => ({
      scrollY: window.scrollY,
      bodyPosition: getComputedStyle(document.body).position,
      bodyTop: document.body.style.top,
      bodyOverflow: getComputedStyle(document.body).overflow,
      rootOverflow: getComputedStyle(document.documentElement).overflow,
      bodyOverscroll: getComputedStyle(document.body).getPropertyValue('overscroll-behavior'),
      rootOverscroll: getComputedStyle(document.documentElement).getPropertyValue('overscroll-behavior'),
      overscrollSupported: CSS.supports('overscroll-behavior', 'none'),
    }));
    assert.equal(bagScrollLock.scrollY, 0, `The Order Bag must keep window.scrollY at zero while preserving the body offset: ${JSON.stringify(bagScrollLock)}`);
    assert.equal(bagScrollLock.bodyPosition, 'fixed', 'The Order Bag must use a fixed body lock on iPhone Safari');
    assert.equal(bagScrollLock.bodyTop, `${-backgroundScrollBeforeBag}px`, 'The fixed body must preserve the original page position');
    assert.equal(bagScrollLock.bodyOverflow, 'hidden', 'The Order Bag must hide body overflow');
    assert.equal(bagScrollLock.rootOverflow, 'hidden', 'The Order Bag must hide root overflow');
    if (bagScrollLock.overscrollSupported) {
      assert.equal(bagScrollLock.bodyOverscroll, 'none', 'The Order Bag must stop body overscroll chaining');
      assert.equal(bagScrollLock.rootOverscroll, 'none', 'The Order Bag must stop root overscroll chaining');
    }
    assert.equal(await page.evaluate(() => Math.round(document.body.getBoundingClientRect().top)), -backgroundScrollBeforeBag, 'Opening the Order Bag must keep the menu visually anchored');
    const bagSurfaceColors = await page.evaluate(() => ({
      theme: document.querySelector('meta[name="theme-color"]').content,
      html: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      dialog: getComputedStyle(document.querySelector('dialog.bag-modal')).backgroundColor,
    }));
    assert.deepEqual(bagSurfaceColors, { theme: '#FFFFFF', html: white, body: white, dialog: white }, `Safari's native translucent bars must see a surface matching the page theme: ${JSON.stringify(bagSurfaceColors)}`);
    await expect.poll(bagBackdrop).toEqual({ background: 'rgba(18, 18, 18, 0.75)', image: 'none', filter: 'blur(5px)' });
    await expect.poll(pageContentVisibility).toBe('visible');
    await page.waitForTimeout(400);
    const bagModal = page.locator('dialog.bag-modal');
    const bagModalAnimation = await bagModal.evaluate(el => getComputedStyle(el).animationName);
    assert.equal(bagModalAnimation, 'modal-arrive', 'The Order Bag must finish its entry animation once when opened');
    const bagStepBounds = await bagModal.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    });
    const bagContent = page.locator('dialog.bag-modal .bag-content');
    await bagContent.evaluate(el => {
      const probe = document.createElement('div');
      probe.dataset.checkoutScrollProbe = 'true';
      probe.style.height = '1000px';
      el.append(probe);
      el.scrollTop = 200;
    });
    assert.ok(await bagContent.evaluate(el => el.scrollTop) > 0, 'The bag step must scroll before checking the Details transition');
    await page.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
    await expect(page.locator('.checkout-form-title')).toHaveText('Order Information');
    await expect.poll(() => bagContent.evaluate(el => el.scrollTop)).toBe(0);
    await bagContent.evaluate(el => el.querySelector('[data-checkout-scroll-probe]')?.remove());
    const detailsStepBounds = await bagModal.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    });
    assert.ok(Math.abs(detailsStepBounds.height - bagStepBounds.height) <= 1, `Opening Fill Out Form must keep the bag modal height: ${JSON.stringify({ bagStepBounds, detailsStepBounds })}`);
    assert.ok(Math.abs(detailsStepBounds.top - bagStepBounds.top) <= 1, `Opening Fill Out Form must not jump the bag modal: ${JSON.stringify({ bagStepBounds, detailsStepBounds })}`);
    await page.locator('.timing-choice-row label').nth(3).click();
    await page.locator('#checkout-custom-time').fill('18:00');
    await page.locator('.payment-choice-row label').nth(1).click();
    const orderTypeScrollBefore = await page.evaluate(() => {
      const content = document.querySelector('dialog.bag-modal .bag-content');
      const row = document.querySelector('.order-type-row');
      const contentRect = content.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      content.scrollTop = Math.max(0, content.scrollTop + rowRect.top - contentRect.top - 100);
      return content.scrollTop;
    });
    const dialog = page.getByRole('dialog', { name: 'Your order bag', exact: true });
    const initialBagViewportHeight = await page.evaluate(() => window.visualViewport.height);
    const initialLayoutViewportHeight = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
      document.body.append(probe);
      const height = Math.max(window.innerHeight, document.documentElement.clientHeight, probe.getBoundingClientRect().height);
      probe.remove();
      return height;
    });
    const simulatedKeyboard = await page.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'height', { configurable: true, value: 360 });
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 0 });
      viewport.dispatchEvent(new Event('resize'));
      const bag = document.querySelector('dialog.bag-modal');
      const rect = bag.getBoundingClientRect();
      const contentRect = bag.querySelector('.bag-content').getBoundingClientRect();
      return {
        keyboardOpen: bag.classList.contains('is-keyboard-open'),
        fullLayout: bag.classList.contains('is-ios-full-layout'),
        animationName: getComputedStyle(bag).animationName,
        sheetHeight: Number.parseFloat(bag.style.getPropertyValue('--modal-sheet-height')),
        layoutHeight: Number.parseFloat(bag.style.getPropertyValue('--modal-layout-height')),
        cssViewportHeight: bag.style.getPropertyValue('--modal-viewport-height'),
        cssKeyboardOverlap: bag.style.getPropertyValue('--modal-keyboard-overlap'),
        dialogHeight: rect.height,
        contentHeight: contentRect.height,
        contentClientHeight: bag.querySelector('.bag-content').clientHeight,
        contentScrollHeight: bag.querySelector('.bag-content').scrollHeight,
        contentCSSHeight: getComputedStyle(bag.querySelector('.bag-content')).height,
        contentCSSMaxHeight: getComputedStyle(bag.querySelector('.bag-content')).maxHeight,
        contentCSSPaddingBottom: getComputedStyle(bag.querySelector('.bag-content')).paddingBottom,
        contentPaddingBottom: Number.parseFloat(getComputedStyle(bag.querySelector('.bag-content')).paddingBottom),
        contentOverflowY: getComputedStyle(bag.querySelector('.bag-content')).overflowY,
        innerHeight: window.innerHeight,
        viewportHeight: viewport.height,
      };
    });
    assert.equal(simulatedKeyboard.keyboardOpen, true, 'Order Bag must detect the reduced iPhone visual viewport');
    assert.equal(simulatedKeyboard.animationName, bagModalAnimation, 'Opening the keyboard must not restart or replace the Order Bag entry animation');
    if (simulatedKeyboard.fullLayout) {
      assert.ok(Math.abs(simulatedKeyboard.layoutHeight - initialLayoutViewportHeight) <= 1, `Order Bag must preserve the pre-keyboard layout viewport height: ${JSON.stringify(simulatedKeyboard)}`);
      assert.ok(Math.abs(simulatedKeyboard.sheetHeight - simulatedKeyboard.layoutHeight) <= 1, `Order Bag's sheet must extend through the layout viewport behind native bars: ${JSON.stringify(simulatedKeyboard)}`);
      assert.ok(Math.abs(simulatedKeyboard.dialogHeight - simulatedKeyboard.layoutHeight) <= 1, `The dialog must fill the layout viewport while the keyboard is open: ${JSON.stringify(simulatedKeyboard)}`);
      assert.ok(Math.abs(simulatedKeyboard.contentHeight - simulatedKeyboard.layoutHeight) <= 1, `The bag scroller must continue through the layout viewport behind native bars: ${JSON.stringify(simulatedKeyboard)}`);
      assert.ok(simulatedKeyboard.contentPaddingBottom >= Number.parseFloat(simulatedKeyboard.cssKeyboardOverlap) - 1, `The scroller's padding must cover keyboard overlap so final fields can scroll above it: ${JSON.stringify(simulatedKeyboard)}`);
    } else {
      assert.ok(Math.abs(simulatedKeyboard.sheetHeight - simulatedKeyboard.viewportHeight) <= 1, `Non-iOS Order Bag retains its visible-viewport sheet height: ${JSON.stringify(simulatedKeyboard)}`);
      assert.ok(Math.abs(simulatedKeyboard.dialogHeight - simulatedKeyboard.viewportHeight) <= 1, `Non-iOS dialog remains within the reduced viewport: ${JSON.stringify(simulatedKeyboard)}`);
      assert.ok(Math.abs(simulatedKeyboard.contentHeight - simulatedKeyboard.viewportHeight) <= 1, `Non-iOS scroller remains within the reduced viewport: ${JSON.stringify(simulatedKeyboard)}`);
    }
    assert.equal(simulatedKeyboard.contentOverflowY, 'auto', 'The bag content, not the outer sheet, must own scrolling while the keyboard is open');
    const secondTapViewport = await page.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 32 });
      viewport.dispatchEvent(new Event('scroll'));
      const bag = document.querySelector('dialog.bag-modal');
      return {
        sheetHeight: Number.parseFloat(bag.style.getPropertyValue('--modal-sheet-height')),
        fullLayout: bag.classList.contains('is-ios-full-layout'),
        layoutHeight: Number.parseFloat(bag.style.getPropertyValue('--modal-layout-height')),
        cssTop: bag.style.getPropertyValue('--modal-viewport-top'),
        dialogTop: bag.getBoundingClientRect().top,
        dialogHeight: bag.getBoundingClientRect().height,
        contentHeight: bag.querySelector('.bag-content').getBoundingClientRect().height,
        viewportHeight: viewport.height,
        viewportTop: viewport.offsetTop,
        scrollY: window.scrollY,
      };
    });
    const secondTapExpectedHeight = secondTapViewport.fullLayout ? initialLayoutViewportHeight : secondTapViewport.viewportHeight;
    assert.ok(Math.abs(secondTapViewport.sheetHeight - secondTapExpectedHeight) <= 1, `A second field tap must keep sheet height equal to its expected viewport: ${JSON.stringify(secondTapViewport)}`);
    assert.equal(secondTapViewport.cssTop, '32px', `A second field tap must keep the sheet aligned to visualViewport.offsetTop: ${JSON.stringify(secondTapViewport)}`);
    assert.ok(Math.abs(secondTapViewport.dialogTop - (secondTapViewport.fullLayout ? 0 : secondTapViewport.viewportTop)) <= 1, `A second field tap must keep the sheet anchored at its viewport top: ${JSON.stringify(secondTapViewport)}`);
    assert.ok(Math.abs(secondTapViewport.dialogHeight - secondTapExpectedHeight) <= 1, `A second field tap must keep the dialog at its expected viewport height: ${JSON.stringify(secondTapViewport)}`);
    assert.equal(secondTapViewport.scrollY, 0, `A second field tap must not pan the page behind the locked sheet: ${JSON.stringify(secondTapViewport)}`);
    assert.ok(Math.abs(secondTapViewport.contentHeight - secondTapExpectedHeight) <= 1, `A second field tap must keep the inner scroller at the expected height: ${JSON.stringify(secondTapViewport)}`);
    const counteractedPagePan = await page.evaluate(async () => {
      const nativeScrollTo = window.scrollTo.bind(window);
      const scrollYDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollY');
      let simulatedScrollY = 120;
      Object.defineProperty(window, 'scrollY', { configurable: true, get: () => simulatedScrollY });
      window.scrollTo = (_x, y) => {
        simulatedScrollY = Number(y);
        nativeScrollTo(0, Number(y));
      };
      window.dispatchEvent(new Event('scroll'));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const result = simulatedScrollY;
      window.scrollTo = nativeScrollTo;
      if (scrollYDescriptor) Object.defineProperty(window, 'scrollY', scrollYDescriptor);
      else delete window.scrollY;
      return result;
    });
    assert.equal(counteractedPagePan, 0, 'The Order Bag must counteract Safari page panning after a window scroll event');
    await page.evaluate(() => {
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 0 });
      viewport.dispatchEvent(new Event('scroll'));
    });
    const orderTypeBodyTop = await page.evaluate(() => document.body.style.top);
    const orderNote = page.locator('#order-note');
    assert.equal(await orderNote.evaluate(el => el.tagName), 'TEXTAREA', 'Order Note must use a textarea to test whether iOS drops its contact autofill accessory');
    assert.equal(await orderNote.getAttribute('name'), 'order-note', 'Order Note must have a stable form name');
    assert.equal(await orderNote.getAttribute('autocomplete'), 'off', 'Order Note must disable autofill');
    assert.equal(await orderNote.getAttribute('inputmode'), 'text', 'Order Note must request the text keyboard');
    for (const [index, fieldSelector] of [[1, '#checkout-table'], [2, '#checkout-address'], [0, null]]) {
      const orderTypeLabel = page.locator('.order-type-row label').nth(index);
      await orderTypeLabel.locator('input').evaluate(input => {
        input.addEventListener('focus', () => {
          input.closest('.bag-content').scrollTop = 0;
        }, { once: true });
      });
      await orderTypeLabel.click();
      await expect(page.locator('dialog.bag-modal h2')).toHaveText('Checkout Details');
      assert.equal(await page.locator('.timing-choice-row input:checked').evaluate(el => el.closest('label').innerText.trim()), 'Custom time', 'Changing order type must keep the selected preferred timing');
      assert.equal(await page.locator('.payment-choice-row input:checked').getAttribute('value'), 'maya', 'Changing order type must keep the selected payment method');
      const orderTypeScrollAfter = await page.locator('dialog.bag-modal .bag-content').evaluate(el => el.scrollTop);
      assert.ok(Math.abs(orderTypeScrollAfter - orderTypeScrollBefore) <= 1, `Changing order type must keep the form at its current position: ${JSON.stringify({ orderTypeScrollBefore, orderTypeScrollAfter, index })}`);
      const state = await page.evaluate(() => {
        const bag = document.querySelector('dialog.bag-modal');
        const rect = bag.querySelector('.bag-content').getBoundingClientRect();
        const dialogRect = bag.getBoundingClientRect();
        const { offsetTop, height } = window.visualViewport;
        return {
          keyboardOpen: bag.classList.contains('is-keyboard-open'),
          fullLayout: bag.classList.contains('is-ios-full-layout'),
          bagVisible: bag.classList.contains('is-ios-full-layout')
            ? dialogRect.top === 0 && Math.abs(dialogRect.height - Number.parseFloat(bag.style.getPropertyValue('--modal-layout-height'))) <= 1
            : rect.top >= offsetTop && rect.bottom <= offsetTop + height,
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
    const bagContentForScroll = page.locator('dialog.bag-modal .bag-content');
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
    await page.locator('.timing-choice-row label').filter({ hasText: 'Custom time' }).click();
    await expect(page.getByRole('radio', { name: 'Custom time', exact: true })).toBeChecked();
    assert.equal(await page.locator('#checkout-custom-time').getAttribute('type'), 'time', 'Custom pickup time must use the native time picker instead of a text keyboard');
    assert.equal(await page.locator('#checkout-custom-time').getAttribute('min'), '10:00');
    assert.equal(await page.locator('#checkout-custom-time').getAttribute('max'), '20:59');
    await assertFieldDoesNotZoomOrResize(page.locator('#checkout-custom-time'), 'Custom pickup time');
    for (const selector of ['#order-name', '#order-phone', '#checkout-custom-time', '#order-note']) {
      assert.equal(await page.locator(selector).getAttribute('autocomplete'), 'off', `${selector} should opt out of browser autocomplete`);
    }
    const note = page.locator('#order-note');
    const initialWindowInnerHeight = await page.evaluate(() => window.innerHeight);
    await page.evaluate(() => {
      Object.defineProperty(window, '__bagCheckOriginalInnerHeight', {
        configurable: true,
        value: Object.getOwnPropertyDescriptor(window, 'innerHeight'),
      });
    });
    const bagViewportState = () => page.evaluate(() => {
      const modal = document.querySelector('dialog.bag-modal');
      const content = modal.querySelector('.bag-content');
      const rect = modal.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const { offsetTop, height } = window.visualViewport;
      return {
        height: rect.height,
        top: rect.top,
        bottom: rect.bottom,
        keyboardOpen: modal.classList.contains('is-keyboard-open'),
        fullLayout: modal.classList.contains('is-ios-full-layout'),
        layoutHeight: Number.parseFloat(modal.style.getPropertyValue('--modal-layout-height')),
        cssHeight: modal.style.getPropertyValue('--modal-viewport-height'),
        cssTop: modal.style.getPropertyValue('--modal-viewport-top'),
        cssSheetHeight: modal.style.getPropertyValue('--modal-sheet-height'),
        cssBottomInset: modal.style.getPropertyValue('--modal-viewport-bottom-inset'),
        contentHeight: contentRect.height,
        viewportTop: offsetTop,
        viewportBottom: offsetTop + height,
      };
    });
    const setBagVisualViewport = (height, offsetTop, eventName, layoutHeight = initialWindowInnerHeight) => page.evaluate(({ height, offsetTop, eventName, layoutHeight }) => {
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: layoutHeight });
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'height', { configurable: true, value: height });
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: offsetTop });
      viewport.dispatchEvent(new Event(eventName));
    }, { height, offsetTop, eventName, layoutHeight });
    for (const selector of ['#order-name', '#order-phone', '#order-note']) {
      const field = page.locator(selector);
      await field.scrollIntoViewIfNeeded();
      await field.focus();
      await setBagVisualViewport(360, 0, 'resize', 360);
      const keyboardOpen = await bagViewportState();
      assert.equal(keyboardOpen.keyboardOpen, true, `${selector} must detect the keyboard when innerHeight shrinks with the visual viewport: ${JSON.stringify(keyboardOpen)}`);
      assert.equal(keyboardOpen.cssHeight, '360px', `${selector} must size the bag from visualViewport.height: ${JSON.stringify(keyboardOpen)}`);
      await setBagVisualViewport(360, 32, 'scroll', 360);
      const afterViewportScroll = await bagViewportState();
      const expectedSheetHeight = afterViewportScroll.fullLayout ? initialLayoutViewportHeight : 360;
      assert.ok(Math.abs(afterViewportScroll.height - expectedSheetHeight) <= 1, `${selector} focus must keep the expected sheet height after visualViewport scroll: ${JSON.stringify(afterViewportScroll)}`);
      assert.ok(Math.abs(afterViewportScroll.top - (afterViewportScroll.fullLayout ? 0 : 32)) <= 1, `${selector} focus must keep the sheet anchored to its viewport: ${JSON.stringify(afterViewportScroll)}`);
      assert.equal(afterViewportScroll.cssTop, '32px', `${selector} must position the bag from visualViewport.offsetTop: ${JSON.stringify(afterViewportScroll)}`);
      assert.ok(Math.abs(afterViewportScroll.contentHeight - expectedSheetHeight) <= 1, `${selector} must keep the inner scroller at the expected sheet height: ${JSON.stringify(afterViewportScroll)}`);
      assert.equal(afterViewportScroll.cssBottomInset, '', `${selector} must not use a bottom inset to position the bag: ${JSON.stringify(afterViewportScroll)}`);

      await page.waitForTimeout(120);
      await setBagVisualViewport(326, 32, 'resize', 360);
      await page.waitForTimeout(120);
      const afterFirstAutofillBarStep = await bagViewportState();
      assert.ok(Math.abs(afterFirstAutofillBarStep.contentHeight - (afterFirstAutofillBarStep.fullLayout ? initialLayoutViewportHeight : 326)) <= 1, `${selector} first AutoFill-bar height change must preserve the expected scroll area: ${JSON.stringify(afterFirstAutofillBarStep)}`);
      await setBagVisualViewport(300, 32, 'resize', 360);
      await page.waitForTimeout(120);
      const afterAutofillBar = await bagViewportState();
      const resizedSheetHeight = afterAutofillBar.fullLayout ? initialLayoutViewportHeight : 300;
      assert.ok(Math.abs(afterAutofillBar.contentHeight - resizedSheetHeight) <= 1, `${selector} AutoFill-bar resize must preserve the expected scroll area: ${JSON.stringify(afterAutofillBar)}`);
      assert.ok(Math.abs(afterAutofillBar.height - resizedSheetHeight) <= 1, `${selector} AutoFill-bar resize must preserve the expected sheet height: ${JSON.stringify(afterAutofillBar)}`);

      await setBagVisualViewport(360, 0, 'scroll', 360);
      const restoredKeyboard = await bagViewportState();
      assert.ok(Math.abs(restoredKeyboard.height - expectedSheetHeight) <= 1, `${selector} must recover the expected keyboard sheet height: ${JSON.stringify(restoredKeyboard)}`);
      await field.blur();
    }
    const secondFieldTapScroll = await page.evaluate(() => {
      const bag = document.querySelector('dialog.bag-modal');
      const content = bag.querySelector('.bag-content');
      const field = document.querySelector('#order-phone');
      const viewport = window.visualViewport;
      Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 320 });
      viewport.dispatchEvent(new Event('scroll'));
      Object.defineProperty(bag, 'getBoundingClientRect', {
        configurable: true,
        value: () => new DOMRect(0, 0, 390, 360),
      });
      Object.defineProperty(content, 'getBoundingClientRect', {
        configurable: true,
        value: () => new DOMRect(0, 0, 390, 360),
      });
      Object.defineProperty(field, 'getBoundingClientRect', {
        configurable: true,
        value: () => new DOMRect(20, 200, 300, 50),
      });
      content.scrollTop = 200;
      field.focus({ preventScroll: true });
      return content.scrollTop;
    });
    await page.waitForTimeout(50);
    const secondFieldTapScrollAfterReveal = await page.locator('dialog.bag-modal .bag-content').evaluate(el => el.scrollTop);
    assert.equal(
      secondFieldTapScrollAfterReveal,
      secondFieldTapScroll,
      `Tapping a second field inside Safari's scrolled visual viewport must not scroll the bag twice: ${JSON.stringify({ secondFieldTapScroll, secondFieldTapScrollAfterReveal })}`,
    );
    await setBagVisualViewport(initialWindowInnerHeight, 32, 'resize', initialWindowInnerHeight);
    const secondFieldKeyboardHandoff = await bagViewportState();
    assert.equal(
      secondFieldKeyboardHandoff.keyboardOpen,
      true,
      `A brief full-height visualViewport report between focused fields must not close the bag keyboard state: ${JSON.stringify(secondFieldKeyboardHandoff)}`,
    );
    await setBagVisualViewport(360, 32, 'resize', initialWindowInnerHeight);
    assert.equal((await bagViewportState()).keyboardOpen, true, 'The bag must keep its keyboard state when the next field restores the reduced viewport');
    await page.locator('#order-name').focus();
    await setBagVisualViewport(initialWindowInnerHeight, 32, 'resize', initialWindowInnerHeight);
    await page.waitForTimeout(200);
    await page.locator('#order-phone').focus();
    await page.waitForTimeout(150);
    assert.equal((await bagViewportState()).keyboardOpen, true, 'A second field tap must restart the keyboard-close grace period');
    await setBagVisualViewport(360, 32, 'resize', initialWindowInnerHeight);
    assert.equal((await bagViewportState()).keyboardOpen, true, 'The second field tap must retain keyboard state when the reduced viewport returns');
    await page.locator('#order-name').focus();
    await setBagVisualViewport(initialWindowInnerHeight, 32, 'resize', initialWindowInnerHeight);
    await page.locator('#order-name').evaluate(field => field.blur());
    await page.evaluate(() => window.visualViewport.dispatchEvent(new Event('scroll')));
    await page.waitForTimeout(50);
    assert.equal((await bagViewportState()).keyboardOpen, true, 'A brief focus gap between fields must not immediately collapse the bag');
    await page.locator('#order-phone').focus();
    await page.waitForTimeout(150);
    assert.equal((await bagViewportState()).keyboardOpen, true, 'Focusing the next field must preserve the bag through a focus gap');
    await setBagVisualViewport(360, 32, 'resize', initialWindowInnerHeight);
    assert.equal((await bagViewportState()).keyboardOpen, true, 'The reduced viewport after a focus gap must retain the keyboard layout');
    await setBagVisualViewport(initialWindowInnerHeight, 32, 'resize', initialWindowInnerHeight);
    await page.waitForTimeout(350);
    const settledKeyboardClose = await bagViewportState();
    assert.equal(settledKeyboardClose.keyboardOpen, false, 'The bag must clear its keyboard state after the full viewport remains settled');
    assert.equal(settledKeyboardClose.cssHeight, '', 'A settled keyboard close must clear the bag viewport height');
    assert.equal(await bagModal.evaluate(el => getComputedStyle(el).animationName), bagModalAnimation, 'Closing the keyboard must not restart the Order Bag entry animation');
    await setBagVisualViewport(360, 32, 'resize', initialWindowInnerHeight);
    assert.equal((await bagViewportState()).keyboardOpen, true, 'The bag must reopen its keyboard state after focusing the next field');
    await page.evaluate(() => {
      const bag = document.querySelector('dialog.bag-modal');
      delete bag.getBoundingClientRect;
      delete bag.querySelector('.bag-content').getBoundingClientRect;
      delete document.querySelector('#order-phone').getBoundingClientRect;
      document.querySelector('#order-phone').blur();
    });
    await page.evaluate(() => {
      const viewport = window.visualViewport;
      delete viewport.height;
      delete viewport.offsetTop;
      Object.defineProperty(window, 'innerHeight', window.__bagCheckOriginalInnerHeight);
      delete window.__bagCheckOriginalInnerHeight;
      viewport.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(350);
    const closedBagViewport = await bagViewportState();
    assert.equal(closedBagViewport.keyboardOpen, false, 'The bag must clear keyboard state when the visual viewport returns to its full height');
    assert.equal(closedBagViewport.cssHeight, '', 'The bag must clear its viewport height when the keyboard closes');
    assert.equal(closedBagViewport.cssTop, '', 'The bag must clear its viewport top when the keyboard closes');
    assert.equal(closedBagViewport.cssSheetHeight, '', 'The bag must clear its full-sheet height when the keyboard closes');
    assert.ok(Number.isNaN(closedBagViewport.layoutHeight), 'The bag must clear its layout viewport height when the keyboard closes');
    await page.setViewportSize({ width: 390, height: 360 });
    await note.scrollIntoViewIfNeeded();
    await note.focus();
    await expect.poll(() => dialog.locator('.bag-content').evaluate(el => {
      const rect = el.getBoundingClientRect();
      const fullLayout = el.closest('dialog').classList.contains('is-ios-full-layout');
      const expectedHeight = Number.parseFloat(el.closest('dialog').style.getPropertyValue('--modal-layout-height'));
      return fullLayout ? rect.top === 0 && Math.abs(rect.height - expectedHeight) <= 1 : rect.top >= 0 && rect.bottom <= innerHeight;
    })).toBe(true);
    await expect.poll(() => note.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const viewport = window.visualViewport;
      return rect.top >= viewport.offsetTop && rect.bottom <= viewport.offsetTop + viewport.height;
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
    await expect.poll(bagScrollState).toEqual({ dialogOverflow: 'hidden', contentOverflow: 'auto', dialogCanScroll: false, contentCanScroll: true });
    const upwardScroll = await dialog.evaluate(el => {
      const content = el.querySelector('.bag-content');
      content.scrollTop = content.scrollHeight;
      const bottom = content.scrollTop;
      content.scrollTop = Math.max(0, bottom - 120);
      return { bottom, after: content.scrollTop };
    });
    assert.ok(upwardScroll.bottom > 0 && upwardScroll.after < upwardScroll.bottom, 'Order Bag content must scroll upward while an input has focus');
    const submit = page.getByRole('button', { name: 'Send order via Messenger', exact: true });
    await submit.scrollIntoViewIfNeeded();
    const submitScrollState = await submit.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const content = el.closest('.bag-content');
      const viewport = content.getBoundingClientRect();
      return {
        fieldTop: rect.top,
        fieldBottom: rect.bottom,
        viewportTop: viewport.top,
        viewportBottom: viewport.bottom,
        scrollTop: content.scrollTop,
        scrollHeight: content.scrollHeight,
        clientHeight: content.clientHeight,
      };
    });
    assert.ok(
      submitScrollState.fieldTop >= submitScrollState.viewportTop - 1 && submitScrollState.fieldBottom <= submitScrollState.viewportBottom + 1,
      `Order submission must scroll into the bag's inner viewport: ${JSON.stringify(submitScrollState)}`,
    );
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
          const viewport = el.closest('.bag-content').getBoundingClientRect();
          return rect.top >= viewport.top && rect.bottom <= viewport.bottom;
        })).toBe(true);
      }
    }
    for (const height of [844, 460, 660, 900]) {
      await page.setViewportSize({ width: 390, height });
      await page.locator('#order-name').focus();
      for (const end of ['bottom', 'top']) {
        await dialog.evaluate((el, end) => {
          const content = el.querySelector('.bag-content');
          content.scrollTop = end === 'bottom' ? content.scrollHeight : 0;
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

    await page.goto('http://127.0.0.1:5173/?safari-glass-test=6');
    assert.equal(await page.locator('html').getAttribute('data-safari-glass-test'), '6', 'The glass test URL must activate its temporary layout rule');
    assert.equal(await page.locator('pre[aria-hidden="true"]').count(), 0, 'Temporary debug telemetry must be removed');
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
    await page.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
    const fullLayoutSafari = await page.evaluate(() => document.documentElement.dataset.browserFamily === 'safari' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window));
    if (engine.name() === 'webkit') assert.equal(fullLayoutSafari, true, 'The iPhone WebKit context must exercise the iOS Safari full-layout sheet path');
    const glassViewportHeight = await page.evaluate(() => window.visualViewport.height);
    await page.evaluate(({ layoutHeight }) => {
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: layoutHeight });
      Object.defineProperty(window.visualViewport, 'height', { configurable: true, value: 360 });
      Object.defineProperty(window.visualViewport, 'offsetTop', { configurable: true, value: 32 });
      window.visualViewport.dispatchEvent(new Event('resize'));
    }, { layoutHeight: glassViewportHeight });
    let glassFieldTap = 0;
    for (const [index, label] of [[0, 'For pick up'], [1, 'Dine in'], [2, 'Door to door']]) {
      if (index > 0) {
        await page.evaluate(() => {
          const viewport = window.visualViewport;
          Object.defineProperty(viewport, 'height', { configurable: true, value: 360 });
          Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 32 });
          viewport.dispatchEvent(new Event('scroll'));
          viewport.dispatchEvent(new Event('resize'));
        });
      }
      await page.locator('.order-type-row label').nth(index).click();
      if (index > 0) {
        await page.waitForTimeout(75);
        const modeSwitchState = await page.evaluate(() => {
          const modal = document.querySelector('dialog.bag-modal');
          const content = modal.querySelector('.bag-content');
          return {
            keyboardOpen: modal.classList.contains('is-keyboard-open'),
            fullLayout: modal.classList.contains('is-ios-full-layout'),
            sheetHeight: Number.parseFloat(modal.style.getPropertyValue('--modal-sheet-height')),
            dialogHeight: modal.getBoundingClientRect().height,
            contentHeight: content.getBoundingClientRect().height,
            viewportHeight: Number.parseFloat(modal.style.getPropertyValue('--modal-viewport-height')),
            viewportTop: window.visualViewport.offsetTop,
            scrollTop: content.scrollTop,
          };
        });
        assert.equal(modeSwitchState.keyboardOpen, true, `${label} selection must survive a focus handoff while the keyboard is open: ${JSON.stringify(modeSwitchState)}`);
        assert.ok(modeSwitchState.dialogHeight >= modeSwitchState.sheetHeight - 1, `${label} selection must keep the modal sheet expanded: ${JSON.stringify(modeSwitchState)}`);
        assert.ok(Math.abs(modeSwitchState.contentHeight - (modeSwitchState.fullLayout ? modeSwitchState.sheetHeight : modeSwitchState.viewportHeight)) <= 1, `${label} selection must keep the single inner scroller at the expected sheet height: ${JSON.stringify(modeSwitchState)}`);
        await page.evaluate(() => {
          const viewport = window.visualViewport;
          Object.defineProperty(viewport, 'height', { configurable: true, value: 360 });
          Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 32 });
          viewport.dispatchEvent(new Event('scroll'));
          viewport.dispatchEvent(new Event('resize'));
        });
        assert.equal(await page.locator('dialog.bag-modal').evaluate(el => el.classList.contains('is-keyboard-open')), true, `${label} selection must keep keyboard state when the reduced viewport returns`);
      }
      for (const fieldSelector of ['#order-name', '#order-phone', '#order-note']) {
        await page.locator(fieldSelector).evaluate((field, tapIndex) => {
          const viewport = window.visualViewport;
          if (tapIndex > 0) {
            Object.defineProperty(viewport, 'height', { configurable: true, value: window.innerHeight });
            Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 0 });
            viewport.dispatchEvent(new Event('resize'));
          }
          field.focus({ preventScroll: true });
          Object.defineProperty(viewport, 'height', { configurable: true, value: 360 });
          Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 32 });
          viewport.dispatchEvent(new Event('scroll'));
          viewport.dispatchEvent(new Event('resize'));
        }, glassFieldTap++);
        await page.waitForTimeout(350);
        const glassFieldState = await page.evaluate((selector) => {
          const modal = document.querySelector('dialog.bag-modal');
          const content = modal.querySelector('.bag-content');
          const field = document.querySelector(selector);
          const fieldRect = field.getBoundingClientRect();
          const dialogRect = modal.getBoundingClientRect();
          const viewport = window.visualViewport;
          return {
            keyboardOpen: modal.classList.contains('is-keyboard-open'),
            fullLayout: modal.classList.contains('is-ios-full-layout'),
            sheetHeight: Number.parseFloat(modal.style.getPropertyValue('--modal-sheet-height')),
            layoutHeight: Number.parseFloat(modal.style.getPropertyValue('--modal-layout-height')),
            dialogHeight: dialogRect.height,
            dialogTop: dialogRect.top,
            dialogBottom: dialogRect.bottom,
            viewportTop: viewport.offsetTop,
            viewportHeight: viewport.height,
            viewportBottom: viewport.offsetTop + viewport.height,
            scrollY: window.scrollY,
            contentTop: content.getBoundingClientRect().top,
            contentBottom: content.getBoundingClientRect().bottom,
            contentHeight: content.getBoundingClientRect().height,
            contentPaddingBottom: Number.parseFloat(getComputedStyle(content).paddingBottom),
            contentTailSpace: getComputedStyle(content, '::after').content === 'none' ? 0 : Number.parseFloat(getComputedStyle(content, '::after').height),
            keyboardOverlap: Number.parseFloat(modal.style.getPropertyValue('--modal-keyboard-overlap')),
            safeAreaBottom: (() => {
              const probe = document.createElement('div');
              probe.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
              modal.append(probe);
              const value = Number.parseFloat(getComputedStyle(probe).paddingBottom);
              probe.remove();
              return value;
            })(),
            scrollTop: content.scrollTop,
            fieldTop: fieldRect.top,
            fieldBottom: fieldRect.bottom,
            visibleTop: Math.max(viewport.offsetTop, dialogRect.top, content.getBoundingClientRect().top) + 16,
            visibleBottom: Math.min(viewport.offsetTop + viewport.height, dialogRect.bottom, content.getBoundingClientRect().bottom) - 12,
          };
        }, fieldSelector);
        assert.equal(glassFieldState.keyboardOpen, true, `${label} ${fieldSelector} must keep keyboard viewport state: ${JSON.stringify(glassFieldState)}`);
        const expectedGlassHeight = glassFieldState.fullLayout ? glassFieldState.layoutHeight : glassFieldState.viewportHeight;
        assert.ok(Math.abs(glassFieldState.dialogHeight - expectedGlassHeight) <= 1, `${label} ${fieldSelector} must use its expected full sheet height: ${JSON.stringify(glassFieldState)}`);
        assert.ok(Math.abs(glassFieldState.dialogTop - (glassFieldState.fullLayout ? 0 : glassFieldState.viewportTop)) <= 1, `${label} ${fieldSelector} must anchor the dialog to its expected viewport: ${JSON.stringify(glassFieldState)}`);
        assert.equal(glassFieldState.scrollY, 0, `${label} ${fieldSelector} must not pan the locked page: ${JSON.stringify(glassFieldState)}`);
        assert.ok(Math.abs(glassFieldState.contentHeight - expectedGlassHeight) <= 1, `${label} ${fieldSelector} must keep the inner scroller at the expected sheet height: ${JSON.stringify(glassFieldState)}`);
        assert.ok(Math.abs(glassFieldState.contentBottom - (glassFieldState.fullLayout ? expectedGlassHeight : glassFieldState.viewportBottom)) <= 1, `${label} ${fieldSelector} must keep the scroller at its expected bottom: ${JSON.stringify(glassFieldState)}`);
        assert.ok(glassFieldState.fieldTop >= glassFieldState.visibleTop - 1 && glassFieldState.fieldBottom <= glassFieldState.visibleBottom + 1, `${label} ${fieldSelector} must remain fully visible inside the visual viewport: ${JSON.stringify(glassFieldState)}`);
        const expectedKeyboardOverlap = Math.max(0, glassFieldState.layoutHeight - glassFieldState.viewportTop - glassFieldState.viewportHeight);
        if (glassFieldState.fullLayout) {
          assert.ok(Math.abs(glassFieldState.contentPaddingBottom - expectedKeyboardOverlap - glassFieldState.safeAreaBottom) <= 1, `${label} ${fieldSelector} scroller padding must equal keyboard overlap plus safe area: ${JSON.stringify({ ...glassFieldState, expectedKeyboardOverlap })}`);
          assert.ok(glassFieldState.contentTailSpace <= 1, `${label} ${fieldSelector} must use padding only, with no extra layout tail: ${JSON.stringify(glassFieldState)}`);
        } else {
          assert.ok(Math.abs(glassFieldState.contentPaddingBottom - 12) <= 1, `${label} ${fieldSelector} must preserve the existing non-iOS Safari scroller padding: ${JSON.stringify(glassFieldState)}`);
          assert.ok(Math.abs(glassFieldState.contentTailSpace - Math.max(0, glassFieldState.sheetHeight - glassFieldState.viewportTop - glassFieldState.viewportHeight)) <= 1, `${label} ${fieldSelector} legacy scroll tail must match the visual viewport overlap: ${JSON.stringify(glassFieldState)}`);
        }
        if (fieldSelector === '#order-note') {
          assert.ok(glassFieldState.fieldTop >= glassFieldState.visibleTop - 1 && glassFieldState.fieldBottom <= glassFieldState.visibleBottom + 1, `${label} Order Note must settle above the keyboard after focus: ${JSON.stringify(glassFieldState)}`);
          assert.ok(glassFieldState.fieldBottom >= glassFieldState.visibleBottom - 16, `${label} Order Note must not leave a blank band above Safari's AutoFill controls: ${JSON.stringify(glassFieldState)}`);
          await page.evaluate(() => {
            const dialog = document.querySelector('dialog.bag-modal');
            const content = dialog.querySelector('.bag-content');
            const header = dialog.querySelector('.checkout-summary-header h3');
            const contentRect = content.getBoundingClientRect();
            const headerRect = header.getBoundingClientRect();
            const visibleTop = Math.max(window.visualViewport.offsetTop, contentRect.top) + 16;
            const visibleBottom = Math.min(
              window.visualViewport.offsetTop + window.visualViewport.height,
              dialog.getBoundingClientRect().bottom,
              contentRect.bottom,
            ) - 12;
            if (headerRect.top < visibleTop) content.scrollTop -= visibleTop - headerRect.top;
            if (headerRect.bottom > visibleBottom) content.scrollTop += headerRect.bottom - visibleBottom;
          });
          const summaryHeaderBounds = await page.locator('.checkout-summary-header h3').evaluate(el => {
            const rect = el.getBoundingClientRect();
            const content = el.closest('.bag-content').getBoundingClientRect();
            const dialog = el.closest('dialog').getBoundingClientRect();
            const visibleTop = Math.max(window.visualViewport.offsetTop, content.top, dialog.top) + 16;
            const visibleBottom = Math.min(window.visualViewport.offsetTop + window.visualViewport.height, content.bottom, dialog.bottom) - 12;
            return { top: rect.top, bottom: rect.bottom, visibleTop, visibleBottom };
          });
          assert.ok(summaryHeaderBounds.top >= summaryHeaderBounds.visibleTop - 1 && summaryHeaderBounds.bottom <= summaryHeaderBounds.visibleBottom + 1, `${label} Order Summary heading must scroll fully into the visible area above the keyboard: ${JSON.stringify(summaryHeaderBounds)}`);
          await page.evaluate(() => {
            const viewport = window.visualViewport;
            Object.defineProperty(viewport, 'height', { configurable: true, value: 290 });
            Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 48 });
            viewport.dispatchEvent(new Event('resize'));
            viewport.dispatchEvent(new Event('scroll'));
          });
          await page.waitForTimeout(350);
          const resizedOrderNote = await page.evaluate(() => {
            const modal = document.querySelector('dialog.bag-modal');
            const content = modal.querySelector('.bag-content');
            const field = document.querySelector('#order-note');
            const fieldRect = field.getBoundingClientRect();
            const contentRect = content.getBoundingClientRect();
            return {
              fullLayout: modal.classList.contains('is-ios-full-layout'),
              layoutHeight: Number.parseFloat(modal.style.getPropertyValue('--modal-layout-height')),
              fieldBottom: fieldRect.bottom,
              contentBottom: contentRect.bottom,
              viewportBottom: window.visualViewport.offsetTop + window.visualViewport.height,
              scrollTop: content.scrollTop,
              scrollHeight: content.scrollHeight,
              clientHeight: content.clientHeight,
              activeTag: document.activeElement?.tagName,
              activeId: document.activeElement?.id,
              visibleBottom: Math.min(window.visualViewport.offsetTop + window.visualViewport.height, modal.getBoundingClientRect().bottom, contentRect.bottom) - 12,
            };
          });
          assert.ok(resizedOrderNote.fieldBottom <= resizedOrderNote.visibleBottom + 1, `${label} Order Note must remain above the AutoFill bar after its viewport resize: ${JSON.stringify(resizedOrderNote)}`);
          assert.ok(resizedOrderNote.fieldBottom >= resizedOrderNote.visibleBottom - 16, `${label} an AutoFill resize must not leave a blank band beneath Order Note: ${JSON.stringify(resizedOrderNote)}`);
          assert.ok(Math.abs(resizedOrderNote.contentBottom - (resizedOrderNote.fullLayout ? resizedOrderNote.layoutHeight : resizedOrderNote.viewportBottom)) <= 1, `${label} AutoFill viewport resize must keep the scroll viewport at its expected bottom: ${JSON.stringify(resizedOrderNote)}`);
          await page.evaluate(() => {
            const viewport = window.visualViewport;
            Object.defineProperty(viewport, 'height', { configurable: true, value: 403 });
            Object.defineProperty(viewport, 'offsetTop', { configurable: true, value: 320 });
            viewport.dispatchEvent(new Event('scroll'));
            viewport.dispatchEvent(new Event('resize'));
          });
          await page.waitForTimeout(50);
          const pannedOrderNote = await page.locator('dialog.bag-modal .bag-content').evaluate(content => ({
            fullLayout: content.closest('dialog').classList.contains('is-ios-full-layout'),
            layoutHeight: Number.parseFloat(content.closest('dialog').style.getPropertyValue('--modal-layout-height')),
            tailSpace: getComputedStyle(content, '::after').content === 'none' ? 0 : Number.parseFloat(getComputedStyle(content, '::after').height),
            paddingBottom: Number.parseFloat(getComputedStyle(content).paddingBottom),
            contentBottom: content.getBoundingClientRect().bottom,
            viewportHeight: Number.parseFloat(content.closest('dialog').style.getPropertyValue('--modal-viewport-height')),
            viewportTop: Number.parseFloat(content.closest('dialog').style.getPropertyValue('--modal-viewport-top')),
            sheetHeight: Number.parseFloat(content.closest('dialog').style.getPropertyValue('--modal-sheet-height')),
            keyboardOverlap: Number.parseFloat(content.closest('dialog').style.getPropertyValue('--modal-keyboard-overlap')),
            viewportBottom: window.visualViewport.offsetTop + window.visualViewport.height,
          }));
          const pannedKeyboardOverlap = Math.max(0, (pannedOrderNote.fullLayout ? pannedOrderNote.layoutHeight : pannedOrderNote.sheetHeight) - pannedOrderNote.viewportTop - pannedOrderNote.viewportHeight);
          assert.ok(Math.abs(pannedOrderNote.contentBottom - (pannedOrderNote.fullLayout ? pannedOrderNote.layoutHeight : pannedOrderNote.viewportBottom)) <= 1, `${label} panned scroll viewport must reach its expected bottom: ${JSON.stringify(pannedOrderNote)}`);
          if (pannedOrderNote.fullLayout) {
            assert.ok(pannedOrderNote.paddingBottom >= pannedKeyboardOverlap - 1, `${label} panned scroller padding must cover keyboard overlap: ${JSON.stringify({ ...pannedOrderNote, pannedKeyboardOverlap })}`);
            assert.ok(pannedOrderNote.tailSpace <= 1, `${label} panned full-height scroller must not add a layout tail: ${JSON.stringify(pannedOrderNote)}`);
          } else {
            assert.ok(Math.abs(pannedOrderNote.paddingBottom - 12) <= 1, `${label} panned viewport padding must remain fixed: ${JSON.stringify(pannedOrderNote)}`);
            assert.ok(Math.abs(pannedOrderNote.tailSpace - pannedKeyboardOverlap) <= 1, `${label} panned visual viewport must subtract offsetTop from bottom keyboard overlap: ${JSON.stringify({ ...pannedOrderNote, pannedKeyboardOverlap })}`);
          }
        }
      }
    }
    if (engine.name() === 'webkit') {
      await page.evaluate(() => {
        delete window.visualViewport.height;
        delete window.visualViewport.offsetTop;
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 390 });
      });
      await page.setViewportSize({ width: 844, height: 390 });
      await page.locator('#order-name').focus();
      await page.evaluate(() => {
        Object.defineProperty(window.visualViewport, 'height', { configurable: true, value: 240 });
        Object.defineProperty(window.visualViewport, 'offsetTop', { configurable: true, value: 0 });
        window.visualViewport.dispatchEvent(new Event('resize'));
      });
      await page.waitForTimeout(350);
      const landscapeState = await page.evaluate(() => {
        const modal = document.querySelector('dialog.bag-modal');
        const content = modal.querySelector('.bag-content');
        const field = document.querySelector('#order-name');
        const probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
        document.body.append(probe);
        const expectedLayoutHeight = Math.max(window.innerHeight, document.documentElement.clientHeight, probe.getBoundingClientRect().height);
        probe.remove();
        const dialogRect = modal.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const fieldRect = field.getBoundingClientRect();
        const viewport = window.visualViewport;
        return {
          fullLayout: modal.classList.contains('is-ios-full-layout'),
          dialogHeight: dialogRect.height,
          contentHeight: contentRect.height,
          expectedLayoutHeight,
          scrollY: window.scrollY,
          fieldTop: fieldRect.top,
          fieldBottom: fieldRect.bottom,
          viewportTop: viewport.offsetTop,
          viewportBottom: viewport.offsetTop + viewport.height,
        };
      });
      assert.equal(landscapeState.fullLayout, true, `Rotating with the keyboard open must keep the iOS full-layout path: ${JSON.stringify(landscapeState)}`);
      assert.ok(Math.abs(landscapeState.dialogHeight - landscapeState.expectedLayoutHeight) <= 1, `The dialog must remeasure the landscape large viewport: ${JSON.stringify(landscapeState)}`);
      assert.ok(Math.abs(landscapeState.contentHeight - landscapeState.expectedLayoutHeight) <= 1, `The scroller must remeasure the landscape large viewport: ${JSON.stringify(landscapeState)}`);
      assert.equal(landscapeState.scrollY, 0, `Rotation must not pan the locked page: ${JSON.stringify(landscapeState)}`);
      assert.ok(landscapeState.fieldTop >= landscapeState.viewportTop - 1 && landscapeState.fieldBottom <= landscapeState.viewportBottom + 1, `The focused field must remain visible after rotation: ${JSON.stringify(landscapeState)}`);
    }
    assert.deepEqual(errors, []);
    console.log(`${engine.name()}: Order Bag locks the menu and scrolls its focused 16px fields without zooming`);
  } finally {
    await browser.close();
  }
}
