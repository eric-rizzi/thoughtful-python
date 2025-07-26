// vite.config.ts
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
          src: "src/assets/data", // Your source data folder
          dest: ".",
        },
        {
          src: "src/assets/images", // Your source images folder
          dest: ".",
        },
        {
          src: "src/assets/python", // Your source python folder
          dest: ".",
        },
        {
          src: "public/404.html",
          dest: ".",
        },
        // Add more targets if needed
      ],
    }),
  ],
});
