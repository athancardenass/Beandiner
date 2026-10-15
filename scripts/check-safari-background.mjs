import assert from 'node:assert/strict';
import { chromium, webkit, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

await mkdir('artifacts/safari-background', { recursive: true });
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium ? { channel: 'msedge' } : {});
  try {
    for (const bag of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 430, height: 740 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      if (bag) await page.addInitScript(() => localStorage.setItem('beandiner-bag-v2', JSON.stringify([{key:'latte',id:'latte',quantity:1,price:145,size:'16 oz'}])));
      await page.goto('http://127.0.0.1:5173/');
      const checkColor = async (selector) => {
        await expect.poll(() => page.evaluate(selector => {
          const actual = getComputedStyle(document.querySelector(selector)).backgroundColor;
          const canvas = getComputedStyle(document.documentElement).backgroundColor;
          const body = getComputedStyle(document.body).backgroundColor;
          const theme = document.querySelector('meta[name="theme-color"]').content;
          return { same: actual === canvas && canvas === body && canvas === theme };
        }, selector)).toEqual({same:true});
      };
      await page.locator('#flavors').evaluate(el => window.scrollTo(0,el.offsetTop+100));
      await page.getByRole('button', {name:'Explore Iced Matcha Latte',exact:true}).click();
      await checkColor('.story-stage');
      // A compositor/toolbar edge can briefly expose the layer below the panel.
      assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
      await page.locator('.story-stage').evaluate(el => el.style.clipPath = 'inset(0 0 24px)');
      await checkColor('.story-stage');
      const expectedPixel = await page.locator('.story-stage').evaluate(el => getComputedStyle(el).backgroundColor.match(/\d+/g).slice(0,3).map(Number));
      const bottomPixel = await sharp(await page.screenshot()).extract({left:4,top:732,width:1,height:1}).removeAlpha().raw().toBuffer();
      // The existing bag shadow and browser color conversion can shade a pixel.
      assert.ok([...bottomPixel].every((value,i) => Math.abs(value-expectedPixel[i]) <= 4),'Exposed pixels below the panel must use the active section color');
      await page.getByRole('button', {name:'Explore Sweet Strawberry Iced Latte',exact:true}).click();
      await checkColor('.story-stage');
      await page.locator('.story-stage').evaluate(el => el.style.removeProperty('clip-path'));
      for (const height of [852, 740, 900, 680]) {
        await page.setViewportSize({width:430,height});
        await page.locator('#flavors').evaluate(el => window.scrollTo(0,el.offsetTop+100));
        await expect.poll(() => page.locator('.story-stage').evaluate(el => Math.round(el.getBoundingClientRect().height))).toBe(height);
        await checkColor('.story-stage');
      }
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.getByRole('button', {name:'Explore Sweet Strawberry Iced Latte',exact:true}).click();
      await checkColor('.story-stage');
      if (bag) {
        const outer = await page.locator('.floating-bag-bubble').evaluate(el => getComputedStyle(el).backgroundColor);
        assert.equal(outer,'rgba(0, 0, 0, 0)');
        await expect(page.locator('.floating-bag-surface')).toBeVisible();
        await page.locator('.floating-bag-bubble').click();
        await expect(page.locator('.bag-modal')).toBeVisible();
        await page.getByRole('button',{name:'Close dialog'}).click();
      }
      await page.evaluate(() => window.scrollTo(0,document.documentElement.scrollHeight));
      await checkColor('footer');
      await page.locator('#menu').evaluate(el => window.scrollTo(0,el.offsetTop+300));
      await checkColor('#menu');
      await page.screenshot({path:`artifacts/safari-background/${engine.name()}-${bag?'bag':'empty'}.png`});
      assert.deepEqual(errors,[]);
      console.log(`${engine.name()} ${bag?'bag':'empty'}: section canvas, viewport resizing, footer, and theme passed`);
      await page.close();
    }
    const desktop = await browser.newPage({viewport:{width:1440,height:900}});
    await desktop.goto('http://127.0.0.1:5173/');
    assert.equal(await desktop.evaluate(() => getComputedStyle(document.documentElement).backgroundColor),'rgb(255, 240, 214)');
    assert.equal(await desktop.locator('.story-stage').evaluate(el => getComputedStyle(el).height),'900px');
    await desktop.close();
  } finally { await browser.close(); }
}
