/**
 * Типы для конфигурации приложения
 */
export interface Module {
  label: string;
  urlPath: string;
  routes: {
    getCatalog: string;
    getJSIFunctions?: string;
  };
}

export interface AppConfig {
  siteTitle: string;
  siteCopyright: string;
  routes: {
    apiSession: string;
  };
  apiTimeoutMs: number;
  apiRetryTimeoutMs: number;
  apiCacheMaxAge: number;
  apiCallHistoryLimit: number;
  theme: string;
  i18n: {
    defaultLanguage: string;
    locales: Record<string, string>;
  };
}

export interface Config {
  appConfig: AppConfig;
  modules: Module[];
}

// Объявление глобальной переменной
declare global {
  interface Window {
    APP_CONFIG: Config;
  }
}

// Это нужно для корректной работы модуля
export {};
