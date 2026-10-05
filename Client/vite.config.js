import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // shadcn/ui components are written against the "@/..." alias, e.g.
    // import { cn } from '@/lib/utils'. Without this Vite cannot resolve them.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    // Vite's default recursive chokidar watcher fails hard on Windows when a
    // file under public/ is momentarily locked (EBUSY kills the whole dev
    // server). Polling keeps hot reload reliable here at a small CPU cost.
    watch: { usePolling: true, interval: 300 },
    proxy: {
      // Lets the browser call /api on the Vite origin, so LAN users do not need
      // to know the API host and no CORS pre-flight is required.
      '/api': { target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000', changeOrigin: true },
      '/uploads': { target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000', changeOrigin: true },
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
});
