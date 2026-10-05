import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Social crawlers (Facebook, Messenger) ignore relative og:image paths, so the
   share tags need an absolute URL. Set VITE_SITE_URL (for example
   https://beandiner.example.com) when building for production. Without it the
   tags fall back to relative paths and the build prints a warning. */
function siteUrlPlugin(): Plugin {
  const raw = process.env.VITE_SITE_URL?.trim().replace(/\/+$/, "");
  return {
    name: "bean-diner-site-url",
    transformIndexHtml(html) {
      if (!raw) {
        console.warn(
          "[bean-diner-site-url] VITE_SITE_URL is not set. og:image, canonical and structured data will use relative URLs.",
        );
        return html.replace(/__SITE_URL__\//g, "./").replace(/__SITE_URL__/g, ".");
      }
      return html.replace(/__SITE_URL__/g, raw);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile(), siteUrlPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
