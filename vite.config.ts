/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  base: "/thoughtful-python/",
  server: {
    appType: "spa",
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "src/assets/data",
          dest: ".",
        },
        {
          src: "src/assets/images",
          dest: ".",
        },
        {
          src: "src/assets/python",
          dest: ".",
        },
        {
          src: "public/404.html",
          dest: ".",
        },
      ],
    }),
  ],

  // Merged Vitest configuration
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./test-setup.ts",
    exclude: ["node_modules", "dist", "e2e/**"],
    css: {
      modules: {
        classNameStrategy: "non-scoped",
      },
    },
  },
});
