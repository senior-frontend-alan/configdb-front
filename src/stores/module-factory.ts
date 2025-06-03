// src/stores/module-factory.ts
import { defineStore, getActivePinia } from 'pinia';
import { ref, reactive } from 'vue';
import api from '../api';
import { FieldTypeService } from '../services/fieldTypeService';
import { useConfig, parseBackendApiUrl } from '../config-loader';
import type { ModuleConfig } from '../config-loader';
import type { CatalogsAPIResponseGET } from './types/catalogsAPIResponseGET.type';
import type { CatalogDetailsAPIResponseGET } from './types/catalogDetailsAPIResponseGET.type';
import type { CatalogDetailsAPIResponseOPTIONS } from './types/catalogDetailsAPIResponseOPTIONS.type';

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

// Модуль-фабрика отвечает за создание и управление сторами
// Сторы используют результат функции, но не должны отвечать за извлечение имени модуля из URL
// Сторы должны получать moduleName от роутера через параметры или композабл useModuleName

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

export function createModuleStore(moduleConfig: ModuleConfig) {
  // Извлекаем moduleName из URL getCatalog для использования в качестве идентификатора стора
  // Это нужно для инициализации сторов при запуске приложения
  const moduleNameFromUrl = parseBackendApiUrl(moduleConfig.routes.getCatalog).moduleName;
  return defineStore(`${moduleNameFromUrl}`, () => {
    // состояние
    const moduleName = ref<string>(moduleConfig.label);
    const url = ref<string>(moduleConfig.routes['getCatalog']);
    const catalogGroups = ref<CatalogsAPIResponseGET>([]);

    // JS функции которые специфичны для конкретного модуля
    // Используем ref для видимости в Vue DevTools
    const jsInterface = ref<ModuleJSInterface>({
      ...baseJSInterface,

      // Специфичные для модуля функции
      // Можно добавить специфичные для модуля функции здесь
      // или загрузить их динамически из конфигурации
    });

    const loading = ref<boolean>(false);
    const error = ref<any | null>(null);

    // Сохраненные данные по различным moduleName - используем reactive вместо ref
    const catalogsByName = reactive<Record<string, any>>({});

    const loadCatalogGroups = async (): Promise<CatalogsAPIResponseGET> => {
      // Если данные уже загружены или запрос уже выполняется, возвращаем текущие данные
      if (catalogGroups.value && catalogGroups.value.length > 0) {
        const moduleNameFromUrl = parseBackendApiUrl(moduleConfig.routes.getCatalog).moduleName;
        console.log(
          `Данные для модуля ${moduleNameFromUrl} уже загружены, используем кэшированные данные`,
        );
        return catalogGroups.value;
      }

      loading.value = true;

      try {
        console.log(`Отправка запроса на ${url.value}`);
        const response = await api.get<CatalogsAPIResponseGET>(url.value);
        catalogGroups.value = response.data;
        error.value = null;
        return response.data;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при получении ${moduleConfig.label}:`, err);
        return [];
      } finally {
        loading.value = false;
      }
    };

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

      // Всегда возвращаем упорядоченную Map
      return orderedMap;
    };

    // loadCatalog это исполнитель, который непосредственно загружает данные по URL
    // нам точно нужно знать куда сохранять каталог
    const loadCatalog = async (
      moduleName: string,
      catalogName: string,
      url: string,
    ): Promise<any> => {
      loading.value = true;
      error.value = null;

      try {
        let getResponseData;
        let optionsResponseData;

        // !УДАЛИТЬ моковый блок if (только для теста!)
        if (url === 'http://localhost:5173/api/v1/draConfig/diamVendor/') {
          console.log('Загрузка моковых данных для diamVendor');

          // Импортируем моковые данные
          const { OPTIONS4 } = await import('../mocks/OPTIONS4.js');
          const { GET4 } = await import('../mocks/GET4.js');

          getResponseData = GET4;
          optionsResponseData = OPTIONS4;
        } else {
          // Добавляем параметр mode=short для получения сокращенных данных
          const detailsUrl = url.includes('?') ? `${url}&mode=short` : `${url}?mode=short`;
          const getResponse = await api.get<CatalogDetailsAPIResponseGET>(detailsUrl);
          const optionsResponse = await api.options<CatalogDetailsAPIResponseOPTIONS>(url);

          getResponseData = getResponse.data;
          optionsResponseData = optionsResponse.data;
        }
        // Добавляем наши вычисляемые поля в OPTIONS для удобства
        if (optionsResponseData?.layout) {
          // Создаем таблицу колонок с учетом порядка из display_list
          optionsResponseData.layout.TABLE_COLUMNS = createTableColumns(optionsResponseData.layout);

          // Создаем иерархическую структуру элементов
          optionsResponseData.layout.ELEMENTS = createElementsMap(
            optionsResponseData.layout.elements,
          );
        }

        // Преобразуем массив результатов в Map с ключами из поля id для быстрого доступа
        const resultsMap = new Map();
        if (getResponseData?.results && Array.isArray(getResponseData.results)) {
          getResponseData.results.forEach((item: any) => {
            if (item.id !== undefined) {
              resultsMap.set(String(item.id), item);
            }
          });
        }

        // Создаем новый объект с данными (общая логика для моковых и реальных данных)
        const detailsData = {
          GET: {
            ...getResponseData,
            RESULTS: resultsMap,
          },
          OPTIONS: optionsResponseData,
          PATCH: {}, // Поле для отслеживания изменений
          moduleName: moduleName,
          url: url,
        };

        // Напрямую обновляем реактивный объект
        catalogsByName[catalogName] = detailsData;

        console.log(
          `Данные для каталога ${catalogName} успешно загружены в стор:`,
          catalogsByName[catalogName],
        );

        error.value = null;
        return detailsData;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при загрузке данных для ${moduleName}:`, err);
        return null;
      } finally {
        loading.value = false;
      }
    };

    // Функция для создания иерархической Map-структуры элементов
    const createElementsMap = (elements: any[] | undefined): Map<string, any> => {
      const ELEMENTS = new Map<string, any>();

      if (!elements || !Array.isArray(elements)) {
        return ELEMENTS;
      }

      // Обрабатываем элементы текущего уровня
      elements.forEach((element) => {
        if (!element.name) return;

        element.FRONTEND_CLASS = FieldTypeService.getFieldType(element);

        // Добавляем элемент в Map текущего уровня
        ELEMENTS.set(element.name, element);

        // Если это ViewSetInlineLayout, создаем TABLE_COLUMNS
        if (element.class_name === 'ViewSetInlineLayout' && element.elements?.length > 0) {
          // Создаем плоскую структуру для всех вложенных элементов
          element.TABLE_COLUMNS = createTableColumns(element);
        }

        // Если у элемента есть вложенные элементы, создаем для них свою Map-структуру
        if (element.elements?.length > 0) {
          // Создаем Map для вложенных элементов
          element.ELEMENTS = createElementsMap(element.elements);
        }
      });

      return ELEMENTS;
    };

    // Функция для поиска URL каталога по имени модуля в уже загруженном каталоге (на шаге 1)
    // Предполагается, что каталог уже загружен до вызова этой функции
    const findUrlInCatalogGroups = (catalogName: string): string | null => {
      // Проверяем, что каталог загружен
      if (!catalogGroups.value || catalogGroups.value.length === 0) {
        const moduleNameFromUrl = parseBackendApiUrl(moduleConfig.routes.getCatalog).catalogName;
        console.warn(
          `Каталог для модуля ${moduleNameFromUrl} не загружен. Сначала нужно вызвать loadCatalogGroups()`,
        );
        return null;
      }

      // Ищем элемент каталога с нужным catalogName
      if (catalogGroups.value && catalogGroups.value.length > 0) {
        const catalogItem = catalogGroups.value
          .flatMap((group: { items?: any[] }) => group.items || [])
          .find((item: any) => {
            if (item.viewname) {
              return item.viewname === catalogName;
            }
            return false;
          });

        if (catalogItem?.href) {
          console.log(`Найден URL в каталоге для ${catalogName}: ${catalogItem.href}`);
          return catalogItem.href;
        }
      }

      console.log(`URL для ${catalogName} не найден в каталоге`);
      return null;
    };

    // Проверка наличия данных в кэше для конкретного каталога
    const hasCachedData = (catalogName: string): boolean => {
      console.log(`Проверка наличия данных в кэше для каталога ${catalogName}`);
      console.log(`Доступные каталоги в сторе:`, Object.keys(catalogsByName));
      return !!catalogsByName[catalogName];
    };

    // Метод для загрузки отдельной записи по ID
    const loadRecordById = async (catalogName: string, recordId: string | number): Promise<any> => {
      loading.value = true;
      error.value = null;

      try {
        // Проверяем, что каталог существует в сторе
        if (!catalogsByName[catalogName]) {
          throw new Error(`Каталог ${catalogName} не найден в сторе`);
        }

        // Получаем URL для загрузки записи
        const baseUrl = catalogsByName[catalogName].url;
        if (!baseUrl) {
          throw new Error(`URL для каталога ${catalogName} не найден`);
        }

        // Формируем URL для загрузки отдельной записи
        const recordUrl = `${baseUrl}${recordId}/?mode=short`;
        console.log(`Загрузка записи по URL: ${recordUrl}`);

        // Загружаем данные записи
        const response = await api.get(recordUrl);
        const recordData = response.data;

        // Добавляем запись в кэш
        if (!catalogsByName[catalogName].GET.RESULTS) {
          catalogsByName[catalogName].GET.RESULTS = new Map();
        }

        // Сохраняем запись в кэше
        catalogsByName[catalogName].GET.RESULTS.set(String(recordId), recordData);
        console.log(`Запись ${recordId} успешно загружена и добавлена в кэш`);

        return recordData;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при загрузке записи ${recordId} из каталога ${catalogName}:`, err);
        return null;
      } finally {
        loading.value = false;
      }
    };

    // Метод для обновления записи в сторе после PATCH-запроса
    const updateRecordInStore = (
      catalogName: string,
      recordId: string,
      updatedData: any,
    ): boolean => {
      try {
        // Проверяем, что данные для этого представления загружены
        if (!catalogsByName[catalogName] || !catalogsByName[catalogName].GET) {
          console.warn(
            `Невозможно обновить запись в сторе: данные для ${catalogName} не загружены`,
          );
          return false;
        }

        // Получаем текущие данные
        const currentData = catalogsByName[catalogName].GET;

        // Проверяем, что есть Map RESULTS
        if (!currentData.RESULTS || !(currentData.RESULTS instanceof Map)) {
          console.warn(
            `Невозможно обновить запись в сторе: нет Map RESULTS в данных ${catalogName}`,
          );
          return false;
        }

        // Проверяем наличие записи в Map
        if (!currentData.RESULTS.has(String(recordId))) {
          console.warn(
            `Невозможно обновить запись в сторе: запись с ID ${recordId} не найдена в ${catalogName}`,
          );
          return false;
        }

        // Обновляем запись в Map
        const existingRecord = currentData.RESULTS.get(String(recordId));
        const updatedRecord = { ...existingRecord, ...updatedData };
        currentData.RESULTS.set(String(recordId), updatedRecord);

        console.log(`Запись с ID ${recordId} успешно обновлена в сторе`);
        return true;
      } catch (error) {
        console.error(`Ошибка при обновлении записи в сторе:`, error);
        return false;
      }
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

    // // Запускаем инициализацию стора (нужна только для загрузки JS функций)
    // initialize();

    return {
      // состояние
      catalogGroups,
      jsInterface,
      loading,
      error,
      moduleName,
      url,
      catalogsByName,

      // действия
      loadCatalogGroups,
      loadCatalog,
      loadRecordById,
      // getJSInterface,
      findUrlInCatalogGroups,
      updateRecordInStore,
      hasCachedData,
      // initialize,
    };
  });
}
