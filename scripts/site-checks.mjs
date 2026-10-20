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
  assert.equal(await page.locator('.button-messenger-checkout').getAttribute('form'), 'checkout-order-form');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#order-name')).backgroundColor), 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Send order via Messenger', exact: true }).click();
  assert.ok(await page.getByRole('alert').count());
  await page.getByText('Custom time', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Specify time today:', exact: true }).fill('23:30');
  await page.getByRole('button', { name: 'Send order via Messenger', exact: true }).click();
  assert.match(await page.locator('#checkout-time-error').innerText({}), /10:00 AM.*9:00 PM/);
  assert.equal(await page.getByText('Your order is ready to send.', { exact: true }).count(), 0);
  await page.getByText('Door to door', { exact: true }).click();
  assert.match(await page.locator('#delivery-arrangements-note').innerText({}), /confirmed in Messenger/);
  await page.getByRole('button', { name: 'Back to Bag', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Strawberry Milk from bag', exact: true }).click();
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
}

export async function checkFooter({ page, goto, setViewport }) {
  await setViewport({ width: 390, height: 844 });
  await goto(`${base}/`);
  await heading(page);
  const messenger = page.getByRole('link', { name: 'Chat with Bean Diner on Facebook Messenger', exact: true });
  assert.equal(await messenger.getAttribute('href'), 'https://www.facebook.com/messages/t/100959311683531');
  assert.equal(await messenger.getAttribute('target'), '_blank');
  assert.match(await messenger.getAttribute('rel'), /noopener/);
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

export async function checkAll(harness) {
  await checkPages(harness);
  await checkBag(harness);
  await checkOrdering(harness);
  await checkFooter(harness);
  await checkBackground(harness);
}

export async function runBrowserCheck(check, engines = ['chromium']) {
  const playwright = await import('@playwright/test');
  for (const engine of engines) {
    const browser = await playwright[engine].launch({ headless: true,
      ...(engine === 'chromium' && process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
    });
    try {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
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
