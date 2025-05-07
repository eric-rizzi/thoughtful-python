// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
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
        // Add more targets if needed
      ],
    }),
  ],
});
