import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

test('literal storefront media and ingredient references point to existing public assets', () => {
  const files = readdirSync('src', { recursive: true }).filter(file => /\.(tsx?|css)$/.test(file)).map(file => join('src', file));
  files.push('index.html');
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/["'`](\.\/(?:images|videos)\/[^"'`$]+)["'`]/g)) {
      assert.ok(existsSync(join('public', match[1].slice(2))), `${file}: missing ${match[1]}`);
    }
    for (const match of source.matchAll(/<Ingredient\s+kind="([^"]+)"/g)) {
      const name = match[1] === 'hot' ? 'hotroast' : match[1];
      assert.ok(existsSync(`public/images/optimized/${name}.webp`), `${file}: missing ingredient ${name}`);
    }
  }
});

test('the preloaded image is the existing video poster', () => {
  const html = readFileSync('index.html', 'utf8');
  const app = readFileSync('src/App.tsx', 'utf8');
  const poster = app.match(/poster="([^"]+)"/)[1];
  assert.ok(html.includes(`as="image" href="${poster}"`));
});

test('responsive videos are bounded, start with metadata, and preserve the original', () => {
  assert.ok(existsSync('public/videos/bean-diner-hero-4k30.mp4'));
  const app = readFileSync('src/App.tsx', 'utf8');
  for (const [name, maxMB] of [['mobile-720', 5], ['desktop-1080', 10]]) {
    const file = `public/videos/bean-diner-hero-${name}.mp4`;
    assert.ok(statSync(file).size < maxMB * 1024 * 1024, `${file} exceeds ${maxMB} MB`);
    assert.ok(app.includes(`./videos/bean-diner-hero-${name}.mp4`));
    const bytes = readFileSync(file);
    const boxes = [];
    for (let offset = 0; offset + 8 <= bytes.length;) {
      const size = bytes.readUInt32BE(offset);
      assert.ok(size >= 8 && offset + size <= bytes.length, `${file}: invalid MP4 box`);
      boxes.push(bytes.toString('ascii', offset + 4, offset + 8));
      offset += size;
    }
    assert.ok(boxes.includes('moov') && boxes.includes('mdat'));
    assert.ok(boxes.indexOf('moov') < boxes.indexOf('mdat'), `${file}: metadata must precede media for progressive playback`);
  }
});
