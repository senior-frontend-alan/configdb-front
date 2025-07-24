// Конфигурация с поддержкой переменных окружения
(function() {
  // Получаем базовый URL API из переменных окружения или используем относительные пути
  const API_BASE_URL = window.ENV?.API_BASE_URL || '';
  
  window.APP_CONFIG = {
    appConfig: {
      // Основные настройки приложения
      siteTitle: 'NG-Core Example',
      siteCopyright: '© Nexign, JSC, 1992–2025',

      // Маршруты API
      routes: {
        apiSession: `${API_BASE_URL}/api/v1/session/`,
      },

      // Настройки API
      apiTimeoutMs: 5000,
      apiRetryTimeoutMs: 30000,
      apiCacheMaxAge: 900000,
      apiCallHistoryLimit: 100,

      // Тема оформления
      theme: 'light',

      // Настройки интернационализации
      i18n: {
        defaultLanguage: 'ru',
        locales: {
          en: 'English',
          ru: 'Русский',
        },
      },
    },

    // Конфигурация модулей
    modules: [
      {
        label: 'Catalog1',
        urlPath: 'module_catalog',
        routes: {
          getCatalog: `${API_BASE_URL}/catalog/api/v1/-catalog/`,
          getJSIFunctions: '/js/modules/catalog.js',
        },
      },
      {
        label: 'Inventory',
        urlPath: 'module_inventory',
        routes: {
          getCatalog: `${API_BASE_URL}/inventory/api/v1/-catalog/`,
        },
      },
      {
        label: 'OCS Manage',
        urlPath: 'module_ocs_manage',
        routes: {
          getCatalog: `${API_BASE_URL}/ocsmanage/api/v1/-catalog/`,
        },
      },
    ],
  };

  // Валидация как раньше
  function isValidUrlPath(urlPath) {
    const validUrlPathRegex = /^[a-z0-9_-]+$/;
    return validUrlPathRegex.test(urlPath);
  }

  function validateModulesUrlPath(modules) {
    modules.forEach((module) => {
      if (!isValidUrlPath(module.urlPath)) {
        throw new Error(
          `Некорректный urlPath '${module.urlPath}' для модуля '${module.label}'. ` +
            `urlPath должен содержать только строчные латинские буквы, цифры, дефисы и подчеркивания.`,
        );
      }
    });
  }

  validateModulesUrlPath(window.APP_CONFIG.modules);
})();
