import assert from 'node:assert/strict';
import { webkit, devices, expect } from '@playwright/test';
const base = (process.env.SITE_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
const origin = new URL(base).origin;
const failures = [];
const pageState = page => page.evaluate(() => ({
  htmlClass: document.documentElement.className,
  htmlStyle: document.documentElement.getAttribute('style') || '',
  bodyClass: document.body.className,
  bodyStyle: document.body.getAttribute('style') || '',
  rootStyle: document.getElementById('root').getAttribute('style') || '',
  rootInert: document.getElementById('root').inert,
  theme: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
}));
const browser = await webkit.launch();
try {
  for (const product of ['Honey Lemon Butterfly Pea', 'Strawberry Milk', 'Oreo Milkshake', 'Double Dutch', 'Choco Pistachio', 'Matcha Latte']) {
    const context = await browser.newContext({ ...devices['iPhone 14'], isMobile: false, viewport: { width: 414, height: 750 }, reducedMotion: 'reduce' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin && route.request().resourceType() !== 'media' ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(`${base}/?page=beverages`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.classList.contains('js-ready'));
    const trigger = page.getByRole('button', { name: 'Customize ' + product, exact: true }).last();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.evaluate(el => el.focus({ preventScroll: true }));
    const originalState = await pageState(page);
    // Keyboard activation preserves the focused opener in Safari.
    await page.keyboard.press('Enter');
    const dialog = page.locator('dialog.product-modal[open]');
    await expect(dialog).toBeVisible();
    try {
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('dialog.product-modal[open] .modal-close')), true, 'Opening must move focus to Close without scrolling');
      assert.equal(await dialog.getAttribute('aria-modal'), 'true', 'The product dialog must announce modal semantics');
      const focusY = await page.evaluate(() => scrollY);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('dialog.product-modal[open] .add-row > button')), true, 'Shift+Tab from Close must wrap to Add');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('dialog.product-modal[open] .modal-close')), true, 'Tab from Add must wrap to Close');
      assert.equal(await page.evaluate(() => scrollY), focusY, 'Tab cycling must not pan the page');
    } catch (error) { failures.push(product + ': ' + error.message); }
    await page.evaluate(() => { for (const a of document.querySelector('.modal-inner').getAnimations()) a.finish(); });
    await page.locator('#item-note').scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => ({ y: scrollY, height: document.body.style.minHeight, box: document.querySelector('.modal-inner').getBoundingClientRect().toJSON() }));
    await page.evaluate(() => {
      window.__focusScrollCalls = [];
      const original = window.scrollTo.bind(window);
      window.scrollTo = (...args) => { window.__focusScrollCalls.push(args); original(...args); };
      const state = window.__keyboardViewport = { height: 750, pageTop: scrollY, offsetTop: 0 };
      for (const key of ['height', 'pageTop', 'offsetTop']) Object.defineProperty(visualViewport, key, { configurable: true, get: () => state[key] });
    });
    await page.locator('#item-note').click();
    const focused = await page.evaluate(() => ({ y: scrollY, height: document.body.style.minHeight, calls: window.__focusScrollCalls, box: document.querySelector('.modal-inner').getBoundingClientRect().toJSON() }));
    try {
      assert.equal(focused.y, before.y, 'Focusing Note must preserve the document offset');
      assert.equal(focused.height, before.height, 'Focus must not collapse the document under an existing compositor layer');
      assert.deepEqual(focused.calls, [], 'Focus must not issue a page scroll reset');
      assert.deepEqual(focused.box, before.box, 'Focus alone must preserve card geometry');
    } catch (error) { failures.push(product + ': ' + error.message); }
    // Phone trace: the document has panned while pageTop still reports the old position.
    await page.evaluate(() => { window.__keyboardViewport.height = 430; window.__keyboardViewport.pageTop = scrollY - 320; window.__keyboardViewport.offsetTop = 0; visualViewport.dispatchEvent(new Event('resize')); });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const staleFrame = await dialog.evaluate(el => ({ top: el.querySelector('.modal-inner').getBoundingClientRect().top, bottom: el.querySelector('.modal-inner').getBoundingClientRect().bottom }));
    try {
      assert.ok(Math.abs(staleFrame.top) <= 1, 'A stale visualViewport.pageTop must not lift the sheet 320px above the visible page');
      assert.ok(Math.abs(staleFrame.bottom - 430) <= 1, 'Keyboard sheet must remain anchored before visualViewport catches up');
    } catch (error) { failures.push(product + ': ' + error.message); }
    await page.evaluate(() => { window.__keyboardViewport.height = 430; window.__keyboardViewport.pageTop = scrollY; visualViewport.dispatchEvent(new Event('resize')); });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const geometry = await dialog.evaluate(el => {
      const form = el.querySelector('.customize-form');
      const action = el.querySelector('.add-row');
      const card = el.querySelector('.modal-inner');
      return { card: card.getBoundingClientRect().toJSON(), formHeight: form.clientHeight, formRange: form.scrollHeight - form.clientHeight, actionHeight: action.getBoundingClientRect().height, bottomPadding: parseFloat(getComputedStyle(form).paddingBottom), viewportTop: visualViewport.pageTop - scrollY, viewportHeight: visualViewport.height };
    });
    try {
      assert.ok(Math.abs(geometry.card.bottom - (geometry.viewportTop + geometry.viewportHeight)) <= 1, 'Card bottom must meet the measured keyboard viewport');
      assert.ok(geometry.card.height <= geometry.viewportHeight + 1, 'The card must fit the visible keyboard area');
      assert.ok(geometry.formRange > 120, 'The form must have real scroll range while the page is locked');
      assert.ok(geometry.bottomPadding <= 20, 'No added keyboard or safe-area spacer below Add');
      const form = page.locator('.customize-form');
      await form.evaluate(el => { el.scrollTop = el.scrollHeight; });
      const maxScroll = await form.evaluate(el => el.scrollTop);
      const formBox = await form.boundingBox();
      await page.mouse.move(formBox.x + 40, Math.max(0, formBox.y) + 40);
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(150);
      assert.ok(await form.evaluate(el => el.scrollTop) < maxScroll, 'User must be able to scroll upward with Note focused');
      const userScroll = await form.evaluate(el => el.scrollTop);
      await page.evaluate(() => visualViewport.dispatchEvent(new Event('scroll')));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
      assert.equal(await form.evaluate(el => el.scrollTop), userScroll, 'Viewport scroll must not pull the form back to Note');
      await form.evaluate(el => { el.scrollTop = el.scrollHeight; });
      const actionBottom = await page.locator('.add-row').evaluate(el => el.getBoundingClientRect().bottom);
      assert.ok(geometry.viewportTop + geometry.viewportHeight - actionBottom <= 21, 'Only normal form padding may remain below Add');
      for (const state of [{ height: 332, offset: 98 }, { height: 430, offset: 0 }]) {
        await page.evaluate(state => { window.__keyboardViewport.height = state.height; window.__keyboardViewport.pageTop = scrollY + state.offset; window.__keyboardViewport.offsetTop = state.offset; visualViewport.dispatchEvent(new Event('resize')); visualViewport.dispatchEvent(new Event('scroll')); }, state);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const fit = await dialog.evaluate(el => { const box = el.querySelector('.modal-inner').getBoundingClientRect(); return { top: box.top, bottom: box.bottom, height: box.height, visibleTop: 0, visibleHeight: visualViewport.height }; });
        assert.ok(fit.top >= fit.visibleTop - 1 && fit.bottom <= fit.visibleTop + fit.visibleHeight + 1, 'Sheet stays within the visible page despite delayed visual-viewport offsets');
        assert.equal(await page.evaluate(() => window.__focusScrollCalls.length), 0, 'Keyboard events must never reset the page scroll');
      }
    } catch (error) { failures.push(product + ': ' + error.message); }
    console.log(JSON.stringify({ product, openingY: before.y, focusedY: focused.y, keyboard: geometry }));
    await page.locator('#item-note').blur();
    await page.evaluate(() => { window.__keyboardViewport.height = 750; window.__keyboardViewport.pageTop = scrollY; visualViewport.dispatchEvent(new Event('resize')); });
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    assert.equal(await page.evaluate(() => scrollY), before.y, 'Closing restores the opening offset');
    assert.equal(await page.evaluate(() => document.documentElement.style.overflowY), '', 'Page lock is cleaned up');
    assert.deepEqual(await pageState(page), originalState, 'Closing must restore classes, styles, root inertness and theme exactly');
    assert.equal(await trigger.evaluate(el => document.activeElement === el), true, 'Focus returns to the original trigger');
    assert.equal(await page.locator('[data-product-backdrop-edge]').count(), 0, 'No backdrop remains after close');
    await context.close();
  }
  for (const viewport of [{ width: 844, height: 390 }, { width: 1024, height: 600 }, { width: 834, height: 1194 }]) {
    const context = await browser.newContext({ ...devices['iPad Pro 11'], isMobile: false, viewport, reducedMotion: 'reduce' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin && route.request().resourceType() !== 'media' ? route.continue() : route.abort());
    const page = await context.newPage();
    try {
      await page.goto(`${base}/?page=beverages`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Customize Strawberry Milk', exact: true }).last().click();
      const dialog = page.locator('dialog.product-modal[open]');
      await expect(dialog).toBeVisible();
      const openingY = await page.evaluate(() => scrollY);
      const form = page.locator('.customize-form');
      const layout = await form.evaluate(el => ({ overflow: getComputedStyle(el).overflowY, height: el.clientHeight, content: el.scrollHeight, box: el.getBoundingClientRect().toJSON() }));
      assert.ok(['auto', 'scroll'].includes(layout.overflow), 'Wide Safari form must remain scrollable');
      assert.ok(layout.box.top >= -1 && layout.box.bottom <= viewport.height + 1, 'Wide form must fit the visible viewport');
      if (layout.content > layout.height) {
        const box = await form.boundingBox();
        await page.mouse.move(box.x + 30, Math.max(0, box.y) + 30);
        await page.mouse.wheel(0, 800);
        await page.waitForTimeout(150);
        assert.ok(await form.evaluate(el => el.scrollTop) > 0, 'User scrolling must move the wide form');
        assert.equal(await page.evaluate(() => scrollY), openingY, 'Form scrolling must preserve the page offset');
      }
      // Scroll the form itself; locator.click/scrollIntoView would mask hidden-page overflow.
      await form.evaluate(el => { el.scrollTop = el.scrollHeight; });
      const action = await page.locator('.add-row').boundingBox();
      assert.ok(action.y >= 0 && action.y + action.height <= viewport.height + 1, 'Add must be reachable inside a wide short viewport');
      if (viewport.height > 1000) {
        await page.locator('#item-note').focus();
        await page.evaluate(() => {
          Object.defineProperty(visualViewport, 'height', { configurable: true, get: () => 430 });
          visualViewport.dispatchEvent(new Event('resize'));
        });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await form.evaluate(el => { el.scrollTop = el.scrollHeight; });
        const keyboardAction = await page.locator('.add-row').boundingBox();
        assert.ok(keyboardAction.y >= 0 && keyboardAction.y + keyboardAction.height <= 431, 'Tablet keyboard must leave Add reachable by form scrolling');
      }
      await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
      await expect(dialog).toHaveCount(0);
      assert.equal(await page.evaluate(() => scrollY), openingY, 'Wide dialog restores the page offset');
      console.log(`${viewport.width}x${viewport.height}: wide Safari scrolling passed`);
    } catch (error) { failures.push(`${viewport.width}x${viewport.height}: ${error.message}`); }
    finally { await context.close(); }
  }
} finally { await browser.close(); }
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('PASS: Safari product focus, stale keyboard viewports, six-drink scrolling, wide layouts and cleanup');