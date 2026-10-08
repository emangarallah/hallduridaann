import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isHttps = process.env.APP_URL?.startsWith('https://');
  const clientPort = isHttps ? 443 : 3000;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      ws: {
        clientPort,
      },
      hmr: {
        clientPort,
      },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
                return 'vendor-react';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('/motion/')) {
                return 'vendor-motion';
              }
              if (id.includes('html2canvas')) {
                return 'vendor-html2canvas';
              }
              if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
                return 'vendor-jspdf';
              }
              if (id.includes('canvas-confetti')) {
                return 'vendor-confetti';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
              return 'vendor-misc';
            }
          },
        },
      },
    },
  };
});
