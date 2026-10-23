import { isSafariBrowser, shouldUseDocumentScrollMode } from "../ui/browser";
import { scrollListIntoView } from "../ui/menu";

export type AppPage = "home" | "diner-bites" | "beverages" | "our-story";

export const pageFromSearch = (search: string): AppPage => {
  const page = new URLSearchParams(search).get("page");
  return page === "diner-bites" || page === "beverages" || page === "our-story"
    ? page
    : "home";
};

export const pageHref = (page: AppPage, anchor = "") => {
  const url = new URL(window.location.href);
  if (page !== "home") url.searchParams.set("page", page);
  else url.searchParams.delete("page");
  url.hash = anchor;
  return url.href;
};

export const clickScrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth";

export const isDocumentScrollModeEnabled = () =>
  shouldUseDocumentScrollMode(
    window.location.search,
    isSafariBrowser(),
    navigator.maxTouchPoints > 0 || "ontouchstart" in window,
  );

export const scrollToPageAnchor = (animate = false) => {
  const anchor = window.location.hash.slice(1);
  const behavior = animate ? clickScrollBehavior() : "instant";
  if (!anchor || anchor === "home" || anchor === "top") {
    window.scrollTo({ top: 0, left: 0, behavior });
  } else {
    if (["drink-menu-products", "signature-drinks", "best-sellers"].includes(anchor)) {
      scrollListIntoView(document.getElementById("drink-menu-products"), behavior);
      return;
    }
    document.getElementById(anchor)?.scrollIntoView({ behavior });
  }
};
