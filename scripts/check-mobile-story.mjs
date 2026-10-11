import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts/mobile-story', {recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 for(const [width,height] of [[320,568],[375,667],[390,844],[430,932],[528,880]]) {
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  await page.addInitScript(()=>localStorage.setItem('beandiner-bag-v2',JSON.stringify([{key:'latte',id:'latte',quantity:1,price:145,size:'16 oz'}])));
  await page.goto('http://127.0.0.1:5173/');
  await page.locator('#flavors').evaluate(e=>window.scrollTo(0,e.offsetTop+100));
  const names=await page.locator('.flavor-tabs button').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));
  for(const name of names) {
   await page.getByRole('button',{name,exact:true}).click();
   await page.waitForTimeout(80);
   const r=await page.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect();
    const c=rect('.story-copy'),n=rect('.story-navigation'),b=rect('.floating-bag-bubble'),h=rect('.header');
    return {copyTop:c.top,copyBottom:c.bottom,navTop:n.top,navBottom:n.bottom,bagTop:b.top,headerBottom:h.bottom,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert.ok(r.copyTop>=r.headerBottom-2,`${width}: details under header`);
   assert.ok(r.copyBottom<=r.navTop+1,`${width}: details overlap flavors`);
   assert.ok(r.navBottom<=r.bagTop-4,`${width}: flavors covered by bag`);
   assert.equal(r.overflow,false);
  }
  await page.screenshot({path:`artifacts/mobile-story/${width}.png`});
  console.log(`All six flavors fit at ${width}x${height}`);
  await page.close();
 }
} finally {await browser.close();}
