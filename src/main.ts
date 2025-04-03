import "./assets/styles/main.css";

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import App from './App.vue';
import router from './router';
import { useConfig } from './config-loader';
import { createModuleStore } from './stores/module-factory';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Меняем цветовую тему на голубую
const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{sky.50}',
            100: '{sky.100}',
            200: '{sky.200}',
            300: '{sky.300}',
            400: '{sky.400}',
            500: '{sky.500}',
            600: '{sky.600}',
            700: '{sky.700}',
            800: '{sky.800}',
            900: '{sky.900}',
            950: '{sky.950}'
        }
    }
});


app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      darkModeSelector: '.p-dark',
    },
  },
});

// Инициализация сторов модулей после создания Pinia
const initializeModuleStores = () => {
  try {
    const { config } = useConfig();
    
    // Создаем сторы для каждого модуля в конфигурации
    config.value.modules.forEach(moduleConfig => {
      console.log(`Создание стора для модуля: ${moduleConfig.id}`);
      const storeDefinition = createModuleStore(moduleConfig);
      
      // Создание экземпляра стора для регистрации в Pinia и видимости в Vue Devtools
      storeDefinition();
    });
  } catch (err) {
    console.error('Ошибка при инициализации сторов модулей:', err);
  }
};

// Инициализация authStore и settingsStore
// Вызываем функции без присваивания переменным
useAuthStore();
useSettingsStore();
// Инициализация модульных сторов
initializeModuleStores();

console.log('Сторы авторизации и настроек успешно инициализированы');
app.mount('#app');