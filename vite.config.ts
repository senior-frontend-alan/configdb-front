import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        Components({
            resolvers: [PrimeVueResolver()],
        }),
    ],
    server: {
        host: "0.0.0.0",
        cors: false,
        proxy: {
          '/static': 'http://localhost:8000',
          '/api': {
            target: 'http://localhost:8000',
            xfwd: true,
          },
        },
    },
});
