// src/stores/module-factory.ts
import { defineStore, getActivePinia } from 'pinia';
import { ref, reactive } from 'vue';
import api from '../api';
import { FieldTypeService } from '../services/fieldTypeService';
import { useConfig } from '../config-loader';
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

// Функция для получения стора модуля по ID
export function useModuleStore(moduleId: string) {
  const { getModuleConfig } = useConfig();
  const moduleConfig = getModuleConfig(moduleId);

  if (!moduleConfig) {
    console.error(`Модуль ${moduleId} не найден в конфигурации`);
    return null;
  }

  // Получаем активный экземпляр Pinia
  const pinia = getActivePinia();

  if (!pinia) {
    console.error('Не найден активный экземпляр Pinia');
    return null;
  }

  // ID стора формируется как `${moduleConfig.id}Store`
  const storeId = `${moduleConfig.id}`;

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
  return defineStore(`${moduleConfig.id}`, () => {
    // состояние
    const moduleName = ref<string>(moduleConfig.name);
    const catalog = ref<CatalogsAPIResponseGET>([]);

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
    const diamApplicationList = ref<any[]>([]);

    // Сохраненные данные по различным viewname - используем reactive вместо ref
    const catalogDetails = reactive<Record<string, any>>({});

    // (ШАГ 1) получаем список каталогов
    const getCatalog = async (): Promise<CatalogsAPIResponseGET> => {
      // Если данные уже загружены или запрос уже выполняется, возвращаем текущие данные
      if (catalog.value && catalog.value.length > 0) {
        console.log(
          `Данные для модуля ${moduleConfig.id} уже загружены, используем кэшированные данные`,
        );
        return catalog.value;
      }

      loading.value = true;

      try {
        const routes = moduleConfig.routes as unknown as Record<string, string>;
        const url = routes['getCatalog'];

        console.log(`Отправка запроса на ${url}`);
        const response = await api.get<CatalogsAPIResponseGET>(url);
        catalog.value = response.data;
        error.value = null;
        return response.data;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при получении ${moduleConfig.name}:`, err);
        return [];
      } finally {
        loading.value = false;
      }
    };

    // (ШАГ 2) Формируем список столбцов для отображения в таблице из элементов OPTIONS
    // Map структура нам поможет быстро сопоставлять с GET запросом
    const getTableColumns = (options: any): Map<string, any> => {
      if (!options?.layout?.elements || !Array.isArray(options.layout.elements)) {
        return new Map();
      }

      const displayList = Array.isArray(options.layout.display_list)
        ? options.layout.display_list
        : [];

      // Создаем плоскую Map для всех элементов
      const elementsMap = new Map<string, any>();

      // Рекурсивная функция для обработки элементов
      const processElements = (elements: any[]): void => {
        elements.forEach((element: any) => {
          if (!element.name) return;

          // Для элементов с такими классами не обрабатываем вложенные элементы
          const isSpecialType =
            element.class_name === 'ViewSetInlineLayout' ||
            element.class_name === 'ViewSetInlineDynamicLayout' ||
            element.class_name === 'ViewSetInlineDynamicModelLayout' ||
            element.field_class === 'ListSerializer';

          // Определяем изначальную видимость элемента
          const VISIBLE = displayList.length === 0 || displayList.includes(element.name);

          // Однозначно определяем FRONTEND тип на основании BACKEND типов
          const FRONTEND_CLASS = FieldTypeService.getFieldType(element);

          // Если это поле типа Choice, создаем Map-структуру для быстрого доступа к значениям
          let CHOICES: Map<string, string> | undefined;
          if (FRONTEND_CLASS === 'Choice' && element.choices && Array.isArray(element.choices)) {
            CHOICES = new Map<string, string>();
            element.choices.forEach((choice: { value: string | number; display_name: string }) => {
              CHOICES?.set(String(choice.value), choice.display_name);
            });
          }

          // Добавляем FRONTEND_CLASS и CHOICES в оригинальный элемент
          element.FRONTEND_CLASS = FRONTEND_CLASS;
          if (CHOICES) {
            element.CHOICES = CHOICES;
          }

          const elementCopy = {
            ...element,
            FRONTEND_CLASS,
            VISIBLE,
            ...(CHOICES ? { CHOICES } : {}), // Добавляем CHOICES только если она существует
          };

          // Добавляем элемент в Map
          elementsMap.set(element.name, elementCopy);

          // Рекурсивно обрабатываем вложенные элементы, если они есть и элемент не является специальным типом
          if (
            element.elements &&
            Array.isArray(element.elements) &&
            element.elements.length > 0 &&
            !isSpecialType
          ) {
            processElements(element.elements);
          }
        });
      };

      // Запускаем обработку всех элементов
      processElements(options.layout.elements);

      // Создаем упорядоченную Map на основе displayList
      const orderedMap = new Map<string, any>();

      // Сначала добавляем элементы в порядке из displayList
      displayList.forEach((fieldName: string) => {
        if (elementsMap.has(fieldName)) {
          orderedMap.set(fieldName, elementsMap.get(fieldName));
        }
      });

      // Затем добавляем оставшиеся элементы, которых нет в displayList
      elementsMap.forEach((value, key) => {
        if (!orderedMap.has(key)) {
          orderedMap.set(key, value);
        }
      });

      // Всегда возвращаем упорядоченную Map
      return orderedMap;
    };

    // Функция для создания Map-структуры элементов макета
    const createElementsMap = (elements: any[] | undefined): Map<string, any> => {
      const elementsMap = new Map<string, any>();

      if (!elements || !Array.isArray(elements)) {
        return elementsMap;
      }

      // Рекурсивная функция для обработки элементов
      const processElements = (items: any[]) => {
        items.forEach((element) => {
          // Если у элемента есть поле name, добавляем его в Map
          if (element.name) {
            element.FRONTEND_CLASS = FieldTypeService.getFieldType(element);

            elementsMap.set(element.name, element);
          }

          // Рекурсивно обрабатываем вложенные элементы
          if (element.elements && Array.isArray(element.elements) && element.elements.length > 0) {
            element.ELEMENTS = new Map<string, any>();

            // Заполняем Map вложенных элементов
            element.elements.forEach((childElement: any) => {
              if (childElement.name) {
                childElement.FRONTEND_CLASS = FieldTypeService.getFieldType(childElement);
                element.ELEMENTS.set(childElement.name, childElement);
              }
            });

            // Рекурсивно обрабатываем все вложенные элементы
            processElements(element.elements);
          }
        });
      };

      processElements(elements);

      return elementsMap;
    };

    // Функция для поиска URL каталога по viewname (т.е. загружаем данные из шага 1 чтобы найти URL для шага 2)
    // Например нам дали url и мы должны сразу загрузить данные конкретного каталога (таблицы)
    const findCatalogItemUrl = async (viewname: string): Promise<string | null> => {
      // Если каталог еще не загружен, загружаем его
      if (!catalog.value || catalog.value.length === 0) {
        console.log(`Каталог для модуля ${moduleConfig.id} не загружен, загружаем...`);
        await getCatalog();
      }

      // Ищем элемент каталога с нужным viewname
      if (catalog.value && catalog.value.length > 0) {
        const catalogItem = catalog.value
          .flatMap((group: { items?: any[] }) => group.items || [])
          .find((item: { viewname: string; href?: string }) => item.viewname === viewname);

        if (catalogItem?.href) {
          console.log(`Найден URL в каталоге для ${viewname}: ${catalogItem.href}`);
          return catalogItem.href;
        }
      }

      console.log(`URL для ${viewname} не найден в каталоге`);
      return null;
    };

    // Загрузка данных по URL и сохранение их в соответствующее поле catalogDetails
    const loadCatalogDetails = async (viewname: string, url: string): Promise<any> => {
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
          optionsResponseData.layout.TABLE_COLUMNS = getTableColumns(optionsResponseData);

          optionsResponseData.layout.ELEMENTS = createElementsMap(
            optionsResponseData.layout.elements,
          );
        }

        // Создаем новый объект с данными (общая логика для моковых и реальных данных)
        const detailsData = {
          GET: getResponseData,
          OPTIONS: optionsResponseData,
          viewname: viewname,
          href: url,
        };

        // Напрямую обновляем реактивный объект
        catalogDetails[viewname] = detailsData;

        console.log(`Данные для ${viewname} успешно загружены в стор:`, catalogDetails[viewname]);

        error.value = null;
        return detailsData;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при загрузке данных для ${viewname}:`, err);
        return null;
      } finally {
        loading.value = false;
      }
    };

    // Загрузка данных по идентификатору представления
    const findAndLoadCatalogData = async (viewname: string, forceReload = false): Promise<any> => {
      if (!viewname) {
        console.error('Не указан viewname для загрузки данных');
        return null;
      }

      // Если данные уже загружены и не требуется принудительная перезагрузка
      if (!forceReload && catalogDetails[viewname]) {
        console.log(`Данные для ${viewname} уже загружены, возвращаем из кэша`);
        return catalogDetails[viewname];
      }

      try {
        // Получаем URL для загрузки данных
        const url = await findCatalogItemUrl(viewname);

        if (!url) {
          throw new Error(`URL для ${viewname} не найден`);
        }

        // Загружаем данные по полученному URL
        return await loadCatalogDetails(viewname, url);
      } catch (err) {
        console.error(`Ошибка при загрузке данных для ${viewname}:`, err);
        error.value = err;
        return null;
      }
    };

    // Метод для обновления записи в сторе после PATCH-запроса
    const updateRecordInStore = (viewname: string, recordId: string | number, updatedData: any): boolean => {
      try {
        // Проверяем, что данные для этого представления загружены
        if (!catalogDetails[viewname] || !catalogDetails[viewname].GET) {
          console.warn(`Невозможно обновить запись в сторе: данные для ${viewname} не загружены`);
          return false;
        }

        // Получаем текущие данные
        const currentData = catalogDetails[viewname].GET;

        // Проверяем, что есть массив results
        if (!currentData.results || !Array.isArray(currentData.results)) {
          console.warn(`Невозможно обновить запись в сторе: нет массива results в данных ${viewname}`);
          return false;
        }

        // Находим индекс записи в массиве
        const recordIndex = currentData.results.findIndex((item: any) => item.id == recordId);

        if (recordIndex === -1) {
          console.warn(`Невозможно обновить запись в сторе: запись с ID ${recordId} не найдена в ${viewname}`);
          return false;
        }

        // Обновляем запись, сохраняя существующие поля и добавляя новые
        currentData.results[recordIndex] = { ...currentData.results[recordIndex], ...updatedData };

        console.log(`Запись с ID ${recordId} успешно обновлена в сторе для ${viewname}`);
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
    // console.log(`JS-функции для модуля ${moduleConfig.id} успешно загружены:`, Object.keys(baseJSInterface).join(', '));

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
    //     `JS-функции для модуля ${moduleConfig.id} успешно загружены: ${loadedFunctions.join(
    //       ', ',
    //     )}`,
    //   );
    // } catch (evalError) {
    //   console.error(`Ошибка выполнения кода JS-функций:`, evalError);
    // }

    // return JSIFunctions;
    // } catch (err) {
    //   console.error(`Ошибка при получении JS-функций для модуля ${moduleConfig.id}:`, err);
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
    //     console.error(`Ошибка при инициализации стора модуля ${moduleConfig.id}:`, error);
    //   }
    // };

    // // Запускаем инициализацию стора (нужна только для загрузки JS функций)
    // initialize();

    return {
      // состояние
      catalog,
      jsInterface,
      loading,
      error,
      moduleName,
      diamApplicationList,
      catalogDetails,

      // действия
      getCatalog,
      // getJSInterface,
      findCatalogItemUrl,
      loadCatalogDetails,
      updateRecordInStore,
      // initialize,
    };
  });
}
