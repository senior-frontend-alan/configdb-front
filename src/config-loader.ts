// Загружает нужные модули в приложение из файла app.config.json
import { ref, readonly } from 'vue';
import configData from '../app.config.json';

// Типы для конфигурации
export interface ModuleRoutes {
  getCatalog: string;
}

export interface ModuleConfig {
  label: string;
  icon?: string;
  routes: ModuleRoutes;
}

export interface AppRoutes {
  apiSession: string;
  apiApplication: string;
  apiLoginSSO: string;
  apiPrefix: string;
}

export interface I18nConfig {
  defaultLanguage: string;
  locales: Record<string, string>;
}

export interface AppConfig {
  name: string;
  routes: AppRoutes;
  apiRetryTimeoutMs: number;
  apiCacheMaxAge: number;
  siteTitle: string;
  siteCopyright: string;
  theme: string;
  i18n: I18nConfig;
}

export interface Config {
  appConfig: AppConfig;
  modules: ModuleConfig[];
}

// Функция для извлечения имени модуля из URL getCatalog
export function extractModuleNameFromUrl(url: string): string {
  const urlParts = url.split('/');
  let extractedModuleName = '';
  
  // Если URL начинается с http:// или https:// (абсолютный путь)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Берем первую часть пути после домена
    // Для http://localhost:5173/catalog/api/v1/-catalog/ -> catalog
    extractedModuleName = urlParts[3];
  } else if (url.startsWith('/')) {
    // Если URL начинается с / (относительный путь)
    // Для /catalog/api/v1/-catalog/ -> catalog
    extractedModuleName = urlParts[1];
  } else {
    // Для других случаев выбрасываем ошибку
    throw new Error(`Некорректный формат URL: ${url}. URL должен начинаться с http://, https:// или /`);
  }
  
  return extractedModuleName;
}

// Создаем реактивную ссылку на конфигурацию
const config = ref<Config>(configData as Config);

// Композабл для доступа к конфигурации
export function useConfig() {
  return {
    // Возвращаем только для чтения версию конфигурации
    config: readonly(config),
  };
}

// Инициализация конфигурации
export function initConfig() {
  // Здесь можно добавить логику для загрузки конфигурации с сервера
  console.log('Конфигурация инициализирована:', config.value.appConfig.name);
  return config.value;
}
