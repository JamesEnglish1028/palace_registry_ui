import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const defaultBase = process.env.GITHUB_ACTIONS
  ? '/https-github.com-JamesEnglish1028-palace_registry_ui/'
  : '/';

const base = process.env.VITE_BASE_PATH ?? defaultBase;
const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig(() => {
  return {
    base,
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/libraries': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/api/geojson': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
