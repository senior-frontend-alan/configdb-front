import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import { resolve } from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  appType: 'spa',
  plugins: [
    vue(),
    Components({
      resolvers: [PrimeVueResolver()],
    }),
    // Плагин для копирования app.config.json в директорию сборки
    {
      name: 'copy-config',
      apply: 'build',
      closeBundle() {
        const sourcePath = resolve(__dirname, 'app.config.json');
        const destPath = resolve(__dirname, 'dist/app.config.json');

        try {
          fs.copyFileSync(sourcePath, destPath);
          console.log('✓ app.config.json успешно скопирован в директорию сборки');
        } catch (error) {
          console.error('Ошибка при копировании app.config.json:', error);
        }
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    cors: false,
    proxy: {
      '/static': 'http://localhost:7008',
      '/catalog/api/': {
        target: 'http://localhost:7008',
        xfwd: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[VITE PROXY] → ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[VITE PROXY] ← ${req.method} ${req.url} [${proxyRes.statusCode}]`);
          });
        },
      },
      '/inventory/api/': {
        target: 'http://localhost:7008',
        xfwd: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[VITE PROXY] → ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[VITE PROXY] ← ${req.method} ${req.url} [${proxyRes.statusCode}]`);
          });
        },
      },
      '/ocsmanage/api/': {
        target: 'http://localhost:7008',
        xfwd: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[VITE PROXY] → ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[VITE PROXY] ← ${req.method} ${req.url} [${proxyRes.statusCode}]`);
          });
        },
      },
      '/api': {
        target: 'http://localhost:7008',
        xfwd: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[VITE PROXY] → ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[VITE PROXY] ← ${req.method} ${req.url} [${proxyRes.statusCode}]`);
          });
        },
      },
    },
  },
});
