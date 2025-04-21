import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  appType: 'spa',
  plugins: [
    vue(),
    Components({
      resolvers: [PrimeVueResolver()],
    }),
  ],
  server: {
    host: '0.0.0.0',
    cors: false,
    proxy: {
      '/static': 'http://localhost:8001',
      '/catalog/api/': {
        target: 'http://localhost:8001',
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
        target: 'http://localhost:8001',
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
        target: 'http://localhost:8001',
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
        target: 'http://localhost:8001',
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
