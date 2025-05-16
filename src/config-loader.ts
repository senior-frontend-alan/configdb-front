// Загружает нужные модули в приложение из файла app.config.json
import { ref, readonly } from 'vue';
import configData from '../app.config.json';

// Типы для конфигурации
export interface ModuleRoutes {
  getCatalog: string;
}

export interface ModuleConfig {
  viewname: string;
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

// Создаем реактивную ссылку на конфигурацию
const config = ref<Config>(configData as Config);

// Композабл для доступа к конфигурации
export function useConfig() {
  return {
    // Возвращаем только для чтения версию конфигурации
    config: readonly(config),

    // Получение конфигурации модуля по viewname
    getModuleConfig: (moduleId: string) => {
      const module = config.value.modules.find((m) => m.viewname === moduleId);
      if (!module) {
        console.error(`Модуль с viewname ${moduleId} не найден в конфигурации`);
        return null;
      }
      return module;
    },
  };
}

// Инициализация конфигурации
export function initConfig() {
  // Здесь можно добавить логику для загрузки конфигурации с сервера
  console.log('Конфигурация инициализирована:', config.value.appConfig.name);
  return config.value;
}
