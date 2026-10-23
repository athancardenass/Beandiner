import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyToClipboard } from '../src/utils/clipboard.ts';

function clipboardEnvironment(t, { sync = false, asyncCopy, dialog = true } = {}) {
  const events = [];
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  t.after(() => {
    for (const [name, descriptor] of [['document', originalDocument], ['navigator', originalNavigator]]) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const container = name => ({
    appendChild: () => events.push(`append:${name}`),
    removeChild: () => events.push(`remove:${name}`),
  });
  const modal = container('dialog');
  const body = container('body');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    body,
    querySelector: selector => { assert.equal(selector, 'dialog[open]'); return dialog ? modal : null; },
    createElement: tag => {
      assert.equal(tag, 'textarea');
      return {
        style: {}, setAttribute() {},
        focus: () => events.push('focus'),
        select: () => events.push('select'),
        setSelectionRange: () => events.push('range'),
      };
    },
    execCommand: command => {
      assert.equal(command, 'copy');
      events.push('exec');
      if (sync instanceof Error) throw sync;
      return sync;
    },
  } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    clipboard: asyncCopy ? { writeText: text => { events.push('async'); return asyncCopy(text); } } : undefined,
  } });
  return events;
}

for (const sync of [false, true]) {
  for (const asyncSuccess of [false, true]) {
    test(`sync=${sync}, clipboard=${asyncSuccess}: return either successful result`, async t => {
      const events = clipboardEnvironment(t, { sync, asyncCopy: async text => {
        assert.equal(text, 'Order request');
        if (!asyncSuccess) throw new Error('Permission denied');
      } });
      assert.equal(await copyToClipboard('Order request'), sync || asyncSuccess);
      assert.deepEqual(events, ['append:dialog', 'focus', 'select', 'range', 'exec', 'remove:dialog', 'async']);
    });
  }
}

test('synchronous attempt runs before returning the promise; await clipboard resolution', async t => {
  let resolveCopy;
  const deferred = new Promise(resolve => { resolveCopy = resolve; });
  const events = clipboardEnvironment(t, { asyncCopy: () => deferred });
  let settled = false;
  const result = copyToClipboard('Order request').then(value => { settled = true; return value; });
  assert.ok(events.includes('exec'));
  await Promise.resolve();
  assert.equal(settled, false);
  resolveCopy();
  assert.equal(await result, true);
});

test('without a dialog or modern clipboard, use synchronous body fallback', async t => {
  const events = clipboardEnvironment(t, { sync: true, dialog: false });
  assert.equal(await copyToClipboard('Order request'), true);
  assert.equal(events[0], 'append:body');
});

test('a throwing execCommand still allows modern clipboard success', async t => {
  clipboardEnvironment(t, { sync: new Error('Unsupported'), asyncCopy: async () => {} });
  assert.equal(await copyToClipboard('Order request'), true);
});

test('unavailable clipboard and failed synchronous attempt return false', async t => {
  clipboardEnvironment(t);
  assert.equal(await copyToClipboard('Order request'), false);
});

test('empty input returns false without touching either clipboard path', async t => {
  const events = clipboardEnvironment(t);
  assert.equal(await copyToClipboard(''), false);
  assert.deepEqual(events, []);
});
