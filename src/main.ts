import './assets/styles/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Aura from '@primeuix/themes/aura';
// Импортируем темы, но не используем их сейчас
// import Lara from '@primeuix/themes/lara';
// import Nora from '@primeuix/themes/nora';
// import Material from '@primeuix/themes/material';
import { definePreset } from '@primeuix/themes';
import App from './App.vue';
import router, { initializeAuth } from './router';
import { setupApi } from './api';
import { createModuleStore } from './stores/module-factory';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import { setupI18n } from './i18n';

/**
 * Создает тему приложения
 */
function createAppTheme() {
  return definePreset(Aura, {
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
    components: {
      dialog: {
        // Определяем CSS на уровне компонента
        // Уменьшаем отступы в заголовке диалогового окна
        css: () => `
          .p-dialog .p-dialog-header {
            padding: 0.2rem 0.2rem;
            padding-left: 1rem;
            border-radius: 12px 12px 0 0;
            }
          .p-dialog-content {
            padding-top: 1rem;
          }
          .p-dialog {
            background: #f8fafc;
          }
          .p-dialog-header {
            background-color: #d5dce4bf;
          }
        `,
      },
    },
  });
}

/**
 * Инициализирует сторы модулей
 */
function initializeModuleStores() {
  try {
    // Используем глобальную конфигурацию
    if (!window.APP_CONFIG || !window.APP_CONFIG.modules) {
      console.error(
        'Конфигурация не загружена или неверного формата, невозможно инициализировать сторы модулей',
      );
      return;
    }

    // Создаем стор для каждого модуля в конфигурации
    window.APP_CONFIG.modules.forEach((moduleConfig) => {
      const storeId = moduleConfig.urlPath;

      console.log(`Создание стора для модуля: ${storeId}`);
      const moduleStore = createModuleStore(moduleConfig);
      // Функция createModuleStore возвращает определение стора Pinia, но не создаёт его экземпляр
      // Вызов moduleStore() необходим для фактического создания экземпляра стора и его регистрации в Pinia
      // Без этого вызова стор не будет доступен в приложении и не появится в Vue DevTools
      // Используем тип any для обхода ошибки типизации
      (moduleStore as any)();
    });
  } catch (err) {
    console.error('Ошибка при инициализации сторов модулей:', err);
  }
}

/**
 * Асинхронная функция для инициализации приложения
 */
async function initApp() {
  try {
    console.log('Инициализация приложения...');

    // Настраиваем API с использованием импортированной конфигурации
    setupApi();

    // Создаем экземпляры приложения и хранилища
    const app = createApp(App);
    const pinia = createPinia();

    // Подключаем плагины
    app.use(pinia);
    app.use(router);
    app.use(ToastService);

    // Инициализация i18n
    const i18n = setupI18n();
    app.use(i18n);

    // Применяем тему
    const MyPreset = createAppTheme();
    app.use(PrimeVue, {
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: '.p-dark',
        },
      },
    });

    // Инициализация базовых сторов
    useAuthStore();
    useSettingsStore();
    console.log('Сторы авторизации и настроек успешно инициализированы');

    // Инициализация модульных сторов - должна происходить до использования роутера
    initializeModuleStores();
    console.log('Модульные сторы успешно инициализированы');

    // Проверка сессии при загрузке приложения (только один раз)
    await initializeAuth();

    // Монтируем приложение
    app.mount('#app');
    console.log('Приложение успешно запущено');
  } catch (error) {
    console.error('Ошибка при инициализации приложения:', error);
    // Показываем пользователю сообщение об ошибке
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h2 style="color: #d32f2f;">Ошибка загрузки приложения</h2>
        <p>Не удалось загрузить конфигурацию приложения. Пожалуйста, убедитесь, что файл app.config.json доступен.</p>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
}

// Запускаем инициализацию приложения
initApp();
