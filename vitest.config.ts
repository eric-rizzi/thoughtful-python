import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test-setup.ts', // We will create this file next
    css: true, // If you want to process CSS in tests
  },
});
