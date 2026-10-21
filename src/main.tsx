// ↓ REACT ENTRY POINT: Bootstraps React 19 app into DOM
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// ↓ GLOBAL STYLES: Tailwind 4 + custom CSS
import "./index.css";
import { isSafariBrowser } from "./ui/browser";
// ↓ ROOT COMPONENT: Main App component
import App from "./App";

document.documentElement.dataset.browserFamily = isSafariBrowser() ? "safari" : "other";

const safariTestClasses: Record<string, string[]> = {
  "1": ["t-nobag"],
  "2": ["t-bg"],
  "3": ["t-nofilter"],
  "4": ["t-nocover"],
  "5": ["t-nobag", "t-bg", "t-nofilter"],
  "6": ["t-no-vh-range"],
  "7": ["t-bag-light-canvas"],
};
const safariTest = new URLSearchParams(window.location.search).get("t");
document.documentElement.classList.add(...(safariTestClasses[safariTest ?? ""] ?? []));

if (safariTest === "4") {
  const viewportMeta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (viewportMeta) viewportMeta.content = viewportMeta.content.replace(/,?\s*viewport-fit\s*=\s*cover\b/i, "");
}

// ↓ MOUNT: Create React root and render App in StrictMode
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
