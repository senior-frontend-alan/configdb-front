// src/stores/module-factory.ts
import { defineStore, getActivePinia } from 'pinia';
import { ref, reactive } from 'vue';
import api from '../api';
import { useConfig } from '../config-loader';
import type { ModuleConfig } from '../config-loader';
import type { CatalogsAPIResponseGET } from './types/catalogsAPIResponseGET.type';
import type { CatalogDetailsAPIResponseGET } from './types/catalogDetailsAPIResponseGET.type';
import type { CatalogDetailsAPIResponseOPTIONS } from './types/catalogDetailsAPIResponseOPTIONS.type';
import { formatByClassName, FIELD_TYPES } from '../utils/formatter';

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
    const currentItem = ref<any | null>(null);
    const loading = ref<boolean>(false);
    const error = ref<any | null>(null);
    const diamApplicationList = ref<any[]>([]);

    // Сохраненные данные по различным viewname - используем reactive вместо ref
    const catalogDetails = reactive<Record<string, any>>({});

    // Флаг для отслеживания запросов в процессе
    const isRequestInProgress = ref<boolean>(false);

    // действия
    const getCatalog = async (): Promise<CatalogsAPIResponseGET> => {
      // Если данные уже загружены или запрос уже выполняется, возвращаем текущие данные
      if (catalog.value && catalog.value.length > 0) {
        console.log(
          `Данные для модуля ${moduleConfig.id} уже загружены, используем кэшированные данные`,
        );
        return catalog.value;
      }

      // Если запрос уже выполняется, ожидаем его завершения
      if (isRequestInProgress.value) {
        console.log(`Запрос для модуля ${moduleConfig.id} уже выполняется, ожидаем...`);
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!isRequestInProgress.value) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 100);
        });
        return catalog.value;
      }

      // Устанавливаем флаги загрузки
      isRequestInProgress.value = true;
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
        isRequestInProgress.value = false;
      }
    };

    // Создаем карту метаданных полей из OPTIONS запроса,
    // т.е. вместо
    // "elements": [
    //   {
    //       "class_name": "LayoutField",
    //       "name": "layout_field",
    //       ...
    //   }
    // ]
    //
    // {
    //   "layout_field": {
    //     "class_name": "LayoutField",
    //     "options": {
    //       ...
    //     }
    //   }
    // }
    const createFieldsMetadata = (options: any) => {
      const metadata = { ...options };

      // Если нет layout или elements, возвращаем исходные опции
      if (!options?.layout?.elements || !Array.isArray(options.layout.elements)) {
        return metadata;
      }

      metadata.layout = { ...options.layout };

      // Создаем карту полей внутри layout
      metadata.layout.elementsMap = {};

      options.layout.elements.forEach((element: any) => {
        if (!element.name) return;

        // Определяем тип поля на основе class_name или field_class
        let fieldType = FIELD_TYPES.LAYOUT_CHAR_FIELD; // Тип по умолчанию
        if (element.class_name && element.class_name !== '') {
          fieldType = element.class_name;
        } else if (element.field_class && element.field_class !== '') {
          fieldType = element.field_class;
        }

        metadata.layout.elementsMap[element.name] = {
          ...element, // Сохраняем все опции поля для возможного использования
          class_name: fieldType, // Перезаписываем class_name
        };
      });

      return metadata;
    };

    // Функция для форматирования данных с использованием метаданных полей
    const formatData = (data: any, options: any) => {
      // Создаем метаданные полей
      const fieldsMetadata = createFieldsMetadata(options);

      // Если нет данных или результатов, возвращаем исходные данные
      if (!data || !data.results || !Array.isArray(data.results)) {
        return data;
      }

      // Форматируем результаты
      return {
        ...data,
        results: data.results.map((item: any) => {
          // Создаем копию элемента для форматирования
          const formattedItem = { ...item };

          // Форматируем каждое поле используя метаданные
          Object.keys(formattedItem).forEach((fieldName) => {
            try {
              // Задаем фиксированный класс для обработки полей date_created и date_updated
              if (fieldName === 'date_created' || fieldName === 'date_updated') {
                return formatByClassName(
                  FIELD_TYPES.LAYOUT_CHAR_FIELD,
                  formattedItem[fieldName],
                  options,
                );
              }

              // Иначе используем тип из метаданных
              const fieldType =
                fieldsMetadata?.layout?.elementsMap?.[fieldName]?.class_name ||
                FIELD_TYPES.LAYOUT_CHAR_FIELD;
              formattedItem[fieldName] = formatByClassName(fieldType, formattedItem[fieldName]);
            } catch (e) {
              console.warn(`Ошибка форматирования поля ${fieldName}:`, e);
            }
          });

          return formattedItem;
        }),
      };
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

        // Создаем новый объект с данными (общая логика для моковых и реальных данных)
        const detailsData = {
          GET: getResponseData,
          GET_FORMATTED: formatData(getResponseData, optionsResponseData),
          OPTIONS: optionsResponseData,
          OPTIONS_MAP: createFieldsMetadata(optionsResponseData),
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

    return {
      // состояние
      catalog,
      currentItem,
      loading,
      error,
      moduleName,
      isRequestInProgress,
      diamApplicationList,
      catalogDetails,

      // действия
      getCatalog,
      findCatalogItemUrl,
      loadCatalogDetails,
    };
  });
}
