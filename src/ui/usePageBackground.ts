import { useEffect } from "react";

/** Keep the document canvas behind Safari's translucent bottom UI in sync with
 * the section at the visible bottom edge, or dark while the bag is open.
 * This changes no section or dialog styling. */
export function usePageBackground(page: string, bagOpen: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const originalTheme = theme?.content ?? "#121212";
    const originalColorScheme = root.style.colorScheme;
    const media = matchMedia("(max-width: 820px)");
    const viewport = window.visualViewport;
    let frame = 0;
    let disposed = false;

    const update = () => {
      frame = 0;
      if (disposed) return;
      if (!media.matches) {
        root.style.removeProperty("--viewport-background");
        if (originalColorScheme) root.style.colorScheme = originalColorScheme;
        else root.style.removeProperty("color-scheme");
        if (theme) theme.content = originalTheme;
        return;
      }
      // Pinch zoom should not change the page's browser-chrome theme.
      if (viewport && Math.abs(viewport.scale - 1) > .01) return;
      const bottom = Math.min(innerHeight, (viewport?.offsetTop ?? 0) + (viewport?.height ?? innerHeight));
      const stack = document.elementsFromPoint(innerWidth / 2, Math.max(0, bottom - 4));
      // Rubber-band scrolling can expose the canvas with no element to sample.
      // Keep the bottom browser chrome dark, even on menus without a footer.
      const footer = document.querySelector("footer");
      const atBottom = window.scrollY + bottom >= root.scrollHeight - 4;
      // The bag scrolls independently of the document, including Checkout Details.
      const darkChrome = bagOpen || atBottom;
      root.style.colorScheme = darkChrome ? "dark" : "light";
      let color = darkChrome
        ? footer ? getComputedStyle(footer).backgroundColor
          : getComputedStyle(root).getPropertyValue("--surface-dark").trim() || "#121212"
        : root.style.getPropertyValue("--viewport-background") ||
          getComputedStyle(root).getPropertyValue("--surface-page").trim() || "#FFFFFF";
      let transitioning = false;
      for (const element of stack) {
        // Stale menu hit tests during rubber-banding must not override the edge.
        if (darkChrome) break;
        if (element.closest(".floating-bag-bubble, .toast, .page-progress, .skip-link, dialog")) continue;
        // The bottom edge may hit the story's exposed track while its sticky
        // panel is clipped/repainted. Its active panel still owns that color.
        const track = element.closest(".scroll-story");
        const surface = track?.querySelector(".story-stage") ?? element.closest("main > section, main > .manifesto-strip, footer");
        if (!surface) continue;
        const background = getComputedStyle(surface).backgroundColor;
        if (background !== "transparent" && background !== "rgba(0, 0, 0, 0)") {
          color = background;
          transitioning = surface.getAnimations().some(animation =>
            "transitionProperty" in animation && animation.transitionProperty === "background-color" && animation.playState === "running",
          );
          break;
        }
      }
      if (root.style.getPropertyValue("--viewport-background") !== color) {
        root.style.setProperty("--viewport-background", color);
      }
      if (theme && theme.content !== color) theme.content = color;
      // Sample only while the existing section-color transition is running.
      if (transitioning) schedule();
    };
    const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(update); };
    const observer = new MutationObserver(schedule);
    const stage = document.querySelector(".story-stage");
    if (stage) observer.observe(stage, { attributes: true, attributeFilter: ["style"] });
    const resized = new ResizeObserver(schedule);
    resized.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("pageshow", schedule);
    viewport?.addEventListener("resize", schedule, { passive: true });
    viewport?.addEventListener("scroll", schedule, { passive: true });
    media.addEventListener("change", schedule);
    document.addEventListener("transitionend", schedule);
    document.fonts.ready.then(schedule);
    schedule();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resized.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      media.removeEventListener("change", schedule);
      document.removeEventListener("transitionend", schedule);
      root.style.removeProperty("--viewport-background");
      if (originalColorScheme) root.style.colorScheme = originalColorScheme;
      else root.style.removeProperty("color-scheme");
      if (theme) theme.content = originalTheme;
    };
  }, [page, bagOpen]);
}
