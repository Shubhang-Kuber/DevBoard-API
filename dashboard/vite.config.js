import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth':      'http://localhost:3000',
      '/tasks':     'http://localhost:3000',
      '/bookmarks': 'http://localhost:3000',
      '/tags':      'http://localhost:3000',
    },
  },
});
