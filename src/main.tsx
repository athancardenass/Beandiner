// ↓ REACT ENTRY POINT: Bootstraps React 19 app into DOM
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// ↓ GLOBAL STYLES: Tailwind 4 + custom CSS
import "./index.css";
// ↓ ROOT COMPONENT: Main App component
import App from "./App";

// ↓ MOUNT: Create React root and render App in StrictMode
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
