import { useEffect, useState } from "react";

// DEBUG-TEMP: Device-only readout for the Order Bag surface under iOS Safari chrome.
export const BagModalDebugOverlay = import.meta.env.DEV ? function BagModalDebugOverlay() {
  const [snapshot, setSnapshot] = useState("");

  useEffect(() => {
    const dialog = document.querySelector<HTMLDialogElement>("dialog.bag-modal");
    if (!dialog) return;
    const viewport = window.visualViewport;
    const layoutProbe = document.createElement("div");
    const dynamicProbe = document.createElement("div");
    for (const [probe, height] of [[layoutProbe, "100lvh"], [dynamicProbe, "100dvh"]] as const) {
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = `position:fixed;top:0;left:0;width:0;height:${height};visibility:hidden;pointer-events:none;z-index:-1`;
      document.body.append(probe);
    }
    const update = () => {
      const content = dialog.querySelector<HTMLElement>(".bag-content");
      const stickyCta = dialog.querySelector<HTMLElement>(
        ".button-proceed-checkout, .button-whatsapp-checkout",
      );
      const dialogRect = dialog.getBoundingClientRect();
      const contentRect = content?.getBoundingClientRect();
      const viewportBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      const bottomPoint = Math.max(0, Math.min(window.innerHeight - 1, viewportBottom - 2));
      const bottomElement = document.elementFromPoint(Math.max(0, window.innerWidth / 2), bottomPoint);
      const describeElement = (element: Element | null) => {
        if (!element) return "none";
        const id = element.id ? `#${element.id}` : "";
        const classes = typeof element.className === "string"
          ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((name) => `.${name}`).join("")
          : "";
        const text = (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
        return `${element.tagName.toLowerCase()}${id}${classes}${text ? ` “${text}”` : ""}`;
      };
      const dialogStyle = getComputedStyle(dialog);
      const contentStyle = content ? getComputedStyle(content) : null;
      const rootStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);
      const ctaRect = stickyCta?.getBoundingClientRect();
      const contentMaxScroll = content ? Math.max(0, content.scrollHeight - content.clientHeight) : 0;
      const docScrollMode = dialog.classList.contains("docscroll-mode");
      const next = [
        "DEBUG-TEMP · Order Bag / Safari pill",
        `mode: ${docScrollMode ? "document scroll" : "fixed sheet"} · document scrollHeight: ${document.documentElement.scrollHeight}`,
        `vv: ${viewport?.height.toFixed(1) ?? "n/a"} · offset: ${viewport?.offsetTop.toFixed(1) ?? "n/a"} · inner: ${window.innerHeight} · lv/dv: ${layoutProbe.getBoundingClientRect().height.toFixed(1)}/${dynamicProbe.getBoundingClientRect().height.toFixed(1)}`,
        `scrollY: ${window.scrollY} · body lock: ${bodyStyle.position === "fixed" ? "on" : "off"} · browser: ${document.documentElement.dataset.browserFamily ?? "?"}`,
        `dialog top/bottom/height: ${dialogRect.top.toFixed(1)} / ${dialogRect.bottom.toFixed(1)} / ${dialogRect.height.toFixed(1)}`,
        `content top/bottom/height: ${contentRect?.top.toFixed(1) ?? "n/a"} / ${contentRect?.bottom.toFixed(1) ?? "n/a"} / ${contentRect?.height.toFixed(1) ?? "n/a"}`,
        `content scroll: ${content?.scrollTop.toFixed(1) ?? "n/a"} / ${contentMaxScroll.toFixed(1)} max · padding-bottom: ${contentStyle?.paddingBottom ?? "n/a"}`,
        `CTA rect top/bottom/height: ${ctaRect?.top.toFixed(1) ?? "n/a"} / ${ctaRect?.bottom.toFixed(1) ?? "n/a"} / ${ctaRect?.height.toFixed(1) ?? "n/a"} · under vv edge: ${describeElement(bottomElement)}`,
        `sheet: ${dialogStyle.position} · ${dialogStyle.height} · ${dialogStyle.backgroundColor}`,
        `html/body: ${rootStyle.backgroundColor} / ${bodyStyle.backgroundColor} · theme: ${document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content ?? "none"}`,
      ].join("\n");
      setSnapshot((current) => current === next ? current : next);
    };

    update();
    const interval = window.setInterval(update, 250);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      window.clearInterval(interval);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      layoutProbe.remove();
      dynamicProbe.remove();
    };
  }, []);

  return <pre className="bag-modal-debug-overlay" aria-hidden="true">{snapshot}</pre>;
} : () => null;

// DEBUG-TEMP: Read-only page geometry for comparing menu content under Safari chrome.
export const MenuPageDebugOverlay = import.meta.env.DEV ? function MenuPageDebugOverlay({ page }: { page: "diner-bites" | "beverages" }) {
  const [snapshot, setSnapshot] = useState("");

  useEffect(() => {
    const viewport = window.visualViewport;
    const describeElement = (element: Element | null) => {
      if (!element) return "none";
      const id = element.id ? `#${element.id}` : "";
      const classes = typeof element.className === "string"
        ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((name) => `.${name}`).join("")
        : "";
      const style = getComputedStyle(element);
      return `${element.tagName.toLowerCase()}${id}${classes} bg:${style.backgroundColor}`;
    };
    const update = () => {
      const main = document.querySelector<HTMLElement>("main#main");
      const mainRect = main?.getBoundingClientRect();
      const rootStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);
      const pointY = Math.max(0, Math.min(window.innerHeight - 1, (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 2));
      const bottomElement = document.elementFromPoint(window.innerWidth / 2, pointY);
      const edgeStyle = getComputedStyle(document.body, "::after");
      const next = [
        "DEBUG-TEMP · Menu / Safari pill",
        `edge sampling: ${edgeStyle.content === '""' ? "on" : "off"} · filter: ${edgeStyle.backdropFilter || edgeStyle.getPropertyValue("-webkit-backdrop-filter") || "none"}`,
        `page: ${page} · viewport-fit: ${document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content.includes("viewport-fit=cover") ? "cover" : "default"}`,
        `vv height/offset: ${viewport?.height.toFixed(1) ?? "n/a"} / ${viewport?.offsetTop.toFixed(1) ?? "n/a"} · innerHeight: ${window.innerHeight} · screen: ${window.screen.height}`,
        `scrollY: ${window.scrollY} · document scrollHeight: ${document.documentElement.scrollHeight} · scrollingElement: ${document.scrollingElement?.tagName.toLowerCase() ?? "none"}`,
        `main rect top/bottom/height: ${mainRect?.top.toFixed(1) ?? "n/a"} / ${mainRect?.bottom.toFixed(1) ?? "n/a"} / ${mainRect?.height.toFixed(1) ?? "n/a"}`,
        `html/body/main bg: ${rootStyle.backgroundColor} / ${bodyStyle.backgroundColor} / ${main ? getComputedStyle(main).backgroundColor : "n/a"}`,
        `element at viewport bottom: ${describeElement(bottomElement)}`,
      ].join("\n");
      setSnapshot((current) => current === next ? current : next);
    };

    update();
    const interval = window.setInterval(update, 250);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.clearInterval(interval);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [page]);

  return <pre className="bag-modal-debug-overlay" aria-hidden="true">{snapshot}</pre>;
} : () => null;

if (import.meta.env.DEV) {
  void import("../debug-overlays.css");
}
