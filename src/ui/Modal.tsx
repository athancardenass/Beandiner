import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BagModalDebugOverlay } from "../dev/DebugOverlays";
import { isDocumentScrollModeEnabled } from "../utils/navigation";
import { Icon } from "./graphics";

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
  documentScrollPosition?: { x: number; y: number } | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const docScrollPositionRef = useRef<{ x: number; y: number } | null>(documentScrollPosition);
  onCloseRef.current = onClose;
  const isBagModal = className.split(/\s+/).includes("bag-modal");
  const docScrollMode = isBagModal && isDocumentScrollModeEnabled();
  const showBagDebug = import.meta.env.DEV && isBagModal && new URLSearchParams(window.location.search).get("debug") === "1";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !docScrollMode) return;

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    if (!root) return;

    const previous = document.activeElement as HTMLElement | null;
    if (!docScrollPositionRef.current) {
      docScrollPositionRef.current = documentScrollPosition ?? { x: window.scrollX, y: window.scrollY };
    }
    const { x: pageScrollX, y: pageScrollY } = docScrollPositionRef.current;
    const hadHtmlClass = html.classList.contains("docscroll-order-flow");
    const hadBodyClass = body.classList.contains("docscroll-order-flow");
    const previousHtmlBackground = html.style.backgroundColor;
    const previousBodyBackground = body.style.backgroundColor;
    const previousRootBackground = root.style.backgroundColor;
    const previousRootDisplay = root.style.display;
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
    if (themeColor) themeColor.setAttribute("content", sheetSurface);
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
      html.style.backgroundColor = previousHtmlBackground;
      body.style.backgroundColor = previousBodyBackground;
      root.style.backgroundColor = previousRootBackground;
      root.style.display = previousRootDisplay;
      if (themeColor) {
        if (previousThemeColor === null) themeColor.removeAttribute("content");
        else themeColor.setAttribute("content", previousThemeColor);
      }
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      window.scrollTo(pageScrollX, pageScrollY);
    };
  }, [docScrollMode]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (docScrollMode) return;
    const previous = document.activeElement as HTMLElement | null;
    const isBagModal = el.matches(".bag-modal");
    const isTopSixProductModal = el.matches(".product-modal:not(.bite-customize-modal)");
    const isIOSSafariBagModal = isBagModal && document.documentElement.dataset.browserFamily === "safari" &&
      (navigator.maxTouchPoints > 0 || "ontouchstart" in window);
    const shouldFreezePageBackground = (isBagModal || isTopSixProductModal) &&
      (navigator.maxTouchPoints > 0 || "ontouchstart" in window);
    const pageScrollX = window.scrollX;
    const pageScrollY = window.scrollY;
    const viewport = (isBagModal || isTopSixProductModal) ? window.visualViewport : null;
    let maxViewportHeight = viewport?.height ?? 0;
    let viewportOrientation = window.innerWidth >= window.innerHeight ? "landscape" : "portrait";
    const layoutViewportProbe = isIOSSafariBagModal ? document.createElement("div") : null;
    if (layoutViewportProbe) {
      layoutViewportProbe.setAttribute("aria-hidden", "true");
      layoutViewportProbe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none;z-index:-1";
      document.body.append(layoutViewportProbe);
    }
    let revealFocusedFieldFrame = 0;
    let bagPagePanFrame = 0;
    let bagViewportRefreshTimers: number[] = [];
    let bagKeyboardCloseTimer: number | null = null;
    let bagFieldRevealTimer: number | null = null;
    const clearFormModalViewport = () => {
      el.classList.remove("is-keyboard-open");
      el.classList.remove("is-ios-full-layout");
      el.style.removeProperty("--modal-viewport-height");
      if (isBagModal) el.style.removeProperty("--modal-layout-height");
      if (isBagModal) el.style.removeProperty("--modal-viewport-top");
      if (isBagModal) el.style.removeProperty("--modal-sheet-height");
      if (isBagModal) el.style.removeProperty("--modal-keyboard-overlap");
      el.style.removeProperty("--modal-viewport-bottom-inset");
    };
    const isEditableBagField = (active: HTMLElement) =>
      active.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, select');
    const revealFocusedProductField = () => {
      if ((!isBagModal && !isTopSixProductModal) || !el.classList.contains("is-keyboard-open") || !viewport) return;
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !el.contains(active)) return;
      if (isBagModal && !isEditableBagField(active)) return;

      const scrollable = isBagModal ? el.querySelector<HTMLElement>(".bag-content") ?? el : el;
      const fieldRect = active.getBoundingClientRect();
      const modalRect = el.getBoundingClientRect();
      const scrollableRect = scrollable.getBoundingClientRect();
      const visibleTop = isBagModal
        ? Math.max(viewport.offsetTop, modalRect.top, scrollableRect.top) + 16
        : Math.max(viewport.offsetTop, modalRect.top) + 16;
      const bottomPadding = isBagModal ? 12 : 16;
      const visibleBottom = isBagModal
        ? Math.min(viewport.offsetTop + viewport.height, modalRect.bottom, scrollableRect.bottom) - bottomPadding
        : Math.min(viewport.offsetTop + viewport.height, modalRect.bottom) - bottomPadding;
      if (fieldRect.top < visibleTop) {
        scrollable.scrollTop -= visibleTop - fieldRect.top;
      } else if (fieldRect.bottom > visibleBottom) {
        scrollable.scrollTop += fieldRect.bottom - visibleBottom;
      }
    };
    const queueRevealFocusedProductField = () => {
      if ((!isBagModal && !isTopSixProductModal) || revealFocusedFieldFrame) return;
      revealFocusedFieldFrame = window.requestAnimationFrame(() => {
        revealFocusedFieldFrame = 0;
        revealFocusedProductField();
      });
    };
    const queueBagFocusedFieldReveal = () => {
      if (!isBagModal) return;
      if (bagFieldRevealTimer !== null) {
        window.clearTimeout(bagFieldRevealTimer);
        bagFieldRevealTimer = null;
      }
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !el.contains(active) || !isEditableBagField(active)) return;
      bagFieldRevealTimer = window.setTimeout(() => {
        bagFieldRevealTimer = null;
        revealFocusedProductField();
      }, 300);
    };
    const updateFormModalViewport = () => {
      if ((!isBagModal && !isTopSixProductModal) || !viewport) return;
      const viewportHeight = isBagModal ? viewport.height : 0;
      const viewportTop = isBagModal ? viewport.offsetTop : 0;
      if (isBagModal) {
        const nextOrientation = window.innerWidth >= window.innerHeight ? "landscape" : "portrait";
        if (nextOrientation !== viewportOrientation) {
          viewportOrientation = nextOrientation;
          maxViewportHeight = 0;
        }
        maxViewportHeight = Math.max(
          maxViewportHeight,
          viewportHeight,
          window.innerHeight,
          document.documentElement.clientHeight,
          layoutViewportProbe?.getBoundingClientRect().height ?? 0,
        );
      }
      const keyboardOpen = isBagModal
        ? viewportHeight < maxViewportHeight - 120
        : viewport.height < window.innerHeight - 120;
      if (!keyboardOpen) {
        if (isBagModal && el.classList.contains("is-keyboard-open")) {
          if (bagKeyboardCloseTimer === null) {
            bagKeyboardCloseTimer = window.setTimeout(() => {
              bagKeyboardCloseTimer = null;
              if (viewport.height >= maxViewportHeight - 120) clearFormModalViewport();
            }, 300);
          }
          return;
        }
        clearFormModalViewport();
        return;
      }

      if (bagKeyboardCloseTimer !== null) {
        window.clearTimeout(bagKeyboardCloseTimer);
        bagKeyboardCloseTimer = null;
      }
      if (isBagModal) {
        if (isIOSSafariBagModal) {
          const layoutHeight = Math.max(
            window.innerHeight,
            document.documentElement.clientHeight,
            maxViewportHeight,
            layoutViewportProbe?.getBoundingClientRect().height ?? 0,
          );
          el.classList.add("is-ios-full-layout");
          el.style.setProperty("--modal-layout-height", `${Math.floor(layoutHeight)}px`);
          el.style.setProperty("--modal-viewport-height", `${Math.max(0, Math.floor(viewportHeight))}px`);
          el.style.setProperty("--modal-viewport-top", `${Math.round(viewportTop)}px`);
          el.style.setProperty("--modal-sheet-height", `${Math.floor(layoutHeight)}px`);
          el.style.setProperty(
            "--modal-keyboard-overlap",
            `${Math.max(0, Math.ceil(layoutHeight - viewportHeight - viewportTop))}px`,
          );
        } else {
          const dialogTop = Math.round(viewportTop);
          const dialogHeight = Math.max(0, Math.floor(viewportHeight));
          el.style.setProperty("--modal-viewport-height", `${dialogHeight}px`);
          el.style.setProperty("--modal-viewport-top", `${dialogTop}px`);
          el.style.setProperty("--modal-sheet-height", `${dialogHeight}px`);
          el.style.setProperty(
            "--modal-keyboard-overlap",
            `${Math.max(0, Math.ceil(dialogTop + dialogHeight - viewportTop - viewportHeight))}px`,
          );
        }
        el.style.removeProperty("--modal-viewport-bottom-inset");
      } else {
        const viewportBottom = viewport.offsetTop + viewport.height;
        el.style.setProperty(
          "--modal-viewport-height",
          `${Math.max(0, Math.floor(viewport.height) - 1)}px`,
        );
        el.style.setProperty(
          "--modal-viewport-bottom-inset",
          `${Math.max(0, Math.ceil(window.innerHeight - viewportBottom))}px`,
        );
      }
      el.classList.add("is-keyboard-open");
      if (isTopSixProductModal) queueRevealFocusedProductField();
    };
    const handleBagPagePan = () => {
      if (!isBagModal || !shouldFreezePageBackground || bagPagePanFrame || (window.scrollX === 0 && window.scrollY === 0)) return;
      bagPagePanFrame = window.requestAnimationFrame(() => {
        bagPagePanFrame = 0;
        if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
        updateFormModalViewport();
        queueBagFocusedFieldReveal();
      });
    };
    const handleBagViewportChange = () => {
      updateFormModalViewport();
      handleBagPagePan();
      queueBagFocusedFieldReveal();
    };
    const handleFormModalViewportChange = isBagModal ? handleBagViewportChange : updateFormModalViewport;
    const scheduleBagViewportRefresh = () => {
      if (!isBagModal) return;
      bagViewportRefreshTimers.forEach((timer) => window.clearTimeout(timer));
      bagViewportRefreshTimers = [];
      updateFormModalViewport();
      for (const delay of [100, 300]) {
        const timer = window.setTimeout(() => {
          bagViewportRefreshTimers = bagViewportRefreshTimers.filter((pending) => pending !== timer);
          updateFormModalViewport();
        }, delay);
        bagViewportRefreshTimers.push(timer);
      }
    };
    const handleBagFocusIn = () => {
      if (bagKeyboardCloseTimer !== null) {
        window.clearTimeout(bagKeyboardCloseTimer);
        bagKeyboardCloseTimer = null;
      }
      scheduleBagViewportRefresh();
      queueBagFocusedFieldReveal();
    };
    if (!el.open) {
      try {
        el.showModal();
      } catch {
        /* Dialog already open */
      }
    }
    const body = document.body;
    const root = document.documentElement;
    const oldBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      width: body.style.width,
      overscrollBehavior: body.style.overscrollBehavior,
    };
    const oldRootOverflow = root.style.overflow;
    const oldRootOverscrollBehavior = root.style.overscrollBehavior;
    body.style.overflow = "hidden";
    if (shouldFreezePageBackground) {
      // iOS Safari can still scroll the page behind form modals when body overflow is hidden.
      root.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `${-pageScrollY}px`;
      body.style.left = `${-pageScrollX}px`;
      body.style.width = "100%";
      if (isBagModal) {
        root.style.overscrollBehavior = "none";
        body.style.overscrollBehavior = "none";
        window.scrollTo(0, 0);
      }
    }
    updateFormModalViewport();
    viewport?.addEventListener("resize", handleFormModalViewportChange);
    if (isTopSixProductModal) viewport?.addEventListener("scroll", updateFormModalViewport);
    if (isBagModal) viewport?.addEventListener("scroll", handleBagViewportChange);
    window.addEventListener("resize", handleFormModalViewportChange);
    if (isBagModal) window.addEventListener("scroll", handleBagViewportChange, { passive: true });
    if (isTopSixProductModal) el.addEventListener("focusin", queueRevealFocusedProductField);
    if (isBagModal) el.addEventListener("focusin", handleBagFocusIn);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab") {
        const nodes = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((n) => n.offsetParent !== null);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    el.addEventListener("keydown", handleKeyDown);

    return () => {
      el.removeEventListener("keydown", handleKeyDown);
      if (isTopSixProductModal) el.removeEventListener("focusin", queueRevealFocusedProductField);
      if (isBagModal) el.removeEventListener("focusin", handleBagFocusIn);
      viewport?.removeEventListener("resize", handleFormModalViewportChange);
      if (isTopSixProductModal) viewport?.removeEventListener("scroll", updateFormModalViewport);
      if (isBagModal) viewport?.removeEventListener("scroll", handleBagViewportChange);
      window.removeEventListener("resize", handleFormModalViewportChange);
      if (isBagModal) window.removeEventListener("scroll", handleBagViewportChange);
      if (revealFocusedFieldFrame) window.cancelAnimationFrame(revealFocusedFieldFrame);
      if (bagPagePanFrame) window.cancelAnimationFrame(bagPagePanFrame);
      bagViewportRefreshTimers.forEach((timer) => window.clearTimeout(timer));
      if (bagKeyboardCloseTimer !== null) window.clearTimeout(bagKeyboardCloseTimer);
      if (bagFieldRevealTimer !== null) window.clearTimeout(bagFieldRevealTimer);
      layoutViewportProbe?.remove();
      el.classList.remove("is-keyboard-open");
      el.classList.remove("is-ios-full-layout");
      el.style.removeProperty("--modal-viewport-height");
      el.style.removeProperty("--modal-layout-height");
      el.style.removeProperty("--modal-viewport-top");
      el.style.removeProperty("--modal-sheet-height");
      el.style.removeProperty("--modal-keyboard-overlap");
      el.style.removeProperty("--modal-viewport-bottom-inset");
      if (el.open) el.close();
      body.style.overflow = oldBodyStyles.overflow;
      if (shouldFreezePageBackground) {
        body.style.position = oldBodyStyles.position;
        body.style.top = oldBodyStyles.top;
        body.style.left = oldBodyStyles.left;
        body.style.width = oldBodyStyles.width;
        body.style.overscrollBehavior = oldBodyStyles.overscrollBehavior;
        root.style.overflow = oldRootOverflow;
        root.style.overscrollBehavior = oldRootOverscrollBehavior;
        window.scrollTo(pageScrollX, pageScrollY);
      }
      if (previous && typeof previous.focus === "function") {
        previous.focus();
      }
    };
  }, [docScrollMode]);

  const dialog = (
    <dialog
      ref={ref}
      aria-label={label}
      aria-modal={docScrollMode ? undefined : "true"}
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
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
        {children}
      </div>
      {import.meta.env.DEV && showBagDebug && <BagModalDebugOverlay />}
    </dialog>
  );
  return docScrollMode ? createPortal(dialog, document.body) : dialog;
}
