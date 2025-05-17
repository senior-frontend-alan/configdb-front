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

/**
 * Интерфейс для результата парсинга API URL
 */
export interface ApiUrlInfo {
  moduleName: string;
  catalogName: string;
  fullPath: string;
  segments: string[];
}

/**
 * Универсальная функция для парсинга API URL
 * Извлекает имя модуля, имя каталога и другую информацию из URL
 *
 * @param url URL для парсинга (например, http://localhost:5173/catalog/api/v1/charValueType/)
 * @returns Объект с информацией о URL
 */
export function parseBackendApiUrl(url: string): ApiUrlInfo {
  // Инициализируем переменные с дефолтными значениями
  let moduleName = '';
  let segments: string[] = [];
  let parsedUrl: URL;

  try {
    // Для абсолютных URL парсим напрямую
    if (url.startsWith('http://') || url.startsWith('https://')) {
      parsedUrl = new URL(url);
    }
    // Для относительных URL используем базовый URL
    else if (url.startsWith('/')) {
      // Используем текущий домен как базовый URL
      parsedUrl = new URL(url, window.location.origin);
    } else {
      // Для других случаев выбрасываем ошибку
      throw new Error(
        `Некорректный формат URL: ${url}. URL должен начинаться с http://, https:// или /`,
      );
    }

    // Разбиваем путь на сегменты, фильтруя пустые сегменты иначе
    // /catalog/api/v1/ получим ['', 'catalog', 'api', 'v1', '']
    segments = parsedUrl.pathname.split('/').filter(Boolean);
    // Модуль - это первый сегмент пути
    moduleName = segments[0] || '';
  } catch (error) {
    console.error('Ошибка при парсинге URL:', error);
    segments = [];
    moduleName = '';
  }

  // Имя каталога - последний сегмент пути, если есть как минимум 2 сегмента
  let catalogName = '';
  if (segments.length >= 2) {
    catalogName = segments[segments.length - 1];
  }

  return {
    moduleName,
    catalogName,
    fullPath: url,
    segments,
  };
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
