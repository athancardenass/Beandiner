import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getStoreStatus,
  isPendingOrder,
  readPendingOrder,
  writePendingOrder,
  PENDING_ORDER_KEY,
  PENDING_ORDER_TTL_MS,
  validateOrderTiming,
} from '../src/utils/checkout.ts';
import { shouldUseDocumentScrollMode } from '../src/ui/browser.ts';
import { getWhatsAppUrl, withOrderRequestStatus, WHATSAPP_NUMBER, WHATSAPP_URL_LIMIT } from '../src/utils/whatsapp.ts';

test('WhatsApp inquiries and web fallback use the same international number', () => {
  assert.equal(WHATSAPP_NUMBER, '639635913031');
  assert.equal(getWhatsAppUrl(), `https://wa.me/${WHATSAPP_NUMBER}`);
  assert.equal(new URL(getWhatsAppUrl('', true)).searchParams.get('phone'), WHATSAPP_NUMBER);
});

test('WhatsApp preserves the entire order text, special characters, emoji and line breaks', () => {
  const message = withOrderRequestStatus('Order #1: 50% + syrup & ice\nNote: "less sweet" 🍵\nSecond line');
  for (const web of [false, true]) {
    const link = getWhatsAppUrl(message, web);
    assert.ok(link.includes(`text=${encodeURIComponent(message)}`));
    assert.equal(new URL(link).searchParams.get('text'), message);
  }
  assert.ok(message.endsWith('Order request, awaiting confirmation.'));
  assert.equal(withOrderRequestStatus(message), message, 'Recovered summaries must not duplicate the request status');
});

test('WhatsApp length limit applies to encoded URLs rather than raw message length', () => {
  assert.equal(WHATSAPP_URL_LIMIT, 2000);
  const message = '🍵'.repeat(180);
  assert.ok(message.length < WHATSAPP_URL_LIMIT);
  assert.ok(getWhatsAppUrl(message).length > WHATSAPP_URL_LIMIT);
});

test('document-scroll order flow defaults on touch Safari with explicit comparison overrides', () => {
  assert.equal(shouldUseDocumentScrollMode('', true, true), true);
  assert.equal(shouldUseDocumentScrollMode('', true, false), false);
  assert.equal(shouldUseDocumentScrollMode('', false, true), false);
  assert.equal(shouldUseDocumentScrollMode('?docscroll=1', false, false), true);
  assert.equal(shouldUseDocumentScrollMode('?docscroll=0', true, true), false);
});

const at = (time) => new Date(`2026-10-19T${time}:00+08:00`);

test('store status uses Manila time, including opening and closing boundaries', () => {
  assert.equal(getStoreStatus(at('09:59')).isOpen, false);
  assert.equal(getStoreStatus(at('10:00')).isOpen, true);
  assert.equal(getStoreStatus(at('20:59')).isOpen, true);
  assert.equal(getStoreStatus(at('21:00')).isOpen, false);
});

test('ASAP is unavailable while closed and available while open', () => {
  assert.ok(validateOrderTiming('ASAP (~15-20 mins)', '', at('09:00')));
  assert.equal(validateOrderTiming('ASAP (~15-20 mins)', '', at('12:00')), null);
  assert.ok(validateOrderTiming('ASAP (~15-20 mins)', '', at('21:00')));
});

test('relative timings cannot run into closing time', () => {
  assert.equal(validateOrderTiming('ASAP (~15-20 mins)', '', at('20:39')), null);
  assert.ok(validateOrderTiming('ASAP (~15-20 mins)', '', at('20:40')));
  assert.equal(validateOrderTiming('In 30 mins', '', at('20:29')), null);
  assert.ok(validateOrderTiming('In 30 mins', '', at('20:30')));
  assert.equal(validateOrderTiming('In 1 hour', '', at('19:59')), null);
  assert.ok(validateOrderTiming('In 1 hour', '', at('20:00')));
  assert.ok(validateOrderTiming('In 30 mins', '', at('09:00')));
});

test('custom timing accepts client placeholder formats and 24-hour times', () => {
  for (const time of ['2:45 PM', '5:30 PM', '14:45', '2 pm', ' 10:00 AM ']) {
    assert.equal(validateOrderTiming('Custom time', time, at('09:00')), null, time);
  }
});

test('custom timing rejects empty, impossible, and unparseable input', () => {
  for (const time of ['', 'tomorrow', '25:00', '12:60 PM', '0:30 PM', '13 PM', '2.45 PM']) {
    assert.ok(validateOrderTiming('Custom time', time, at('09:00')), time);
  }
});

test('custom timing rejects times outside the published hours', () => {
  for (const time of ['9:59 AM', '9:00 PM', '23:30', '12 AM', '00:00']) {
    assert.ok(validateOrderTiming('Custom time', time, at('09:00')), time);
  }
});

test('custom timing must be later today and supports noon correctly', () => {
  assert.ok(validateOrderTiming('Custom time', '2:45 PM', at('14:45')));
  assert.ok(validateOrderTiming('Custom time', '2:45 PM', at('15:00')));
  assert.equal(validateOrderTiming('Custom time', '12 PM', at('11:00')), null);
  assert.equal(validateOrderTiming('Custom time', '8:59 PM', at('20:58')), null);
  assert.ok(validateOrderTiming('Custom time', '10 AM', at('22:00')));
  assert.ok(validateOrderTiming('Unknown option', '', at('12:00')));
});

test('saved summaries expire without extending their original lifetime', () => {
  const createdAt = at('12:00').getTime();
  const pending = { message: 'Order summary', createdAt };
  assert.equal(isPendingOrder(pending, createdAt + 1), true);
  assert.equal(isPendingOrder(pending, createdAt + PENDING_ORDER_TTL_MS - 1), true);
  assert.equal(isPendingOrder(pending, createdAt + PENDING_ORDER_TTL_MS), false);
  assert.equal(isPendingOrder(pending, createdAt - 1), false);
});

test('malformed saved data is rejected', () => {
  for (const value of [null, [], '', {}, { message: '', createdAt: Date.now() },
    { message: 'x', createdAt: 'today' }, { message: 'x', createdAt: Infinity }]) {
    assert.equal(isPendingOrder(value), false);
  }
});

test('pending summary survives rereading, clears explicitly, and removes stale data', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const values = new Map();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  } });
  try {
    const pending = { message: 'Summary with customer details', createdAt: Date.now() };
    assert.equal(writePendingOrder(pending), true);
    assert.deepEqual(readPendingOrder(), pending);
    assert.deepEqual(readPendingOrder(), pending);
    writePendingOrder(null);
    assert.equal(readPendingOrder(), null);
    values.set(PENDING_ORDER_KEY, '{broken json');
    assert.equal(readPendingOrder(), null);
    values.set(PENDING_ORDER_KEY, JSON.stringify({ ...pending, createdAt: Date.now() - PENDING_ORDER_TTL_MS }));
    assert.equal(readPendingOrder(), null);
    assert.equal(values.has(PENDING_ORDER_KEY), false);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'sessionStorage', descriptor);
    else delete globalThis.sessionStorage;
  }
});

test('blocked storage leaves the current session functional', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
  try {
    assert.equal(readPendingOrder(), null);
    assert.equal(writePendingOrder({ message: 'Summary', createdAt: Date.now() }), false);
    assert.equal(writePendingOrder(null), false);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'sessionStorage', descriptor);
    else delete globalThis.sessionStorage;
  }
});
