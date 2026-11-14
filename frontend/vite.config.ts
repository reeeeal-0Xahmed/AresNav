import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8001';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-ol': ['ol', 'proj4'],
            'vendor-react': ['react', 'react-dom', 'react-router-dom', 'zustand'],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        // Only proxy API endpoints starting with /mars/ and /sanctum/, NOT /mars-favicon.svg or static assets
        '^/mars/': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (
              req.url &&
              (req.url.endsWith('.svg') ||
                req.url.endsWith('.png') ||
                req.url.endsWith('.jpg') ||
                req.url.includes('favicon'))
            ) {
              return req.url;
            }
          },
        },
        '^/sanctum/': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
