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
