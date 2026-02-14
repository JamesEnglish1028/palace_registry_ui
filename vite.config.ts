import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      base: '/https-github.com-JamesEnglish1028-palace_registry_ui/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/libraries': {
            target: 'http://localhost:4000',
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
