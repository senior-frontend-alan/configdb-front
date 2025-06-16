// src/stores/module-factory.ts
import { defineStore, getActivePinia } from 'pinia';
import { ref, reactive, shallowRef } from 'vue';
import api from '../api';
import { CatalogService } from '../services/CatalogService';
import { RecordService } from '../services/RecordService';
import { useConfig, parseBackendApiUrl } from '../config-loader';
import { FieldTypeService } from '../services/fieldTypeService';
import type { ModuleConfig } from '../config-loader';
import type { CatalogsAPIResponseGET } from './types/catalogsAPIResponseGET.type';
import type {
  CatalogDetailsAPIResponseOPTIONS,
  CatalogDetailsAPIResponseGET,
  CatalogDetailsAPIResponsePATCH,
  Layout,
} from './types/catalogDetailsAPIResponseOPTIONS.type';

// Расширяем интерфейс Layout для включения дополнительных свойств
interface ExtendedLayout extends Layout {
  TABLE_COLUMNS: Map<string, any>; // Соответствует возвращаемому значению createTableColumns
  elementsIndex: Map<string, any>; // Соответствует возвращаемому значению createElementsMap
}

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

  const { config } = useConfig();

  // Находим модуль напрямую в конфигурации
  const moduleConfig = config.value.modules.find((m) => {
    const extractedModuleName = parseBackendApiUrl(m.routes.getCatalog).moduleName;
    return extractedModuleName === moduleName;
  });

  if (!moduleConfig) {
    console.error(`Модуль с moduleName '${moduleName}' не найден в конфигурации`);
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
  try {
    // Шаг 1: Загрузка модуля (A)
    const moduleStore = useModuleStore(moduleName);
    if (!moduleStore) {
      console.error(`Не удалось получить стор для модуля ${moduleName}`);
      return false;
    }

    // Проверяем, загружены ли группы каталогов
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
          loadCatalogOPTIONS(moduleName, catalogName),
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
  try {
    // Получаем стор модуля
    const moduleStore = useModuleStore(moduleName);
    if (!moduleStore) {
      console.error(`Не удалось получить стор для модуля ${moduleName}`);
      return [];
    }

    // Формируем URL для запроса к API
    const { config } = useConfig();
    const moduleConfig = config.value.modules.find((m) => {
      const extractedModuleName = parseBackendApiUrl(m.routes.getCatalog).moduleName;
      return extractedModuleName === moduleName;
    });

    if (!moduleConfig) {
      console.error(`Модуль ${moduleName} не найден в конфигурации`);
      return [];
    }

    const url = moduleConfig.routes.getCatalog;
    console.log(`Отправка запроса на ${url}`);

    const response = await api.get(url);

    // Создаем плоский индекс для быстрого доступа к элементам каталога по viewname
    const newcatalogGroupsIndex = new Map();

    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((group: any) => {
        if (group.items && Array.isArray(group.items)) {
          group.items.forEach((item: any) => {
            if (item.viewname) {
              newcatalogGroupsIndex.set(item.viewname, item);
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

// Загрузка метаданных каталога через OPTIONS-запрос и формирование структуры OPTIONS в сторе
async function loadCatalogOPTIONS(moduleName: string, catalogName: string): Promise<string> {
  const moduleStore = useModuleStore(moduleName);
  if (!moduleStore) {
    throw new Error(`Стор для модуля ${moduleName} не найден`);
  }

  // ШАГ 1: Поиск URL для загрузки каталога
  let url = '';

  // Если каталог уже есть в сторе и у него есть URL, используем его
  if (moduleStore.catalogsByName?.[catalogName]?.url) {
    url = moduleStore.catalogsByName[catalogName].url;
    console.log(`Используем сохраненный URL для каталога ${catalogName}: ${url}`);
  } else {
    // Иначе ищем URL в индексе элементов каталога
    const catalogItem = moduleStore.catalogGroupsIndex.get(catalogName);

    if (!catalogItem || !catalogItem.href) {
      throw new Error(`URL для каталога ${catalogName} не найден в индексе`);
    }

    url = catalogItem.href;
    console.log(`Найден URL для каталога ${catalogName} в индексе: ${url}`);
  }

  // ШАГ 2: Загрузка метаданных через OPTIONS-запрос
  const optionsResponse = await api.options<CatalogDetailsAPIResponseOPTIONS>(url);
  const optionsResponseData = optionsResponse.data;

  // Добавляем наши вычисляемые поля в OPTIONS для удобства
  if (optionsResponseData?.layout) {
    // Приводим layout к расширенному типу ExtendedLayout
    const layout = optionsResponseData.layout as ExtendedLayout;

    // Создаем таблицу колонок с учетом порядка из display_list
    layout.TABLE_COLUMNS = createTableColumns(layout);

    // Создаем иерархическую структуру элементов
    layout.elementsIndex = createElementsMap(layout.elements);
  }

  // Инициализируем структуру каталога в сторе
  initCatalogStructure(moduleName, catalogName, url);

  moduleStore.catalogsByName[catalogName].OPTIONS = optionsResponseData;

  console.log(
    `Метаданные каталога ${catalogName} успешно загружены через OPTIONS и сохранены в сторе`,
  );
  return url;
}

interface Catalog {
  GET: {
    resultsIndex: Map<string, any>;
    loadedRanges?: Array<{ start: number; end: number }>;
    [key: string]: any;
  };
  OPTIONS: any;
  PATCH: any;
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
        loadedRanges: [],
      },
      OPTIONS: {},
      PATCH: {},
      moduleName,
      url,
    } as Catalog;
  } else {
    // Если структура существует, но нет GET
    if (!moduleStore.catalogsByName[catalogName].GET) {
      moduleStore.catalogsByName[catalogName].GET = {
        resultsIndex: new Map<string, any>(),
        loadedRanges: [],
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

export function createModuleStore(moduleConfig: ModuleConfig) {
  // moduleName из URL конфига для использования в качестве идентификатора стора
  const parsedUrl = parseBackendApiUrl(moduleConfig.routes.getCatalog);
  const moduleNameFromUrl = parsedUrl.moduleName;
  console.log(
    'Создание стора для модуля:',
    moduleNameFromUrl,
    'из URL:',
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
      url: moduleConfig.routes['getCatalog'],
      catalogGroups: [] as CatalogsAPIResponseGET,
      catalogGroupsIndex: new Map<string, any>(),
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

// Интерфейс для описания макета с элементами и списком отображения
interface LayoutWithElements {
  // Массив элементов макета
  elements: any[];
  // Опциональный список полей для отображения
  display_list?: string[];
}

// Функция для создания плоской Map-структуры со всеми полями из elements и их вложенных элементов
const createTableColumns = (obj: LayoutWithElements): Map<string, any> => {
  // Создаем плоскую Map для всех элементов
  const flatMap = new Map<string, any>();

  if (!obj?.elements || !Array.isArray(obj.elements)) {
    return flatMap;
  }

  // Получаем список отображаемых полей, если он есть
  const displayList = Array.isArray(obj.display_list) ? obj.display_list : [];

  // Рекурсивная функция для обработки элементов и их вложенных элементов
  const processElements = (elements: any[]): void => {
    elements.forEach((element: any) => {
      if (!element.name) return;

      // Для элементов с такими классами не обрабатываем вложенные элементы
      const isSpecialType =
        element.class_name === 'ViewSetInlineLayout' ||
        element.class_name === 'ViewSetInlineDynamicLayout' ||
        element.class_name === 'ViewSetInlineDynamicModelLayout' ||
        element.field_class === 'ListSerializer';

      if (isSpecialType) {
        return;
      }

      const FRONTEND_CLASS = FieldTypeService.getFieldType(element);

      // Если это поле типа Choice, создаем Map-структуру для быстрого доступа к значениям
      let CHOICES: Map<string, string> | undefined;
      if (FRONTEND_CLASS === 'Choice' && element.choices && Array.isArray(element.choices)) {
        CHOICES = new Map<string, string>();
        element.choices.forEach((choice: { value: string | number; display_name: string }) => {
          CHOICES?.set(String(choice.value), choice.display_name);
        });
      }

      // Определяем видимость элемента на основе display_list
      // Если display_list пуст, то все элементы видимы, иначе только те, которые в списке
      const VISIBLE = displayList.length === 0 || displayList.includes(element.name);

      const elementCopy = {
        ...element,
        FRONTEND_CLASS,
        VISIBLE,
        ...(CHOICES ? { CHOICES } : {}),
      };

      flatMap.set(element.name, elementCopy);

      // Рекурсивно обрабатываем вложенные элементы, если они есть
      if (element.elements && Array.isArray(element.elements) && element.elements.length > 0) {
        processElements(element.elements);
      }
    });
  };

  processElements(obj.elements);

  const orderedMap = new Map<string, any>();

  // Если есть displayList, сначала добавляем элементы в порядке из displayList
  if (displayList.length > 0) {
    displayList.forEach((fieldName: string) => {
      if (flatMap.has(fieldName)) {
        orderedMap.set(fieldName, flatMap.get(fieldName));
      }
    });
  }

  // Добавляем все оставшиеся элементы, которых нет в orderedMap
  flatMap.forEach((value, key) => {
    if (!orderedMap.has(key)) {
      orderedMap.set(key, value);
    }
  });

  return orderedMap;
};

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

// Метод для обновления записи в сторе после PATCH-запроса
const updateRecordInStore = (catalogName: string, recordId: string, updatedData: any): boolean => {
  try {
    // Проверяем, что данные для этого представления загружены
    if (!catalogsByName[catalogName] || !catalogsByName[catalogName].GET) {
      console.warn(`Невозможно обновить запись в сторе: данные для ${catalogName} не загружены`);
      return false;
    }

    // Получаем текущие данные
    const currentData = catalogsByName[catalogName].GET;

    // Проверяем, что есть Map resultsIndex
    if (!currentData.resultsIndex || !(currentData.resultsIndex instanceof Map)) {
      console.warn(
        `Невозможно обновить запись в сторе: нет Map resultsIndex в данных ${catalogName}`,
      );
      return false;
    }

    // Проверяем наличие записи в Map
    if (!currentData.resultsIndex.has(String(recordId))) {
      console.warn(
        `Невозможно обновить запись в сторе: запись с ID ${recordId} не найдена в ${catalogName}`,
      );
      return false;
    }

    // Обновляем запись в Map
    const existingRecord = currentData.resultsIndex.get(String(recordId));
    const updatedRecord = { ...existingRecord, ...updatedData };
    currentData.resultsIndex.set(String(recordId), updatedRecord);

    console.log(`Запись с ID ${recordId} успешно обновлена в сторе`);
    return true;
  } catch (error) {
    console.error(`Ошибка при обновлении записи в сторе:`, error);
    return false;
  }
};

// Функция для создания иерархической Map-структуры элементов
// Он добавляет дополнительные вычисляемые поля к элементам:
// FRONTEND_CLASS - определяет тип поля для фронтенда
// TABLE_COLUMNS - для элементов типа ViewSetInlineLayout
// elementsIndex - вложенная Map-структура для дочерних элементов
const createElementsMap = (elements: any[] | undefined): Map<string, any> => {
  const elementsIndex = new Map<string, any>();

  if (!elements || !Array.isArray(elements)) {
    return elementsIndex;
  }

  // Обрабатываем элементы текущего уровня
  elements.forEach((element) => {
    if (!element.name) return;

    element.FRONTEND_CLASS = FieldTypeService.getFieldType(element);

    // Добавляем элемент в Map текущего уровня
    elementsIndex.set(element.name, element);

    // Если это ViewSetInlineLayout, создаем TABLE_COLUMNS
    if (element.class_name === 'ViewSetInlineLayout' && element.elements?.length > 0) {
      // Создаем плоскую структуру для всех вложенных элементов
      element.TABLE_COLUMNS = createTableColumns(element);
    }

    // Если у элемента есть вложенные элементы, создаем для них свою Map-структуру
    if (element.elements?.length > 0) {
      // Создаем Map для вложенных элементов
      element.elementsIndex = createElementsMap(element.elements);
    }
  });

  return elementsIndex;
};
