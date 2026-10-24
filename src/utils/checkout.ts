export const PENDING_ORDER_KEY = "beandiner-pending-order-v1";
export const PENDING_ORDER_TTL_MS = 2 * 60 * 60 * 1000;

export type PendingOrder = { message: string; createdAt: number };

export function isPendingOrder(value: unknown, now = Date.now()): value is PendingOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<PendingOrder>;
  return typeof order.message === "string" && order.message.trim().length > 0 &&
    typeof order.createdAt === "number" && Number.isFinite(order.createdAt) &&
    order.createdAt <= now && now - order.createdAt < PENDING_ORDER_TTL_MS;
}

export function readPendingOrder(): PendingOrder | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(PENDING_ORDER_KEY) || "null");
    if (isPendingOrder(value)) return value;
    sessionStorage.removeItem(PENDING_ORDER_KEY);
  } catch {
    // Storage can be unavailable; the current page still keeps its summary in memory.
  }
  return null;
}

export function writePendingOrder(order: PendingOrder | null): boolean {
  try {
    if (order) sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order));
    else sessionStorage.removeItem(PENDING_ORDER_KEY);
    return true;
  } catch {
    return false;
  }
}

function manilaMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

const opens = 10 * 60;
const closes = 21 * 60;

export function getStoreStatus(now = new Date()) {
  const minute = manilaMinutes(now);
  const isOpen = minute >= opens && minute < closes;
  return {
    isOpen,
    text: isOpen ? "Open Now · Closes 9:00 PM" : "Closed Now · Opens 10:00 AM",
  };
}

export const ASAP_TIMING_LABEL = "ASAP (~15-20 mins)";
export const CUSTOM_TIMING_LABEL = "Custom time";
export const ORDER_TIMING_OPTIONS = [
  { label: ASAP_TIMING_LABEL, offset: 20 },
  { label: "In 30 mins", offset: 30 },
  { label: "In 1 hour", offset: 60 },
  { label: CUSTOM_TIMING_LABEL, offset: null },
];

export function validateOrderTiming(option: string, custom: string, now = new Date()): string | null {
  const current = manilaMinutes(now);
  if (option === CUSTOM_TIMING_LABEL) {
    if (!custom.trim()) return "Please specify your preferred time";
    const match = custom.trim().match(/^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?$/i);
    if (!match) return "Enter a time such as 2:45 PM or 14:45.";
    let hour = Number(match[1]);
    const period = match[3]?.toLowerCase();
    if (period ? hour < 1 || hour > 12 : hour > 23) {
      return "Enter a time such as 2:45 PM or 14:45.";
    }
    if (period) hour = hour % 12 + (period === "pm" ? 12 : 0);
    const requested = hour * 60 + Number(match[2] ?? 0);
    if (requested < opens || requested >= closes) {
      return "Please choose a time from 10:00 AM to before 9:00 PM.";
    }
    if (current >= closes) return "The diner is closed for today. Please return after 10:00 AM.";
    if (requested <= current) return "Please choose a time later today.";
    return null;
  }
  const offset = ORDER_TIMING_OPTIONS.find((timing) => timing.label === option)?.offset ?? null;
  if (offset === null) return "Please select a preferred time.";
  if (current < opens || current >= closes) {
    return "The diner is closed. Please choose a custom time during opening hours.";
  }
  if (current + offset >= closes) return "Please choose a time before 9:00 PM.";
  return null;
}
