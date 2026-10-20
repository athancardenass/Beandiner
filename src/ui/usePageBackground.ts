import { useEffect } from "react";

/** Keep Safari's mobile browser chrome white regardless of scroll position. */
export function usePageBackground() {
  useEffect(() => {
    const root = document.documentElement;
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const originalTheme = theme?.content;
    const originalViewportBackground = root.style.getPropertyValue("--viewport-background");
    const originalColorScheme = root.style.colorScheme;
    const media = matchMedia("(max-width: 820px)");
    const restore = () => {
      if (originalViewportBackground) root.style.setProperty("--viewport-background", originalViewportBackground);
      else root.style.removeProperty("--viewport-background");
      if (originalColorScheme) root.style.colorScheme = originalColorScheme;
      else root.style.removeProperty("color-scheme");
      if (theme && originalTheme !== undefined) theme.content = originalTheme;
    };
    const update = () => {
      if (media.matches) {
        root.style.setProperty("--viewport-background", "#FFFFFF");
        root.style.colorScheme = "light";
        if (theme) theme.content = "#FFFFFF";
      } else {
        restore();
      }
    };
    update();
    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
      restore();
    };
  }, []);
}
