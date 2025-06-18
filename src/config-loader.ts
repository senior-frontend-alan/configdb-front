// Загружает нужные модули в приложение из файла app.config.json
import { ref, readonly } from 'vue';
import axios from 'axios';

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
const config = ref<Config | null>(null);
const configLoaded = ref<boolean>(false);
const configError = ref<Error | null>(null);

// Функция для загрузки конфигурации из файла app.config.json
export async function loadConfig(): Promise<Config> {
  // Если конфигурация уже загружена, возвращаем её
  if (configLoaded.value && config.value) {
    return config.value;
  }

  try {
    // Загружаем конфигурацию через AJAX запрос
    console.log('Загрузка конфигурации из app.config.json...');
    const response = await axios.get<Config>('/app.config.json');
    
    // Сохраняем конфигурацию
    config.value = response.data;
    configLoaded.value = true;
    configError.value = null;
    
    console.log('Конфигурация успешно загружена:', config.value.appConfig.name);
    return config.value;
  } catch (error) {
    console.error('Ошибка при загрузке конфигурации:', error);
    configError.value = error instanceof Error ? error : new Error('Неизвестная ошибка при загрузке конфигурации');
    throw configError.value;
  }
}

// Композабл для доступа к конфигурации
export function useConfig() {
  return {
    // Возвращаем только для чтения версию конфигурации
    config: readonly(config),
    configLoaded: readonly(configLoaded),
    configError: readonly(configError),
  };
}

// Инициализация конфигурации - для обратной совместимости
export function initConfig(): Promise<Config> {
  return loadConfig();
}
