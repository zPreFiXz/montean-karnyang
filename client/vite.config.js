import path from "path";
import { fileURLToPath } from "url";

// ESM ไม่มี __dirname ให้สร้างเองจาก import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

