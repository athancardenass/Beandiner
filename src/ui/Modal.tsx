import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BagModalDebugOverlay } from "../dev/DebugOverlays";
import { listen } from "../utils/events";
import { isDocumentScrollModeEnabled } from "../utils/navigation";
import { Icon } from "./graphics";

// ─── Constants ────────────────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EDITABLE_FIELD_SELECTOR =
  'input:not([type="radio"]):not([type="checkbox"]), textarea, select';
const KEYBOARD_MIN_DELTA = 120; // px the visual viewport must shrink to count as "keyboard open"
const KEYBOARD_CLOSE_DELAY = 300;
const FIELD_REVEAL_DELAY = 300;
const VIEWPORT_REFRESH_DELAYS = [100, 300];

const VIEWPORT_CSS_VARS = [
  "--modal-viewport-height",
  "--modal-layout-height",
  "--modal-viewport-top",
  "--modal-sheet-height",
  "--modal-keyboard-overlap",
  "--modal-viewport-bottom-inset",
];

type Point = { x: number; y: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isTouchDevice = () => navigator.maxTouchPoints > 0 || "ontouchstart" in window;

const isEditableField = (node: HTMLElement) => node.matches(EDITABLE_FIELD_SELECTOR);


/** Removes keyboard state classes and all viewport CSS variables from the dialog. */
function resetViewportState(el: HTMLElement) {
  el.classList.remove("is-keyboard-open", "is-ios-full-layout");
  VIEWPORT_CSS_VARS.forEach((name) => el.style.removeProperty(name));
}

/** Keeps Tab / Shift+Tab cycling inside the dialog. */
function trapTab(e: KeyboardEvent, el: HTMLElement, preventScroll = false) {
  const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (n) => n.offsetParent !== null,
  );
  if (nodes.length === 0) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const active = document.activeElement;

  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus({ preventScroll });
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus({ preventScroll });
  }
}

/** Locks background scrolling. Returns a function that restores everything. */
function lockPageScroll({
  freeze,
  isBagModal,
  scroll,
}: {
  freeze: boolean;
  isBagModal: boolean;
  scroll: Point;
}) {
  const body = document.body;
  const root = document.documentElement;
  const prevBody = {
    overflow: body.style.overflow,
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    width: body.style.width,
    overscrollBehavior: body.style.overscrollBehavior,
  };
  const prevRoot = {
    overflow: root.style.overflow,
    overscrollBehavior: root.style.overscrollBehavior,
  };

  body.style.overflow = "hidden";
  if (freeze) {
    // iOS Safari can still scroll the page behind form modals when body overflow is hidden.
    root.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `${-scroll.y}px`;
    body.style.left = `${-scroll.x}px`;
    body.style.width = "100%";
    if (isBagModal) {
      root.style.overscrollBehavior = "none";
      body.style.overscrollBehavior = "none";
      window.scrollTo(0, 0);
    }
  }

  return () => {
    body.style.overflow = prevBody.overflow;
    if (!freeze) return;
    body.style.position = prevBody.position;
    body.style.top = prevBody.top;
    body.style.left = prevBody.left;
    body.style.width = prevBody.width;
    body.style.overscrollBehavior = prevBody.overscrollBehavior;
    root.style.overflow = prevRoot.overflow;
    root.style.overscrollBehavior = prevRoot.overscrollBehavior;
    window.scrollTo(scroll.x, scroll.y);
  };
}

/** Keeps page geometry stable while the product form follows the keyboard viewport. */
function openProductDocumentDialog(
  el: HTMLDialogElement,
  root: HTMLElement,
  onClose: () => void,
) {
  const html = document.documentElement;
  const body = document.body;
  const scroll = { x: window.scrollX, y: window.scrollY };
  const previousFocus = document.activeElement as HTMLElement | null;
  const hadHtmlClass = html.classList.contains("docscroll-order-flow");
  const hadBodyClass = body.classList.contains("docscroll-order-flow");
  const previous = {
    htmlBackground: html.style.backgroundColor,
    bodyBackground: body.style.backgroundColor,
    bodyMinHeight: body.style.minHeight,
    rootBackground: root.style.backgroundColor,
    rootTop: root.style.top,
    rootLeft: root.style.left,
    rootInert: root.inert,
    dialogTop: el.style.top,
  };
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const previousThemeColor = themeColor?.getAttribute("content") ?? null;
  const surface = getComputedStyle(el).backgroundColor || "#FFFFFF";

  // End the scrollable document with the sheet, so keyboard pan cannot pass it.
  body.style.minHeight = `calc(${scroll.y}px + 100dvh)`;
  root.style.top = `${-scroll.y}px`;
  root.style.left = `${-scroll.x}px`;
  root.inert = true;
  el.style.top = `calc(${scroll.y}px + env(safe-area-inset-top, 0px))`;
  html.classList.add("docscroll-order-flow");
  body.classList.add("docscroll-order-flow");
  el.classList.add("docscroll-mode");
  html.style.backgroundColor = surface;
  body.style.backgroundColor = surface;
  root.style.backgroundColor = surface;
  themeColor?.setAttribute("content", surface);
  el.setAttribute("open", "");

  const edge = document.createElement("div");
  edge.setAttribute("data-product-backdrop-edge", "");
  edge.setAttribute("aria-hidden", "true");
  body.append(edge);

  const viewport = window.visualViewport;
  let fullViewportHeight = viewport?.height ?? window.innerHeight;
  let viewportWidth = window.innerWidth;
  let keyboardFlowStarted = false;
  let revealFrame = 0;
  let revealAfterLayout = false;

  const revealFocusedField = () => {
    const form = el.querySelector<HTMLElement>(".customize-form");
    const active = document.activeElement;
    if (
      !form || !(active instanceof HTMLElement) || !form.contains(active) ||
      form.scrollHeight <= form.clientHeight
    ) return;
    const field = active.getBoundingClientRect();
    const bounds = form.getBoundingClientRect();
    const top = bounds.top + 16;
    const bottom = bounds.bottom - 16;
    if (bottom <= top) return;
    if (field.top < top) form.scrollTop -= top - field.top;
    else if (field.bottom > bottom) form.scrollTop += field.bottom - bottom;
  };

  const updateViewportLayout = () => {
    if (!viewport) return;
    if (window.innerWidth !== viewportWidth) {
      viewportWidth = window.innerWidth;
      fullViewportHeight = Math.max(viewport.height, window.innerHeight);
    } else {
      fullViewportHeight = Math.max(fullViewportHeight, viewport.height);
    }
    const active = document.activeElement;
    const editing = active instanceof HTMLElement && el.contains(active) && isEditableField(active);
    const keyboardOpen =
      (editing || el.classList.contains("is-product-keyboard")) &&
      fullViewportHeight - viewport.height > KEYBOARD_MIN_DELTA;
    el.classList.toggle("is-product-keyboard", keyboardOpen);
    if (keyboardOpen) {
      keyboardFlowStarted = true;
      // Safari pageTop can lag native keyboard pan by several hundred milliseconds.
      el.style.top = `${window.scrollY}px`;
      el.style.setProperty("--product-keyboard-height", `${viewport.height}px`);
    } else {
      el.style.removeProperty("--product-keyboard-height");
      if (keyboardFlowStarted) {
        el.style.top = `calc(${window.scrollY}px + env(safe-area-inset-top, 0px))`;
      }
    }
  };
  const queueViewportLayout = (revealField: boolean) => {
    revealAfterLayout ||= revealField;
    if (revealFrame) return;
    revealFrame = requestAnimationFrame(() => {
      revealFrame = 0;
      updateViewportLayout();
      if (revealAfterLayout) revealFocusedField();
      revealAfterLayout = false;
    });
  };
  const removeListeners = [
    listen(document, "keydown", (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key === "Tab") {
        trapTab(event, el, true);
        return;
      }
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }, { capture: true }),
    listen(el, "focusin", () => queueViewportLayout(true)),
    listen(el, "focusout", () => queueViewportLayout(false)),
    listen(window, "resize", () => queueViewportLayout(true)),
    listen(window, "scroll", () => queueViewportLayout(false), { passive: true }),
    listen(viewport, "resize", () => queueViewportLayout(true)),
    // Viewport panning may move the sheet, but must preserve the user's form scroll.
    listen(viewport, "scroll", () => queueViewportLayout(false), { passive: true }),
  ];

  el.querySelector<HTMLElement>(".modal-close")?.focus({ preventScroll: true });

  return () => {
    removeListeners.forEach((remove) => remove());
    if (revealFrame) cancelAnimationFrame(revealFrame);
    edge.remove();
    el.removeAttribute("open");
    el.classList.remove("docscroll-mode", "is-product-keyboard");
    el.style.removeProperty("--product-keyboard-height");
    el.style.top = previous.dialogTop;
    if (!hadHtmlClass) html.classList.remove("docscroll-order-flow");
    if (!hadBodyClass) body.classList.remove("docscroll-order-flow");
    html.style.backgroundColor = previous.htmlBackground;
    body.style.backgroundColor = previous.bodyBackground;
    body.style.minHeight = previous.bodyMinHeight;
    root.style.backgroundColor = previous.rootBackground;
    root.style.top = previous.rootTop;
    root.style.left = previous.rootLeft;
    root.inert = previous.rootInert;
    if (themeColor) {
      if (previousThemeColor === null) themeColor.removeAttribute("content");
      else themeColor.setAttribute("content", previousThemeColor);
    }
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    window.scrollTo(scroll.x, scroll.y);
  };
}

// ─── Modal ────────────────────────────────────────────────────────────────────

// ↓ MODAL COMPONENT: Base dialog with backdrop, focus trap, Esc-to-close, and return focus
export function Modal({
  children,
  onClose,
  label,
  className = "",
  documentScrollPosition = null,
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  className?: string;
  documentScrollPosition?: Point | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const docScrollPositionRef = useRef<Point | null>(documentScrollPosition);
  onCloseRef.current = onClose;

  const modalClasses = className.split(/\s+/);
  const isBagModal = modalClasses.includes("bag-modal");
  const isSafariProductModal =
    modalClasses.includes("product-modal") &&
    !modalClasses.includes("bite-customize-modal") &&
    document.documentElement.dataset.browserFamily === "safari" &&
    isTouchDevice();
  const docScrollMode =
    (isBagModal || isSafariProductModal) && isDocumentScrollModeEnabled();
  const showBagDebug =
    import.meta.env.DEV &&
    isBagModal &&
    new URLSearchParams(window.location.search).get("debug") === "1";

  // ── Mode A: document-scroll mode (dialog is shown as a normal page flow) ────
  useLayoutEffect(() => {
    const el = ref.current;
    const root = document.getElementById("root");
    if (!el || !docScrollMode || !root) return;
    if (isSafariProductModal) {
      return openProductDocumentDialog(el, root, () => onCloseRef.current());
    }

    const html = document.documentElement;
    const body = document.body;
    const previousFocus = document.activeElement as HTMLElement | null;

    if (!docScrollPositionRef.current) {
      docScrollPositionRef.current = documentScrollPosition ?? {
        x: window.scrollX,
        y: window.scrollY,
      };
    }
    const { x: pageScrollX, y: pageScrollY } = docScrollPositionRef.current;

    const hadHtmlClass = html.classList.contains("docscroll-order-flow");
    const hadBodyClass = body.classList.contains("docscroll-order-flow");
    const prev = {
      html: html.style.backgroundColor,
      body: body.style.backgroundColor,
      root: root.style.backgroundColor,
      rootDisplay: root.style.display,
    };
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousThemeColor = themeColor?.getAttribute("content") ?? null;
    const sheetSurface = getComputedStyle(el).backgroundColor || "#FFFFFF";

    el.classList.add("docscroll-mode");
    html.classList.add("docscroll-order-flow");
    body.classList.add("docscroll-order-flow");
    html.style.backgroundColor = sheetSurface;
    body.style.backgroundColor = sheetSurface;
    root.style.backgroundColor = sheetSurface;
    root.style.display = "none";
    themeColor?.setAttribute("content", sheetSurface);
    el.setAttribute("open", "");
    window.scrollTo(0, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      el.removeAttribute("open");
      el.classList.remove("docscroll-mode");
      if (!hadHtmlClass) html.classList.remove("docscroll-order-flow");
      if (!hadBodyClass) body.classList.remove("docscroll-order-flow");
      html.style.backgroundColor = prev.html;
      body.style.backgroundColor = prev.body;
      root.style.backgroundColor = prev.root;
      root.style.display = prev.rootDisplay;
      if (themeColor) {
        if (previousThemeColor === null) themeColor.removeAttribute("content");
        else themeColor.setAttribute("content", previousThemeColor);
      }
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      window.scrollTo(pageScrollX, pageScrollY);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Run only when docScrollMode changes; read the initial scroll position through a ref.
  }, [docScrollMode]);

  // ── Mode B: native <dialog> modal (focus trap, keyboard-aware viewport) ─────
  useEffect(() => {
    const el = ref.current;
    if (!el || docScrollMode) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const isBag = el.matches(".bag-modal");
    const isTopSixProduct = el.matches(".product-modal:not(.bite-customize-modal)");
    const isFormModal = isBag || isTopSixProduct;
    const touch = isTouchDevice();
    const isIOSSafariBag =
      isBag && document.documentElement.dataset.browserFamily === "safari" && touch;
    const shouldFreezePage = isFormModal && touch;
    const pageScroll: Point = { x: window.scrollX, y: window.scrollY };

    const viewport = isFormModal ? window.visualViewport : null;
    let maxViewportHeight = viewport?.height ?? 0;
    let orientation = window.innerWidth >= window.innerHeight ? "landscape" : "portrait";

    // Hidden probe that reports the real (large) layout viewport height on iOS Safari.
    const layoutProbe = isIOSSafariBag ? document.createElement("div") : null;
    if (layoutProbe) {
      layoutProbe.setAttribute("aria-hidden", "true");
      layoutProbe.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none;z-index:-1";
      document.body.append(layoutProbe);
    }
    const probeHeight = () => layoutProbe?.getBoundingClientRect().height ?? 0;

    let revealFrame = 0;
    let pagePanFrame = 0;
    let keyboardCloseTimer: number | null = null;
    let fieldRevealTimer: number | null = null;
    let refreshTimers: number[] = [];

    const clearTimer = (timer: number | null) => {
      if (timer !== null) window.clearTimeout(timer);
    };

    // ── Keep the focused field visible above the keyboard ──
    const revealFocusedField = () => {
      if (!viewport || !el.classList.contains("is-keyboard-open")) return;
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !el.contains(active)) return;
      if (isBag && !isEditableField(active)) return;

      const scrollable = isBag ? el.querySelector<HTMLElement>(".bag-content") ?? el : el;
      const fieldRect = active.getBoundingClientRect();
      const modalRect = el.getBoundingClientRect();
      const viewportBottom = viewport.offsetTop + viewport.height;

      let visibleTop = Math.max(viewport.offsetTop, modalRect.top);
      let visibleBottom = Math.min(viewportBottom, modalRect.bottom);
      if (isBag) {
        const scrollableRect = scrollable.getBoundingClientRect();
        visibleTop = Math.max(visibleTop, scrollableRect.top);
        visibleBottom = Math.min(visibleBottom, scrollableRect.bottom);
      }
      visibleTop += 16;
      visibleBottom -= isBag ? 12 : 16;

      if (fieldRect.top < visibleTop) {
        scrollable.scrollTop -= visibleTop - fieldRect.top;
      } else if (fieldRect.bottom > visibleBottom) {
        scrollable.scrollTop += fieldRect.bottom - visibleBottom;
      }
    };

    const queueReveal = () => {
      if (revealFrame) return;
      revealFrame = window.requestAnimationFrame(() => {
        revealFrame = 0;
        revealFocusedField();
      });
    };

    const queueBagFieldReveal = () => {
      clearTimer(fieldRevealTimer);
      fieldRevealTimer = null;
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !el.contains(active) || !isEditableField(active)) {
        return;
      }
      fieldRevealTimer = window.setTimeout(() => {
        fieldRevealTimer = null;
        revealFocusedField();
      }, FIELD_REVEAL_DELAY);
    };

    // ── Viewport sizing: bag modal ──
    const updateBagViewport = () => {
      if (!viewport) return;
      const { height, offsetTop } = viewport;

      const nextOrientation = window.innerWidth >= window.innerHeight ? "landscape" : "portrait";
      if (nextOrientation !== orientation) {
        orientation = nextOrientation;
        maxViewportHeight = 0;
      }
      maxViewportHeight = Math.max(
        maxViewportHeight,
        height,
        window.innerHeight,
        document.documentElement.clientHeight,
        probeHeight(),
      );

      const keyboardOpen = height < maxViewportHeight - KEYBOARD_MIN_DELTA;
      if (!keyboardOpen) {
        if (!el.classList.contains("is-keyboard-open")) {
          resetViewportState(el);
          return;
        }
        // Debounce closing so brief resize flickers don't collapse the layout.
        if (keyboardCloseTimer === null) {
          keyboardCloseTimer = window.setTimeout(() => {
            keyboardCloseTimer = null;
            if (viewport.height >= maxViewportHeight - KEYBOARD_MIN_DELTA) resetViewportState(el);
          }, KEYBOARD_CLOSE_DELAY);
        }
        return;
      }

      clearTimer(keyboardCloseTimer);
      keyboardCloseTimer = null;

      if (isIOSSafariBag) {
        const layoutHeight = Math.max(
          window.innerHeight,
          document.documentElement.clientHeight,
          maxViewportHeight,
          probeHeight(),
        );
        el.classList.add("is-ios-full-layout");
        el.style.setProperty("--modal-layout-height", `${Math.floor(layoutHeight)}px`);
        el.style.setProperty("--modal-viewport-height", `${Math.max(0, Math.floor(height))}px`);
        el.style.setProperty("--modal-viewport-top", `${Math.round(offsetTop)}px`);
        el.style.setProperty("--modal-sheet-height", `${Math.floor(layoutHeight)}px`);
        el.style.setProperty(
          "--modal-keyboard-overlap",
          `${Math.max(0, Math.ceil(layoutHeight - height - offsetTop))}px`,
        );
      } else {
        const dialogTop = Math.round(offsetTop);
        const dialogHeight = Math.max(0, Math.floor(height));
        el.style.setProperty("--modal-viewport-height", `${dialogHeight}px`);
        el.style.setProperty("--modal-viewport-top", `${dialogTop}px`);
        el.style.setProperty("--modal-sheet-height", `${dialogHeight}px`);
        el.style.setProperty(
          "--modal-keyboard-overlap",
          `${Math.max(0, Math.ceil(dialogTop + dialogHeight - offsetTop - height))}px`,
        );
      }
      el.style.removeProperty("--modal-viewport-bottom-inset");
      el.classList.add("is-keyboard-open");
    };

    // ── Viewport sizing: top-six product modal ──
    const updateProductViewport = () => {
      if (!viewport) return;
      if (viewport.height >= window.innerHeight - KEYBOARD_MIN_DELTA) {
        resetViewportState(el);
        return;
      }
      const viewportBottom = viewport.offsetTop + viewport.height;
      el.style.setProperty(
        "--modal-viewport-height",
        `${Math.max(0, Math.floor(viewport.height) - 1)}px`,
      );
      el.style.setProperty(
        "--modal-viewport-bottom-inset",
        `${Math.max(0, Math.ceil(window.innerHeight - viewportBottom))}px`,
      );
      el.classList.add("is-keyboard-open");
      queueReveal();
    };

    const updateViewport = isBag ? updateBagViewport : updateProductViewport;

    // ── Bag-only: stop the page behind from panning, refresh after focus changes ──
    const handleBagPagePan = () => {
      if (!shouldFreezePage || pagePanFrame || (window.scrollX === 0 && window.scrollY === 0)) {
        return;
      }
      pagePanFrame = window.requestAnimationFrame(() => {
        pagePanFrame = 0;
        if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
        updateBagViewport();
        queueBagFieldReveal();
      });
    };

    const handleBagViewportChange = () => {
      updateBagViewport();
      handleBagPagePan();
      queueBagFieldReveal();
    };

    const handleBagFocusIn = () => {
      clearTimer(keyboardCloseTimer);
      keyboardCloseTimer = null;

      // The keyboard animates in; re-measure a few times while it settles.
      refreshTimers.forEach(window.clearTimeout);
      refreshTimers = [];
      updateBagViewport();
      for (const delay of VIEWPORT_REFRESH_DELAYS) {
        const timer = window.setTimeout(() => {
          refreshTimers = refreshTimers.filter((t) => t !== timer);
          updateBagViewport();
        }, delay);
        refreshTimers.push(timer);
      }
      queueBagFieldReveal();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === "Tab") {
        trapTab(e, el);
      }
    };

    // ── Setup ──
    if (!el.open) {
      try {
        el.showModal();
      } catch {
        /* Dialog already open */
      }
    }
    const unlockPage = lockPageScroll({
      freeze: shouldFreezePage,
      isBagModal: isBag,
      scroll: pageScroll,
    });
    updateViewport();

    const removers: Array<() => void> = [
      listen(el, "keydown", handleKeyDown as EventListener),
      listen(window, "resize", isBag ? handleBagViewportChange : updateViewport),
      listen(viewport, "resize", isBag ? handleBagViewportChange : updateViewport),
    ];
    if (isTopSixProduct) {
      removers.push(listen(viewport, "scroll", updateProductViewport));
      removers.push(listen(el, "focusin", queueReveal));
    }
    if (isBag) {
      removers.push(listen(viewport, "scroll", handleBagViewportChange));
      removers.push(listen(window, "scroll", handleBagViewportChange, { passive: true }));
      removers.push(listen(el, "focusin", handleBagFocusIn));
    }

    // ── Teardown ──
    return () => {
      removers.forEach((remove) => remove());
      if (revealFrame) window.cancelAnimationFrame(revealFrame);
      if (pagePanFrame) window.cancelAnimationFrame(pagePanFrame);
      refreshTimers.forEach(window.clearTimeout);
      clearTimer(keyboardCloseTimer);
      clearTimer(fieldRevealTimer);
      layoutProbe?.remove();
      resetViewportState(el);
      if (el.open) el.close();
      unlockPage();
      if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus({ preventScroll: true });
    };
  }, [docScrollMode]);

  const dialog = (
    <dialog
      ref={ref}
      aria-label={label}
      aria-modal={docScrollMode && !isSafariProductModal ? undefined : "true"}
      className={`modal ${className}${docScrollMode ? " docscroll-mode" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">
          <Icon name="close" />
        </button>
        {children}
      </div>
      {showBagDebug && <BagModalDebugOverlay />}
    </dialog>
  );

  return docScrollMode ? createPortal(dialog, document.body) : dialog;
}
