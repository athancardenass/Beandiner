import type { MouseEvent } from "react";

// Footer Messenger contact destination.
const MESSENGER_PAGE_ID = "100959311683531";

// Meta short link supports Messenger app handoff and a web fallback.
export const getMessengerUrl = () =>
  `https://m.me/${MESSENGER_PAGE_ID}`;

let cancelMessengerHandoff: (() => void) | undefined;

export const openMessengerOnMobile = (event: MouseEvent<HTMLAnchorElement>) => {
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  if (!mobile || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  cancelMessengerHandoff?.();
  const webUrl = event.currentTarget.href;
  const cleanup = () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", cleanup);
    cancelMessengerHandoff = undefined;
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") cleanup();
  };
  const timer = window.setTimeout(() => {
    cleanup();
    if (document.visibilityState === "visible") window.location.assign(webUrl);
  }, 2500);
  cancelMessengerHandoff = cleanup;
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", cleanup);
  // Launch synchronously during the tap so the browser retains user activation.
  window.location.assign(`fb-messenger://user-thread/${MESSENGER_PAGE_ID}`);
};

export const FACEBOOK_PAGE_URL = "https://www.facebook.com/beandiner";
