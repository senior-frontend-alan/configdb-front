// src/stores/module-factory.ts
import { defineStore, getActivePinia } from 'pinia';
import { ref, reactive } from 'vue';
import api from '../api';
import { FIELD_TYPES } from '../utils/formatter';
import { useConfig } from '../config-loader';
import type { ModuleConfig } from '../config-loader';
import type { CatalogsAPIResponseGET } from './types/catalogsAPIResponseGET.type';
import type { CatalogDetailsAPIResponseGET } from './types/catalogDetailsAPIResponseGET.type';
import type { CatalogDetailsAPIResponseOPTIONS } from './types/catalogDetailsAPIResponseOPTIONS.type';

// Типы для JS-функций модулей
export interface ModuleJSFunctions {
  [functionName: string]: Function;
}

// Базовые JS-функции, доступные для всех модулей
const baseJSFunctions: ModuleJSFunctions = {
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
    // Используем обычный объект вместо reactive, так как функции статические
    const JSIFunctions: ModuleJSFunctions = {
      ...baseJSFunctions,

      // Специфичные для модуля функции
      // Можно добавить специфичные для модуля функции здесь
      // или загрузить их динамически из конфигурации
    };

    const loading = ref<boolean>(false);
    const error = ref<any | null>(null);
    const diamApplicationList = ref<any[]>([]);

    // Сохраненные данные по различным viewname - используем reactive вместо ref
    const catalogDetails = reactive<Record<string, any>>({});

    // действия получаем список каталогов (ШАГ 1)
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

    // Формируем список столбцов для отображения в таблице (ШАГ 2) из элементов OPTIONS
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

          // Определяем видимость элемента
          const isVisible = displayList.length === 0 || displayList.includes(element.name);

          // Создаем копию элемента с добавлением visible
          const elementCopy = {
            ...element,
            visible: isVisible,
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
          const getResponse = await api.get<CatalogDetailsAPIResponseGET>(url);
          const optionsResponse = await api.options<CatalogDetailsAPIResponseOPTIONS>(url);

          getResponseData = getResponse.data;
          optionsResponseData = optionsResponse.data;
        }
        // Добавляем наши вычисляемые поля в OPTIONS для удобства
        if (optionsResponseData?.layout) {
          optionsResponseData.layout.tableColumns = getTableColumns(optionsResponseData);
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

    // Метод для получения JS-функций модуля
    const getJSIFunctions = async (): Promise<ModuleJSFunctions> => {
      loading.value = true;

      try {
        // Формируем URL для запроса JS-функций
        const routes = moduleConfig.routes as unknown as Record<string, string>;
        const jsUrl = routes['getJSIFunctions'];

        console.log(`Загрузка JS-функций из: ${jsUrl}`);

        // Загружаем JS-код как текст через API-клиент
        const response = await api.get(jsUrl, {
          responseType: 'text',
          headers: { 'Content-Type': 'text/plain' },
        });

        const jsCode = response.data;

        // Выполняем код и получаем функции напрямую
        try {
          // Создаем функцию, которая выполнит код модуля и вернет объект с функциями
          const moduleFunction = new Function(`
            // Создаем переменную module для экспорта функций
            const module = { exports: {} };
            
            // Выполняем код модуля в изолированном контексте
            ${jsCode}
            
            // Возвращаем экспортированные функции
            return module.exports;
          `);

          // Выполняем функцию и получаем объект с функциями
          const moduleFunctions = moduleFunction();

          // Копируем функции в объект
          Object.assign(JSIFunctions, moduleFunctions);

          // Выводим информацию о загруженных функциях
          const loadedFunctions = Object.keys(JSIFunctions).filter(
            (key) => !Object.keys(baseJSFunctions).includes(key),
          );
          console.log(
            `JS-функции для модуля ${moduleConfig.id} успешно загружены: ${loadedFunctions.join(
              ', ',
            )}`,
          );
        } catch (evalError) {
          console.error(`Ошибка выполнения кода JS-функций:`, evalError);
        }

        return JSIFunctions;
      } catch (err) {
        console.error(`Ошибка при получении JS-функций для модуля ${moduleConfig.id}:`, err);
        return JSIFunctions;
      } finally {
        loading.value = false;
      }
    };

    // загрузка JS-функций начнётся автоматически при создании стора
    const initialize = async (): Promise<void> => {
      try {
        // Проверяем, есть ли маршрут для загрузки JS-функций
        const routes = moduleConfig.routes as unknown as Record<string, string>;
        if (routes['getJSIFunctions']) {
          await getJSIFunctions();
        }
      } catch (error: any) {
        console.error(`Ошибка при инициализации стора модуля ${moduleConfig.id}:`, error);
      }
    };

    // Запускаем инициализацию стора (нужна только для загрузки JS функций)
    initialize();

    return {
      // состояние
      catalog,
      JSIFunctions,
      loading,
      error,
      moduleName,
      diamApplicationList,
      catalogDetails,

      // действия
      getCatalog,
      getJSIFunctions,
      findCatalogItemUrl,
      loadCatalogDetails,
      initialize,
    };
  });
}
