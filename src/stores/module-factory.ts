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
    results: any[]; // Основные данные в виде массива
    loadedCount?: number; // Количество загруженных записей
    [key: string]: any;
  };
  OPTIONS: any;
  // Динамические поля edit_{id} для редактирования записей
  // Каждое поле содержит Map с изменениями для конкретной записи
  [key: string]: any;
}

/**
 * Тип, описывающий структуру стора модуля
 */
export interface ModuleStore {
  getCatalog: string;
  catalogGroups: CatalogsAPIResponseGET;
  indexCatalogsByApplName: Record<string, Map<string, any>>; // Старое поле для обратной совместимости
  jsInterface: ModuleJSInterface;
  loading: boolean;
  error: any | null;
  fetchCatalogGroups: (moduleName: string) => Promise<any[]>;
  initCatalog: (applName: string, catalogName: string) => Catalog;
  initEditField: (applName: string, catalogName: string, recordId: string) => Map<string, any>;
  // Динамические каталоги будут добавляться с ключами "applName_catalogName"
  [catalogKey: string]: any;
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
      indexCatalogsByApplName: {} as Record<string, Map<string, any>>,
      jsInterface: {
        ...baseJSInterface,
        // Специфичные для модуля функции можно добавить здесь
      } as ModuleJSInterface,
      loading: false,
      error: null as any | null,
    }),

    // Добавляем раздел геттеров
    getters: {
      // Геттеры могут быть добавлены позже
    },

    // Добавляем раздел действий
    actions: {
      // Инициализация каталога в сторе (делает его реактивным и видимым в DevTools)
      initCatalog(applName: string, catalogName: string): Catalog {
        const catalogKey = `${applName}_${catalogName.toLowerCase()}`;

        // Проверяем, существует ли уже каталог
        if ((this as any)[catalogKey]) {
          return (this as any)[catalogKey];
        }

        // Создаем новый каталог с базовой структурой
        const newCatalog: Catalog = {
          GET: {
            results: [], // Массив записей
            loadedCount: 0, // Количество загруженных записей
          },
          OPTIONS: {},
        };

        // Добавляем каталог напрямую в стор потому что $patch не создает каталог, но зато делает его видимым в DevTools
        (this as any)[catalogKey] = newCatalog;

        // Дополнительно используем $patch для обеспечения видимости в Vue DevTools
        this.$patch({
          [catalogKey]: newCatalog,
        });

        return newCatalog;
      },

      // Инициализация поле для конкретной записи
      initEditField(applName: string, catalogName: string, recordId: string): Map<string, any> {
        const catalogKey = `${applName}_${catalogName.toLowerCase()}`;
        const editKey = `edit_${recordId}`;

        // Проверяем, существует ли каталог
        if (!(this as any)[catalogKey]) {
          console.error(`Каталог ${catalogKey} не найден, сначала инициализируйте его`);
          return new Map<string, any>();
        }

        // Проверяем, существует ли уже поле
        if ((this as any)[catalogKey][editKey]) {
          return (this as any)[catalogKey][editKey];
        }

        const editField = new Map<string, any>();

        // Добавляем поле редактирования напрямую потому что $patch не создает поле, но зато делает его видимым в DevTools
        (this as any)[catalogKey][editKey] = editField;

        // Дополнительно используем $patch для обеспечения видимости в Vue DevTools
        this.$patch({
          [catalogKey]: {
            ...(this as any)[catalogKey],
            [editKey]: editField,
          },
        });

        return editField;
      },

      // Инициализация поля несохраненных изменений
      initUnsavedChangesField(applName: string, catalogName: string, recordId: string): any {
        const catalogKey = `${applName}_${catalogName.toLowerCase()}`;
        const unsavedChangesKey = `unsavedChanges_${recordId}`;

        // Проверяем, существует ли каталог
        if (!(this as any)[catalogKey]) {
          console.error(`Каталог ${catalogKey} не найден, сначала инициализируйте его`);
          return {};
        }

        // Проверяем, существует ли уже поле
        if ((this as any)[catalogKey][unsavedChangesKey]) {
          return (this as any)[catalogKey][unsavedChangesKey];
        }

        const unsavedChangesField = {};

        // Добавляем поле несохраненных изменений
        (this as any)[catalogKey][unsavedChangesKey] = unsavedChangesField;

        // Дополнительно используем $patch для обеспечения видимости в Vue DevTools
        this.$patch({
          [catalogKey]: {
            ...(this as any)[catalogKey],
            [unsavedChangesKey]: unsavedChangesField,
          },
        });

        return unsavedChangesField;
      },
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
