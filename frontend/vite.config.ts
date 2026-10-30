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
    // Bind to every interface so the app is reachable from other devices on
    // the local network (for example, http://192.168.1.9:5173).
    host: '0.0.0.0',
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
