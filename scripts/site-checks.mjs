import assert from 'node:assert/strict';

const base = (typeof process !== 'undefined' && process.env.SITE_URL) || 'http://127.0.0.1:5173';
const routes = ['', '?page=beverages', '?page=diner-bites', '?page=our-story'];
const heading = async (page) => page.locator('h1').innerText({});
const overflow = async (page) => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);

// The same checks accept native Playwright or the connected browser's documented API.
export async function checkPages({ page, goto, setViewport }) {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await setViewport({ width, height: 900 });
    for (const route of routes) {
      await goto(`${base}/${route}`);
      assert.ok(await heading(page));
      assert.equal(await overflow(page), false, `${route || 'home'} overflows at ${width}px`);
      assert.equal(await page.locator('h1').count(), 1);
    }
  }
}

export async function checkNavigationDismissal({ page, goto, setViewport }) {
  await setViewport({ width: 390, height: 844 });
  await goto(`${base}/`);
  await page.getByRole('button', { name: 'Open navigation', exact: true }).waitFor({ state: 'visible' });
  const before = await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.scrollTo(0, 900);
    return { x: scrollX, y: scrollY };
  });
  await page.evaluate(() => {
    const menu = document.querySelector('.header .mobile-menu');
    menu.focus({ preventScroll: true });
    menu.click();
  });
  await page.getByRole('dialog', { name: 'Navigation', exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('dialog', { name: 'Navigation', exact: true }).evaluate(dialog => dialog.click());
  await page.getByRole('dialog', { name: 'Navigation', exact: true }).waitFor({ state: 'hidden' });
  const after = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  assert.deepEqual(after, before, 'Dismissing navigation must preserve the page scroll position');
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.header .mobile-menu')), true);
}

export async function checkBag({ page, goto }) {
  await goto(`${base}/`);
  await page.getByRole('button', { name: 'Make it a coffee date', exact: true }).click();
  await page.getByRole('button', { name: 'Open bag, 2 items', exact: true }).click();
  let text = await page.getByRole('dialog').innerText({});
  assert.match(text, /Salted Caramel Macchiato/);
  assert.match(text, /Matcha Latte/);
  assert.match(text, /₱350/);
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await goto(`${base}/?page=our-story`);
  await page.getByRole('button', { name: 'Open bag, 2 items', exact: true }).click();
  await page.getByRole('button', { name: 'Add one Salted Caramel Macchiato', exact: true }).click();
  text = await page.getByRole('dialog').innerText({});
  assert.match(text, /₱530/);
  await page.getByRole('button', { name: 'Remove Salted Caramel Macchiato from bag', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Matcha Latte from bag', exact: true }).click();
  assert.match(await page.getByRole('dialog').innerText({}), /Your bag is currently empty/);
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
}

export async function checkOrdering({ page, goto, setViewport }) {
  await setViewport({ width: 390, height: 844 });
  const fixture = `${base}/scripts/fixtures/checkout-recovery.html`;
  for (const state of ['fresh', 'expired', 'malformed']) {
    await goto(fixture);
    await page.getByRole('button', { name: `Load ${state} pending summary`, exact: true }).click();
    await page.getByRole('button', { name: 'Open bag, 0 items', exact: true }).click();
    if (state === 'fresh') {
      assert.match(await page.getByRole('dialog').innerText({}), /QA recovery summary/);
      await goto(`${base}/?page=beverages`);
      await page.getByRole('button', { name: 'Open bag, 0 items', exact: true }).click();
      assert.match(await page.getByRole('dialog').innerText({}), /QA recovery summary/);
      await page.getByRole('button', { name: 'Clear pending order summary', exact: true }).click();
    }
    assert.match(await page.getByRole('dialog').innerText({}), /Your bag is currently empty/);
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Customize Strawberry Milk', exact: true }).last().click();
  await page.getByRole('button', { name: 'Add to bag ₱160', exact: true }).click();
  await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
  await page.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
  assert.equal(await overflow(page), false);
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.checkout-summary-column,.checkout-actions-block')].map(e => e.className).join('|')),
    'checkout-summary-column|checkout-actions-block');
  assert.equal(await page.locator('.button-whatsapp-checkout').getAttribute('form'), 'checkout-order-form');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#order-name')).backgroundColor), 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  assert.ok(await page.getByRole('alert').count());
  assert.equal(await page.locator('#order-name-error').count(), 1, 'Focusing an invalid field must keep its error visible so the next click does not shift');
  await page.getByText('Custom time', { exact: true }).click();
  await page.locator('#checkout-custom-time').fill('23:30');
  await page.getByRole('button', { name: 'Review order', exact: true }).click();
  assert.match(await page.locator('#checkout-time-error').innerText({}), /10:00 AM.*9:00 PM/);
  assert.equal(await page.getByText('Your order is ready to send.', { exact: true }).count(), 0);
  await page.locator('#order-name').fill('Karl Santos');
  assert.equal(await page.locator('#order-name-error').count(), 0);
  await page.locator('#order-phone').fill('09123456789');
  assert.equal(await page.locator('#order-phone-error').count(), 0);
  await page.getByText('Door to door', { exact: true }).click();
  assert.match(await page.locator('#delivery-arrangements-note').innerText({}), /confirmed in WhatsApp/);
  await page.getByRole('button', { name: 'Back to Bag', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Strawberry Milk from bag', exact: true }).click();
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
}

export async function checkCheckoutRotation({ page, goto, setViewport }) {
  for (const mode of ['1', '0']) {
    await setViewport({ width: 414, height: 896 });
    await goto(`${base}/?docscroll=${mode}`);
    await page.getByRole('button', { name: 'Make it a coffee date', exact: true }).click();
    await page.getByRole('button', { name: 'Open bag, 2 items', exact: true }).click();
    await page.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
    await page.getByText('Custom time', { exact: true }).click();
    const time = page.locator('#checkout-custom-time');
    await time.fill('18:00');
    for (const [width, height] of [[414, 896], [896, 414], [414, 896], [320, 568]]) {
      await setViewport({ width, height });
      await time.focus();
      const bounds = await time.evaluate(field => {
        const rect = field.getBoundingClientRect();
        const parent = field.closest('.checkout-form-column').getBoundingClientRect();
        const style = getComputedStyle(field);
        return {
          left: rect.left, right: rect.right, parentLeft: parent.left, parentRight: parent.right,
          viewportWidth: document.documentElement.clientWidth,
          appearance: style.appearance, fontSize: Number.parseFloat(style.fontSize), value: field.value,
        };
      });
      assert.equal(bounds.appearance, 'none', 'The time field must use the authored sizing instead of Safari native control sizing');
      assert.ok(bounds.parentLeft >= -1 && bounds.parentRight <= bounds.viewportWidth + 1,
        `Checkout form overflows after rotation (${width}px, docscroll=${mode}): ${JSON.stringify(bounds)}`);
      assert.ok(bounds.left >= bounds.parentLeft - 1 && bounds.right <= bounds.parentRight + 1,
        `Time field overflows after rotation (${width}px, docscroll=${mode}): ${JSON.stringify(bounds)}`);
      assert.ok(bounds.fontSize >= 16, 'The time field must retain its existing zoom-safe font size');
      assert.equal(bounds.value, '18:00', 'Rotation must preserve the selected time');
    }
    await page.getByRole('button', { name: 'Back to Bag', exact: true }).click();
    await page.getByRole('button', { name: 'Remove Salted Caramel Macchiato from bag', exact: true }).click();
    await page.getByRole('button', { name: 'Remove Matcha Latte from bag', exact: true }).click();
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  }
}

export async function checkFooter({ page, goto, setViewport }) {
  await setViewport({ width: 390, height: 844 });
  await goto(`${base}/`);
  await heading(page);
  const messenger = page.getByRole('link', { name: 'Bean Diner on Messenger', exact: true });
  assert.equal(await messenger.getAttribute('href'), 'https://m.me/100959311683531');
  assert.equal(await messenger.getAttribute('target'), '_blank');
  assert.match(await messenger.getAttribute('rel'), /noopener/);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await setViewport({ width, height: 900 });
    const expected = ['https://www.facebook.com/beandiner', 'https://instagram.com/bean.diner', 'https://wa.me/639635913031', 'https://m.me/100959311683531'];
    const links = page.locator('.footer-social-links a');
    assert.equal(await links.count(), 4);
    for (let index = 0; index < 4; index++) {
      const link = links.nth(index);
      assert.equal(await link.getAttribute('href'), expected[index]);
      assert.equal(await link.getAttribute('target'), '_blank');
      assert.match(await link.getAttribute('rel'), /noopener noreferrer/);
      assert.equal(await link.locator('svg').getAttribute('aria-hidden'), 'true');
      assert.equal(await link.locator('svg').getAttribute('width'), '22');
      const rect = await link.boundingBox();
      assert.ok(rect.width >= 44 && rect.height >= 44);
      if (index) { const previous = await links.nth(index - 1).boundingBox(); assert.ok(rect.x >= previous.x + previous.width + 8); }
    }
    assert.equal(await overflow(page), false, 'Footer fits ' + width);
    await page.getByRole('link', { name: 'Back to top', exact: true }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'solid');
    await links.nth(0).focus();
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Bean Diner on Facebook');
    assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'solid');
    await page.getByRole('link', { name: 'Back to top', exact: true }).press('Enter');
    await page.waitForFunction(() => window.scrollY === 0);
  }
  await setViewport({ width: 390, height: 844 });
  assert.equal(await page.getByRole('link', { name: '0915 399 5000', exact: true }).getAttribute('href'), 'tel:09153995000');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('a[href^="tel:"]')).color), 'rgb(140, 101, 70)');
  assert.equal(await page.evaluate(() => [...document.images].filter(e => e.complete && !e.naturalWidth).length), 0);
  assert.equal(await page.locator('link[rel="preload"][as="image"]').getAttribute('href'), './images/bean-diner-video-poster.webp');
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.nav-modal .logo-title')).color), 'rgb(18, 18, 18)');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).press('Escape');
}

export async function checkBackground({ page, goto, setViewport }) {
  for (const route of ['', '?page=our-story', '?page=beverages', '?page=diner-bites']) {
    await setViewport({ width: 390, height: 844 });
    await goto(`${base}/${route}`);
    await heading(page);
    const state = await page.evaluate(() => ({
      root: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      viewport: document.querySelector('meta[name="viewport"]').content,
    }));
    assert.equal(state.root, state.body);
    assert.ok(state.viewport.includes('viewport-fit=cover'));
    assert.equal(await overflow(page), false);
  }
}

export async function checkMedia({ page, goto, setViewport }) {
  await setViewport({ width: 1280, height: 900 });
  const checkImages = async () => {
    const broken = await page.evaluate(async () => {
      const failures = await Promise.all([...document.images].map(async image => {
        image.loading = 'eager';
        try { await image.decode(); return null; }
        catch { return image.currentSrc || image.src; }
      }));
      return failures.filter(Boolean);
    });
    assert.deepEqual(broken, [], 'Every rendered image must load and decode');
  };
  for (const route of routes) {
    await goto(`${base}/${route}`);
    await heading(page);
    await checkImages();
    const tabs = page.locator('.menu-tab:visible');
    const count = await tabs.count();
    for (let index = 0; index < count; index++) {
      await tabs.nth(index).click();
      await checkImages();
    }
  }
}

export async function checkWhatsApp({ page, goto, setViewport }) {
  await setViewport({ width: 390, height: 844 });
  await page.clock.setFixedTime(new Date('2026-10-22T12:00:00+08:00'));
  const note = 'Order #1: 50% + syrup & ice "less sweet" 🍵\nSecond line';
  for (const type of ['For pick up', 'Dine in', 'Door to door']) {
    await goto(base + '/?page=beverages');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();
    await page.getByRole('button', { name: 'Customize Strawberry Milk', exact: true }).last().click();
    const itemNote = page.locator('#item-note');
    if (await itemNote.count()) await itemNote.fill('Item #2 + cream & ice');
    await page.getByRole('button', { name: 'Add to bag ₱160', exact: true }).press('Enter');
    await page.getByRole('button', { name: 'Open bag, 1 items', exact: true }).click();
    await page.getByRole('button', { name: 'Proceed to Details', exact: true }).click();
    await page.getByText(type, { exact: true }).click();
    if (type === 'Dine in') await page.locator('#checkout-table').fill('7');
    if (type === 'Door to door') await page.locator('#checkout-address').fill('House #3, Luna St. & corner');
    await page.locator('#order-name').fill('Karl Santos');
    await page.locator('#order-phone').fill('09123456789');
    await page.locator('#order-note').fill(note);
    await page.getByText('In 30 mins', { exact: true }).click();
    await page.getByText('Cash', { exact: true }).click();
    await page.getByRole('button', { name: 'Review order', exact: true }).click();
    const text = await page.locator('.receipt-summary-text').innerText();
    for (const expected of [note, 'Strawberry Milk', '₱160', 'Name: Karl Santos', 'Contact: 0912-345-6789', 'Preferred Timing: In 30 mins', 'Payment: Cash', 'Item #2 + cream & ice', 'Order request, awaiting confirmation.']) assert.ok(text.includes(expected), type + ': missing ' + expected);
    if (type === 'Dine in') assert.ok(text.includes('Table 7'));
    if (type === 'Door to door') assert.ok(text.includes('House #3, Luna St. & corner'));
    if (type === 'For pick up') assert.ok(text.includes('Pickup Location:'));
    const send = page.getByRole('link', { name: 'Send order on WhatsApp', exact: true });
    assert.equal(new URL(await send.getAttribute('href')).searchParams.get('text'), text);
    assert.equal(new URL(await page.getByRole('link', { name: 'Use WhatsApp Web', exact: true }).getAttribute('href')).searchParams.get('text'), text);
    assert.equal(await page.locator('.receipt').getByText(/Messenger/).count(), 0);
  }
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.setItem('beandiner-pending-order-v1', JSON.stringify({ message: 'Long order 🍵 # & + %\n'.repeat(250), createdAt: Date.now() }));
    document.execCommand = command => { window.__copiedOrder = document.activeElement.value; return command === 'copy'; };
  });
  await page.reload();
  await page.getByRole('button', { name: 'Open bag, 0 items', exact: true }).click();
  assert.ok(await page.locator('#whatsapp-length-warning').isVisible());
  assert.equal(await page.getByRole('link', { name: 'Open WhatsApp', exact: true }).getAttribute('href'), 'https://wa.me/639635913031');
  await page.evaluate(() => { document.execCommand = command => { window.__copiedOrder = document.activeElement.value; return command === 'copy'; }; });
  await page.locator('.receipt-actions-group').getByRole('button', { name: 'Copy order', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__copiedOrder), await page.locator('.receipt-summary-text').innerText());
  await page.getByRole('button', { name: 'Clear pending order summary', exact: true }).click();
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
}

export async function checkAll(harness) {
  await checkPages(harness);
  await checkNavigationDismissal(harness);
  await checkBag(harness);
  await checkOrdering(harness);
  await checkCheckoutRotation(harness);
  await checkFooter(harness);
  await checkWhatsApp(harness);
  await checkBackground(harness);
  await checkMedia(harness);
}

export async function runBrowserCheck(check, engines = ['chromium']) {
  const playwright = await import('@playwright/test');
  for (const engine of engines) {
    const browser = await playwright[engine].launch({ headless: true,
      ...(engine === 'chromium' && process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
    });
    try {
      const context = await browser.newContext({ ...(engine === 'webkit' ? playwright.devices['iPhone 14'] : {}), reducedMotion: 'reduce' });
      await context.route(/https:\/\/(www\.)?(facebook\.com|m\.me)\//, route => route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await check({ page, goto: url => page.goto(url), setViewport: size => page.setViewportSize(size) });
      assert.deepEqual(errors, []);
      console.log(`${engine}: ${check.name} passed`);
    } finally {
      await browser.close();
    }
  }
}
