import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5000,
        host: '0.0.0.0',
        allowedHosts: true,
        proxy: {
          '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
          },
          '/humanizer': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/humanize': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/detect-faces': { target: 'http://localhost:8000', changeOrigin: true },
          '/face-swap': { target: 'http://localhost:8000', changeOrigin: true },
          '/face-swap-multi': { target: 'http://localhost:8000', changeOrigin: true },
          '/outfit-swap': { target: 'http://localhost:8000', changeOrigin: true },
          '/precision-edit': { target: 'http://localhost:8000', changeOrigin: true },
          '/detect-face': { target: 'http://localhost:8000', changeOrigin: true },
          '/segment-body': { target: 'http://localhost:8000', changeOrigin: true },
          '/admin': { target: 'http://localhost:8000', changeOrigin: true },
          '/video-jobs': { target: 'http://localhost:8000', changeOrigin: true },
          '/video-face-swap': { target: 'http://localhost:8000', changeOrigin: true },
          '/video-progress': { target: 'http://localhost:8000', changeOrigin: true },
          '/video-cancel': { target: 'http://localhost:8000', changeOrigin: true },
          '/video-result': { target: 'http://localhost:8000', changeOrigin: true },
          '/webcam-swap': { target: 'http://localhost:8000', changeOrigin: true },
          '/health': { target: 'http://localhost:8000', changeOrigin: true },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
