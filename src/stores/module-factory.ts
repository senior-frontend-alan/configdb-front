// src/stores/module-factory.ts
import { defineStore, getActivePinia } from 'pinia';
import api from '../api';
import { CatalogService } from '../services/CatalogService';
import { RecordService } from '../services/RecordService';
import appConfigData, { type Module } from '../../app.config';
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
export function useModuleStore(moduleName: string) {
  // Проверка на пустое значение moduleName
  if (!moduleName || moduleName.trim() === '') {
    console.error('Невозможно получить стор: moduleName не указан или пуст');
    return null;
  }

  // Получаем активный экземпляр Pinia
  const pinia = getActivePinia();

  if (!pinia) {
    console.error('Не найден активный экземпляр Pinia');
    return null;
  }

  // ID стора формируется на основе имени модуля
  // МодульНейм уже является идентификатором стора
  const storeId = `${moduleName}`;

  try {
    // Используем стандартную функцию Pinia для получения стора по ID
    // @ts-ignore - игнорируем ошибку типизации, так как мы знаем, что стор существует
    return pinia._s.get(storeId);
  } catch (err) {
    console.error(`Ошибка при получении стора ${storeId}:`, err);
    return null;
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

/**
 * Обеспечивает загрузку иерархии данных: модуль -> каталог -> запись
 * @param moduleName Имя модуля
 * @param catalogName Опционально: имя каталога
 * @param recordId Опционально: ID записи
 * @returns Promise<boolean> Успешность загрузки
 */
export async function ensureHierarchyLoaded(
  moduleName: string,
  catalogName?: string,
  recordId?: string,
): Promise<boolean> {
  console.log(
    `Запущена загрузка иерархии для модуля: ${moduleName}, каталог: ${
      catalogName || 'не указан'
    }, запись: ${recordId || 'не указана'}`,
  );
  try {
    // Шаг 1: Проверка существования модуля в конфигурации
    const moduleConfig = appConfigData.modules.find((m) => m.urlPath === moduleName);
    if (!moduleConfig) {
      console.error(`Модуль ${moduleName} не найден в конфигурации`);
      return false;
    }
    
    // Шаг 2: Проверка наличия стора модуля
    // Функция initializeModuleStores в main.ts отвечает за создание всех сторов при запуске приложения
    const moduleStore = useModuleStore(moduleName);

    // Если стор не найден, выдаем ошибку
    if (!moduleStore) {
      console.error(`Стор для модуля ${moduleName} не найден. Сторы должны быть созданы при инициализации приложения`);
      return false;
    }

    // Проверяем, загружены ли группы каталогов
    console.log(
      `Проверка наличия групп каталогов для модуля ${moduleName}:`,
      moduleStore.catalogGroups
        ? `загружено ${moduleStore.catalogGroups.length} групп`
        : 'не загружены',
    );
    if (!moduleStore.catalogGroups || moduleStore.catalogGroups.length === 0) {
      try {
        // Загружаем группы каталогов через специализированную функцию
        const result = await loadCatalogGroups(moduleName);

        if (result && result.length > 0) {
          console.log(`Модуль ${moduleName} успешно загружен`);
        } else {
          console.error(`Не удалось загрузить данные для модуля ${moduleName}`);
          return false;
        }
      } catch (error) {
        console.error(`Ошибка при загрузке модуля ${moduleName}:`, error);
        return false;
      }
    } else {
      console.log(`Модуль ${moduleName} уже загружен, используем кэш`);
    }

    // Если нужно загрузить только модуль, возвращаем успех
    if (!catalogName) return true;

    // Шаг 2: Загрузка каталога (B)
    // Проверяем, загружен ли каталог
    if (!moduleStore.catalogsByName?.[catalogName]) {
      try {
        // Загружаем каталог через отдельные функции
        const pageSize = 20; // Стандартный размер страницы

        // Загружаем данные через CatalogService и OPTIONS запрос параллельно
        const [firstPageData] = await Promise.all([
          CatalogService.GET(moduleName, catalogName, 1, pageSize),
          CatalogService.OPTIONS(moduleName, catalogName),
        ]);

        if (firstPageData && firstPageData.length > 0) {
          console.log(`Каталог ${catalogName} успешно загружен`);
        } else {
          console.warn(`Предупреждение: Не удалось загрузить данные для каталога ${catalogName}`);
        }
      } catch (error) {
        console.error(`Ошибка при загрузке каталога ${catalogName}:`, error);
        return false;
      }
    } else {
      console.log(`Каталог ${catalogName} уже загружен, используем кэш`);
    }

    // Если нужно загрузить только каталог, возвращаем успех
    if (!recordId) return true;

    // Шаг 3: Загрузка записи (C) с использованием RecordService
    try {
      // Используем RecordService вместо прямого вызова moduleStore.loadRecord
      await RecordService.GET(moduleName, catalogName, recordId);
      console.log(`Запись ${recordId} успешно загружена`);
      return true;
    } catch (error) {
      console.error(`Ошибка при загрузке записи ${recordId}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`Ошибка при загрузке иерархии данных:`, error);
    return false;
  }
}

/**
 * Загружает группы каталогов для модуля и сохраняет их в сторе
 * @returns Promise<any[]> Загруженные группы каталогов
 */
async function loadCatalogGroups(moduleName: string): Promise<any[]> {
  console.log(`Запущена загрузка групп каталогов для модуля: ${moduleName}`);
  try {
    // Получаем стор модуля
    const moduleStore = useModuleStore(moduleName);
    console.log(`Получен стор для модуля ${moduleName}:`, moduleStore ? 'успешно' : 'не найден');
    if (!moduleStore) {
      console.error(`Не удалось получить стор для модуля ${moduleName}`);
      return [];
    }

    // Выполняем запрос к API для получения групп каталогов
    const response = await api.get(moduleStore.getCatalog);

    // Создаем плоский индекс для быстрого доступа к элементам каталога по viewname
    const newcatalogGroupsIndex = new Map();

    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((group: any) => {
        if (group.items && Array.isArray(group.items)) {
          group.items.forEach((item: any) => {
            if (item.viewname) {
              // Добавляем в общий индекс
              newcatalogGroupsIndex.set(item.viewname, item);

              // Добавляем в индекс по appl_name
              if (item.appl_name) {
                // Если индекса для этого appl_name еще нет, создаем его в объекте appl_name
                if (!moduleStore.appl_name[item.appl_name]) {
                  moduleStore.appl_name[item.appl_name] = new Map<string, any>();
                }

                // Добавляем в индекс по appl_name
                moduleStore.appl_name[item.appl_name].set(item.viewname, item);
              }
            }
          });
        }
      });
    }

    // Используем преимущества shallowRef для обновления данных
    // При прямом присваивании нового массива, shallowRef триггерит реактивность
    // и обновление в DevTools
    moduleStore.catalogGroups = response.data;
    moduleStore.catalogGroupsIndex = newcatalogGroupsIndex;

    console.log('Группы каталогов обновлены:', moduleStore.catalogGroups);
    console.log(
      'Индекс каталога обновлен, количество элементов:',
      moduleStore.catalogGroupsIndex.size,
    );

    return response.data;
  } catch (err) {
    console.error(`Ошибка при получении групп каталогов для модуля ${moduleName}:`, err);
    return [];
  }
}

interface Catalog {
  GET: {
    resultsIndex: Map<string, any>;
    loadedRanges?: Array<{ start: number; end: number }>;
    [key: string]: any;
  };
  OPTIONS: any;
  unsavedChanges: any;
  moduleName: string;
  url: string;
  [key: string]: any;
}

/**
 * Инициализирует структуру каталога в сторе
 * @param moduleName Имя модуля
 * @param catalogName Имя каталога
 * @param url URL каталога (опционально)
 */
export function initCatalogStructure(
  moduleName: string,
  catalogName: string,
  url: string = '',
): void {
  const moduleStore = useModuleStore(moduleName);

  // Инициализируем catalogsByName, если его еще нет
  if (!moduleStore.catalogsByName) {
    moduleStore.catalogsByName = {};
  }

  // Создаем структуру для каталога, если её нет
  if (!moduleStore.catalogsByName[catalogName]) {
    moduleStore.catalogsByName[catalogName] = {
      GET: {
        resultsIndex: new Map<string, any>(),
        loadedRanges: {},
      },
      OPTIONS: {},
      unsavedChanges: {},
      moduleName,
      url,
    } as Catalog;
  } else {
    // Если структура существует, но нет GET
    if (!moduleStore.catalogsByName[catalogName].GET) {
      moduleStore.catalogsByName[catalogName].GET = {
        resultsIndex: new Map<string, any>(),
        loadedRanges: {},
      };
    } else {
      // Если есть GET, но нет необходимых полей
      if (!moduleStore.catalogsByName[catalogName].GET.resultsIndex) {
        moduleStore.catalogsByName[catalogName].GET.resultsIndex = new Map<string, any>();
      }

      if (!moduleStore.catalogsByName[catalogName].GET.loadedRanges) {
        moduleStore.catalogsByName[catalogName].GET.loadedRanges = [];
      }
    }

    // Обновляем URL, если он не был установлен ранее или передан новый
    if (!moduleStore.catalogsByName[catalogName].url && url) {
      moduleStore.catalogsByName[catalogName].url = url;
    }
  }
}

export function createModuleStore(moduleConfig: Module) {
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
      catalogGroupsIndex: new Map<string, any>(),
      // т.к. В Pinia есть ограничения с динамическими полями в сторе.
      // Динамически добавленные свойства не будут реактивными и не будут отображаться в Vue DevTools,
      // если они не были объявлены в исходном состоянии стора.
      // поэтому сохраняем в appl_name
      appl_name: {} as Record<string, Map<string, any>>,
      jsInterface: {
        ...baseJSInterface,
        // Специфичные для модуля функции можно добавить здесь
      } as ModuleJSInterface,
      loading: false,
      error: null as any | null,
      catalogsByName: {} as Record<string, Catalog>,
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
