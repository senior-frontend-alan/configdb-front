/**
 * Конфигурация приложения
 * Этот файл содержит настройки приложения, модулей и API
 */

window.APP_CONFIG = {
  appConfig: {
    // Основные настройки приложения
    siteTitle: 'NG-Core Example',
    siteCopyright: '© Nexign, JSC, 1992–2025',

    // Маршруты API
    routes: {
      apiSession: 'http://localhost:7008/api/v1/session/',
    },

    // Настройки API
    apiTimeoutMs: 5000, // Таймаут запросов API в миллисекундах
    apiRetryTimeoutMs: 30000, // Таймаут повторных запросов API в миллисекундах
    apiCacheMaxAge: 900000, // Максимальное время жизни кэша API в миллисекундах (15 минут)
    apiCallHistoryLimit: 100, // Лимит истории вызовов API

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
      urlPath: 'module_catalog', // URL-путь для модуля/Название Cтора в котором хранятся данные на UI
      routes: {
        getCatalog: 'http://localhost:7008/catalog/api/v1/-catalog/',
        getJSIFunctions: '/js/modules/catalog.js',
      },
    },
    {
      label: 'Inventory',
      urlPath: 'module_inventory',
      routes: {
        getCatalog: 'http://localhost:7008/inventory/api/v1/-catalog/',
      },
    },
    {
      label: 'OCS Manage',
      urlPath: 'module_ocs_manage',
      routes: {
        getCatalog: 'http://localhost:7008/ocsmanage/api/v1/-catalog/',
      },
    },
  ],
};
// На этом конфигурация закончена, далее техническая информация

function isValidUrlPath(urlPath) {
  // Проверяем, что urlPath содержит только строчные буквы, цифры, дефисы и подчеркивания
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
// Проверяем urlPath всех модулей
validateModulesUrlPath(window.APP_CONFIG.modules);
