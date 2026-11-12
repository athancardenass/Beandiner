// WebKit iPhone check of the order funnel restyle: modal CTA, quiet selections, order-slip bag, card thumbnails.
// Run with the dev server up: node scripts/check-funnel-webkit.mjs [baseUrl]
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { devices, webkit } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:5173';
const out = 'scripts/out/funnel-webkit';
mkdirSync(out, { recursive: true });

const browser = await webkit.launch();
const page = await browser.newPage({ ...devices['iPhone 15'] });
const settle = () => page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { /* finished */ } }));

// Seed before the app boots; the app saves its own bag on unload, so a reload would overwrite a later seed.
await page.addInitScript(() => {
  if (sessionStorage.getItem('funnel-seeded')) return;
  sessionStorage.setItem('funnel-seeded', '1');
  localStorage.setItem('beandiner-bag-v2', JSON.stringify([
    { key: 'bev-iced-matcha-latte-16oz', id: 'iced-matcha-latte', name: 'Matcha Latte (16 oz)', size: '16 oz', temperature: 'Over Iced', quantity: 2, price: 1 },
    { key: 'bite-plain-croffle', id: 'plain-croffle', name: 'Plain', size: 'Plate', temperature: 'Hot & Fresh', quantity: 1, price: 1, isFood: true, note: 'Extra syrup please' },
  ]));
});
await page.goto(`${base}/?page=beverages`);
await page.waitForTimeout(1200);
const browserFamily = await page.evaluate(() => document.documentElement.dataset.browserFamily);

// Product modal
await page.locator('button[type=button][aria-label="Customize Honey Lemon Butterfly Pea"]').click();
await page.waitForTimeout(800);
await settle();
const modal = await page.evaluate(() => {
  const d = document.querySelector('dialog[open].product-modal');
  const cta = d.querySelector('.funnel-cta');
  const sel = d.querySelector('label.selected');
  const r = cta.getBoundingClientRect();
  return {
    ctaBg: getComputedStyle(cta).backgroundColor,
    ctaInView: r.bottom <= innerHeight && r.top >= 0,
    selectedBg: sel && getComputedStyle(sel).backgroundColor,
    fixed: d.querySelector('.customize-fixed')?.textContent,
  };
});
await page.screenshot({ path: `${out}/1-modal.png` });
await page.locator('dialog[open] .funnel-cta').click();
await page.waitForTimeout(900);

// Bag
await page.evaluate(() => document.querySelector('.bag-button, .floating-bag-bubble')?.click());
await page.waitForTimeout(1000);
await settle();
const bag = await page.evaluate(() => {
  const d = document.querySelector('dialog[open].bag-modal');
  const bar = d.querySelector('.bag-actions-bar');
  const cta = bar.querySelector('.funnel-cta');
  const r = cta.getBoundingClientRect();
  return {
    docscroll: d.classList.contains('docscroll-mode'),
    barPosition: getComputedStyle(bar).position,
    ctaBg: getComputedStyle(cta).backgroundColor,
    ctaTop: Math.round(r.top),
    viewport: innerHeight,
    total: bar.querySelector('strong').textContent,
    photos: [...d.querySelectorAll('.cart-item > img')].map((img) => img.naturalWidth > 0),
    stamps: d.querySelectorAll('.cart-item > .cart-food-icon img').length,
    noteFont: getComputedStyle(d.querySelector('.cart-item-note')).fontFamily,
    overflowX: document.documentElement.scrollWidth > innerWidth,
  };
});
await page.screenshot({ path: `${out}/2-bag-top.png` });
await page.evaluate(() => {
  const d = document.querySelector('dialog[open].bag-modal');
  [...d.querySelectorAll('.cart-item')].pop().scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/3-bag-end.png` });

// Details step
await page.locator('dialog[open] .button-proceed-checkout').click();
await page.waitForTimeout(800);
await settle();
await page.screenshot({ path: `${out}/4-details.png` });

// Catalog cards
await page.goto(`${base}/?page=diner-bites`);
await page.waitForTimeout(1500);
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  const card = document.querySelector('.food-page-item');
  window.scrollTo(0, card.getBoundingClientRect().top + scrollY - 140);
});
await page.waitForTimeout(800);
await settle();
await page.evaluate(() => document.querySelectorAll('.food-page-item img[loading=lazy]').forEach((i) => { i.loading = 'eager'; }));
await page.waitForTimeout(1000);
// Only real item photos: Plain has none, Biscoff Caramel has its own.
const thumbs = await page.evaluate(() => {
  const card = (name) => [...document.querySelectorAll('.food-page-item')].find((c) => c.querySelector('h3')?.textContent.trim() === name);
  const img = (name) => card(name)?.querySelector('.menu-item-thumb');
  return { plain: !!img('Plain'), biscoff: !!img('Biscoff Caramel') && img('Biscoff Caramel').naturalWidth > 0 };
});
await page.screenshot({ path: `${out}/5-diner-bites.png` });
await browser.close();

const report = { browserFamily, modal, bag, thumbs };
console.log(JSON.stringify(report, null, 2));
assert.equal(modal.ctaBg, 'rgb(18, 18, 18)');
assert.ok(modal.ctaInView, 'modal Add button visible without scrolling');
assert.equal(modal.fixed, 'Served iced · 22 oz');
assert.equal(bag.ctaBg, 'rgb(18, 18, 18)');
assert.ok(bag.photos.every(Boolean), 'bag photos load');
assert.ok(!bag.overflowX, 'no horizontal scroll');
assert.equal(thumbs.plain, false, 'items without a real photo show none');
assert.equal(thumbs.biscoff, true, 'items with a real photo show it');
assert.ok(bag.stamps >= 1, 'photo-less bag items get the Bean Diner stamp');
console.log('PASS');
