// src/stores/module-factory.ts
import { defineStore, getActivePinia } from 'pinia';
import { type Module } from '../types/global';
import type { CatalogsAPIResponseGET } from './types/catalogsAPIResponseGET.type';

// Типы для JS-функций модулей
export interface ModuleJSInterface {
  [functionName: string]: Function;
}

// Базовые JS-функции, доступные для всех модулей
const baseJSInterface: ModuleJSInterface = {
  // Вспомогательная функция для проверки строкового типа
  isString: function (value: any): boolean {
    return typeof value === 'string' || value instanceof String;
  },

  // Форматирует значение с единицами измерения
  amountWithUnits: function (
    r: any,
    amount_field: string,
    units_field: string,
    displaySettings: any = {},
  ) {
    let amount = r[amount_field];

    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }

    if (amount != null) {
      amount = amount.toFixed(displaySettings?.roundDecimals ?? 2);
    }

    amount = amount ?? '-';

    const units = r[units_field];
    if (units?.name) {
      return `${amount} ${units.name}`;
    }
    return `${amount}`;
  },

  // Обрезание текста до указанной длины с добавлением многоточия
  truncateText: function (text: string, maxLength: number = 100, suffix: string = '...'): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + suffix;
  },

  // Форматирование денежных значений с указанием валюты
  formatCurrency: function (
    value: number,
    currency: string = 'RUB',
    locale: string = 'ru-RU',
  ): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },

  // Преобразование строки в camelCase
  toCamelCase: function (text: string): string {
    if (!text) return '';
    return text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
        index === 0 ? letter.toLowerCase() : letter.toUpperCase(),
      )
      .replace(/\s+/g, '');
  },

  // Преобразование строки в snake_case
  toSnakeCase: function (text: string): string {
    if (!text) return '';
    return text
      .replace(/\s+/g, '_')
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  },
};

// Маршрутизатор → Стор → Компоненты
// Модуль-фабрика отвечает за создание и управление сторами
// Сторы должны получать moduleName от роутера через параметры или композабл useModuleName

// 4. Стор (Pinia)
// Отвечает за: Хранение данных и состояния приложения
// Задачи:
// Предоставление доступа к данным для компонентов
// Хранение загруженных данных
// Отслеживание состояния загрузки (loading, error)

// Функция для получения стора модуля по moduleName
// с жесткой проверкой (выбрасываем exeption)
export function useModuleStore(moduleName: string): ModuleStore {
  if (!moduleName || moduleName.trim() === '') {
    throw new Error('Невозможно получить стор: moduleName не указан или пуст');
  }

  const pinia = getActivePinia();

  if (!pinia) {
    throw new Error('Не найден активный экземпляр Pinia');
  }

  // ID стора = имя модуля
  const storeId = `${moduleName}`;

  try {
    // Используем стандартную функцию Pinia для получения стора по ID
    // @ts-ignore - игнорируем ошибку типизации, так как мы знаем, что стор существует
    const store = pinia._s.get(storeId);

    // жесткая проверка на существование стора и выбрасываем исключение, если стор не найден:
    if (!store) {
      throw new Error(`Стор для модуля ${moduleName} не найден`);
    }

    return store;
  } catch (err) {
    console.error(`Ошибка при получении стора ${storeId}:`, err);
    throw new Error(
      `Ошибка при получении стора для модуля ${moduleName}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}
// подход с иерархическими зависимостями
// Явно определена последовательность загрузки: модуль → каталог → запись
// Каждый следующий уровень загружается только если предыдущий успешно загружен

// Гибкость в зависимости от глубины маршрута:
// Метод принимает опциональные параметры и загружает только необходимые уровни
// Для маршрута /module загрузит только модуль
// Для маршрута /module/catalog загрузит модуль и каталог
// Для маршрута /module/catalog/record загрузит всю иерархию

export interface Catalog {
  GET: {
    resultsIndex: Map<string, any>;
    loadedRanges?: Record<string, { start: number; end: number; page: number; timestamp: number }>;
    [key: string]: any;
  };
  OPTIONS: any;
  unsavedChanges: any;
  moduleName: string;
  [key: string]: any;
}

/**
 * Инициализирует структуру каталога в сторе, если она отсутствует
 * @param moduleName Имя модуля
 * @param applName Имя приложения
 * @param catalogName Имя каталога
 * @returns Ссылка на структуру каталога в сторе
 */
export function getOrInitCatalogStructure(
  moduleName: string,
  applName: string,
  catalogName: string,
): Catalog {
  const moduleStore = useModuleStore(moduleName);
  // Приводим название каталога к нижнему регистру для унификации
  const catalog = catalogName.toLowerCase();

  // Инициализируем вложенные объекты, если они отсутствуют
  if (!moduleStore.loadedCatalogsByApplName) {
    moduleStore.loadedCatalogsByApplName = {};
  }

  if (!moduleStore.loadedCatalogsByApplName[applName]) {
    moduleStore.loadedCatalogsByApplName[applName] = {};
  }

  // Проверяем существование структуры каталога
  const catalogExists = moduleStore.loadedCatalogsByApplName[applName][catalog] !== undefined;

  // Если каталог не существует, создаем его с нуля
  if (!catalogExists) {
    moduleStore.loadedCatalogsByApplName[applName][catalog] = {
      GET: {
        results: [],
        totalCount: 0,
        resultsIndex: new Map<string, any>(),
        loadedRanges: {},
      },
      OPTIONS: null,
      unsavedChanges: null,
      moduleName,
    } as Catalog;
  }

  // Возвращаем ссылку на структуру каталога
  return moduleStore.loadedCatalogsByApplName[applName][catalog];
}

/**
 * Тип, описывающий структуру стора модуля
 */
export interface ModuleStore {
  getCatalog: string;
  catalogGroups: CatalogsAPIResponseGET;
  indexCatalogsByApplName: Record<string, Map<string, any>>;
  jsInterface: ModuleJSInterface;
  loading: boolean;
  error: any | null;
  loadedCatalogsByApplName: Record<string, Record<string, Catalog>>;
  fetchCatalogGroups: (moduleName: string) => Promise<any[]>;
  getOrInitCatalogStructure: (moduleName: string, applName: string, catalogName: string) => Catalog;
}

// Изменяем тип возвращаемого значения на более общий, чтобы избежать ошибок типизации
export function createModuleStore(moduleConfig: Module): any {
  // moduleName из URL конфига для использования в качестве идентификатора стора
  const moduleNameFromUrl = moduleConfig.urlPath;
  console.log(
    'Создание стора для модуля:',
    moduleNameFromUrl,
    'из конфигурации, URL API:',
    moduleConfig.routes.getCatalog,
  );

  // Если не удалось извлечь имя модуля, выбрасываем ошибку
  if (!moduleNameFromUrl) {
    throw new Error(`Не удалось извлечь имя модуля из URL: ${moduleConfig.routes.getCatalog}`);
  }

  const storeId = moduleNameFromUrl;

  // Используем объектный синтаксис для определения стора
  return defineStore(`${storeId}`, {
    // Определяем начальное состояние стора
    state: () => ({
      getCatalog: moduleConfig.routes['getCatalog'],
      catalogGroups: [] as CatalogsAPIResponseGET,
      // т.к. В Pinia есть ограничения с динамическими полями в сторе.
      // Динамически добавленные свойства не будут реактивными и не будут отображаться в Vue DevTools,
      // если они не были объявлены в исходном состоянии стора.
      // поэтому сохраняем в indexCatalogsByApplName
      indexCatalogsByApplName: {} as Record<string, Map<string, any>>, // индекс каталогов по приложению
      jsInterface: {
        ...baseJSInterface,
        // Специфичные для модуля функции можно добавить здесь
      } as ModuleJSInterface,
      loading: false,
      error: null as any | null,
      loadedCatalogsByApplName: {} as Record<string, Record<string, Catalog>>, // каталоги сгруппированы по имени приложения
    }),

    // Добавляем раздел геттеров
    getters: {
      // Геттеры могут быть добавлены позже
    },

    // Добавляем раздел действий
    actions: {
      // Действия будут добавлены позже
    },
  });
}

// Метод для получения JS-функций модуля
// const getJSInterface = async (): Promise<ModuleJSInterface> => {
//   loading.value = true;

// try {
// Все базовые функции теперь находятся в baseJSInterface
// console.log(`JS-функции для модуля ${extractModuleNameFromUrl(moduleConfig.routes.getCatalog)} успешно загружены:`, Object.keys(baseJSInterface).join(', '));

// return jsInterface;

// TODO: Не удалять! в будущем будет использоваться для загрузки JS-функций
// Формируем URL для запроса JS-функций
// const routes = moduleConfig.routes as unknown as Record<string, string>;
// const jsUrl = routes['getJSInterface'];

// console.log(`Загрузка JS-функций из: ${jsUrl}`);

// // Загружаем JS-код как текст через API-клиент
// const response = await api.get(jsUrl, {
//   responseType: 'text',
//   headers: { 'Content-Type': 'text/plain' },
// });

// const jsCode = response.data;

// Выполняем код и получаем функции напрямую
// try {
//   // Создаем функцию, которая выполнит код модуля и вернет объект с функциями
//   const moduleFunction = new Function(`
//     // Создаем переменную module для экспорта функций
//     const module = { exports: {} };

//     // Выполняем код модуля в изолированном контексте
//     ${jsCode}

//     // Возвращаем экспортированные функции
//     return module.exports;
//   `);

//   // Выполняем функцию и получаем объект с функциями
//   const moduleFunctions = moduleFunction();

//   // Копируем функции в объект
//   Object.assign(JSIFunctions, moduleFunctions);

//   // Выводим информацию о загруженных функциях
//   const loadedFunctions = Object.keys(JSIFunctions).filter(
//     (key) => !Object.keys(baseJSFunctions).includes(key),
//   );
//   console.log(
//     `JS-функции для модуля ${extractModuleNameFromUrl(moduleConfig.routes.getCatalog)} успешно загружены: ${loadedFunctions.join(
//       ', ',
//     )}`,
//   );
// } catch (evalError) {
//   console.error(`Ошибка выполнения кода JS-функций:`, evalError);
// }

// return JSIFunctions;
// } catch (err) {
//   console.error(`Ошибка при получении JS-функций для модуля ${extractModuleNameFromUrl(moduleConfig.routes.getCatalog)}:`, err);
//   return JSIFunctions;
// } finally {
//   loading.value = false;
// }
// };

// // загрузка JS-функций начнётся автоматически при создании стора
// const initialize = async (): Promise<void> => {
//   try {
//     // Проверяем, есть ли маршрут для загрузки JS-функций
//     const routes = moduleConfig.routes as unknown as Record<string, string>;
//     if (routes['getJSInterface']) {
//       await getJSInterface();
//     }
//   } catch (error: any) {
//     console.error(`Ошибка при инициализации стора модуля ${extractModuleNameFromUrl(moduleConfig.routes.getCatalog)}:`, error);
//   }
// };
