// vite.config.ts (Partial - showing only the relevant plugin config)
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
          src: 'src/assets/data',  // Your source data folder
          dest: '.'                // CHANGE THIS LINE (from 'data' to '.')
        },
        {
          src: 'src/assets/images', // Your source images folder
          dest: '.'                // CHANGE THIS LINE (from 'images' to '.')
        },
        {
          src: 'src/assets/python', // Your source python folder
          dest: '.'                // CHANGE THIS LINE (from 'python' to '.')
        }
        // Add more targets if needed
      ]
    })
  ],
  // ... other config ...
});