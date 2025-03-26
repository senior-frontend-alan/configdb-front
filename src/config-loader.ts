// Загружает нужные модули в приложение из файла app.config.json
import { ref, readonly } from 'vue';
import configData from '../app.config.json';

// Типы для конфигурации
export interface ModuleRoutes {
  list: string;
  get: string;
  create: string;
  update: string;
  delete: string;
}

export interface ModuleConfig {
  id: string;
  name: string;
  icon?: string;
  routes: ModuleRoutes;
}

export interface AppRoutes {
  apiRoot: string;
  apiHelpRoot: string;
  apiPrefix: string;
  apiSession: string;
  apiTransaction: string;
  apiBuildInfo: string;
  apiApplication: string;
  apiVersion: string;
  apiLoginSSO: string;
}

export interface I18nConfig {
  defaultLanguage: string;
  locales: Record<string, string>;
}

export interface AppConfig {
  name: string;
  routes: AppRoutes;
  apiTimeoutMs: number;
  apiRetryTimeoutMs: number;
  apiCacheMaxAge: number;
  apiCallHistoryLimit: number;
  siteTitle: string;
  siteCopyright: string;
  theme: string;
  i18n: I18nConfig;
}

export interface Config {
  appConfig: AppConfig;
  modules: ModuleConfig[];
}

// Создаем реактивную ссылку на конфигурацию
const config = ref<Config>(configData as Config);

// Композабл для доступа к конфигурации
export function useConfig() {
  return {
    // Возвращаем только для чтения версию конфигурации
    config: readonly(config),
    
    // Получение конфигурации модуля по ID
    getModuleConfig: (moduleId: string) => {
      return config.value.modules.find(module => module.id === moduleId);
    },
    
    // Получение базового URL API
    getApiBaseUrl: () => {
      const { routes } = config.value.appConfig;
      return routes.apiRoot;
    },
    
    // Получение полного URL для API-эндпоинта
    getApiUrl: (endpoint: string) => {
      const { routes } = config.value.appConfig;
      return `${routes.apiRoot}${routes.apiPrefix}${endpoint}`;
    },
    
    // Получение таймаута API
    getApiTimeout: () => {
      return config.value.appConfig.apiTimeoutMs;
    }
  };
}

// Инициализация конфигурации
export function initConfig() {
  // Здесь можно добавить логику для загрузки конфигурации с сервера
  console.log('Конфигурация инициализирована:', config.value.appConfig.name);
  return config.value;
}