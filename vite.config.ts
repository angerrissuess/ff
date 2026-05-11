import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({mode}) => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // SECURITY: Do NOT expose GEMINI_API_KEY to client
      'process.env.MODE': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      host: 'localhost',
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/health': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/music': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
  };
});
