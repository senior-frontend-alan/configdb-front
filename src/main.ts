import './assets/styles/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import Material from '@primeuix/themes/material';
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
app.use(ToastService);

// Меняем цветовую тему на голубую
const MyPreset = definePreset(Aura, {
  colors: {
    // Определяем собственную палитру
  },
  semantic: {
    nexignBlue: {
      50: '#e6f0f3',
      100: '#cce1e7',
      200: '#99c3cf',
      300: '#66a5b7',
      400: '#33879f',
      500: '#0d475b', // эталонный цвет nexign
      600: '#0b3a49',
      700: '#082c37',
      800: '#051d24',
      900: '#030f12',
      950: '#010708',
    },
    primary: {
      50: '{nexignBlue.50}',
      100: '{nexignBlue.100}',
      200: '{nexignBlue.200}',
      300: '{nexignBlue.300}',
      400: '{nexignBlue.400}',
      500: '{nexignBlue.500}',
      600: '{nexignBlue.600}',
      700: '{nexignBlue.700}',
      800: '{nexignBlue.800}',
      900: '{nexignBlue.900}',
      950: '{nexignBlue.950}',
    },
  },
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
    config.value.modules.forEach((moduleConfig) => {
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
