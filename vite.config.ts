// vite.config.ts (Partial - showing only the updated plugin config)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  // ... other config ...
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets/data',  // UPDATED PATH
          dest: 'data'             // Destination is now 'data' inside 'dist'
        },
        {
          src: 'src/assets/images', // UPDATED PATH
          dest: 'images'           // Destination is now 'images' inside 'dist'
        },
        {
          src: 'src/assets/python', // UPDATED PATH
          dest: 'python'           // Destination is now 'python' inside 'dist'
        }
      ]
    })
  ],
  // ... other config ...
});