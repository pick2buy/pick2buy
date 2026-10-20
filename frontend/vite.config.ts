import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pick2buy/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    // Allows this active Cloudflare quick-tunnel hostname during mobile testing.
    allowedHosts: ['thumbnails-antibody-neighbor-weddings.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
