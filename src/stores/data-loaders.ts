// src/stores/data-loaders.ts
import { useModuleStore, getOrInitCatalogStructure, type Catalog } from './module-factory';
import { CatalogService } from '../services/CatalogService';
import { RecordService } from '../services/RecordService';
import api from '../api';
import type {
  CatalogsAPIResponseGET,
  CatalogGroup,
  CatalogItem,
} from './types/catalogsAPIResponseGET.type';
import { validateModuleConfig } from './module-factory';

export interface ModuleCatalogsResult {
  success: boolean;
  moduleStore?: ReturnType<typeof useModuleStore>;
  error?: Error;
}

/**
 * (ШАГ 1) Загружает группы каталогов для модуля и возвращает результат загрузки
 * @param moduleName Имя модуля
 * @returns Объект с результатом загрузки, ссылкой на стор модуля и ошибкой (если есть)
 */
export async function getOrFetchModuleCatalogs(moduleName: string): Promise<ModuleCatalogsResult> {
  try {
    const moduleStore = useModuleStore(moduleName);

    // Если данные уже загружены, возвращаем их из кэша
    if (moduleStore.catalogGroups && moduleStore.catalogGroups.length > 0) {
      console.log(`catalogGroups для ${moduleName} уже загружен, используем кэш`);
      return { success: true, moduleStore };
    }

    // Проверяем наличие URL для загрузки каталогов
    if (!moduleStore.getCatalog) {
      const error = new Error(
        `URL для загрузки каталогов не найден в конфигурации модуля ${moduleName}`,
      );
      console.error(error.message);
      return { success: false, moduleStore, error };
    }

    const url = moduleStore.getCatalog;
    const response = await api.get<CatalogsAPIResponseGET>(url);
    const catalogGroups = response.data;

    if (!catalogGroups || catalogGroups.length === 0) {
      const error = new Error(`Не удалось загрузить getCatalog для модуля ${moduleName}`);
      console.error(error.message);
      return { success: false, moduleStore, error };
    }

    // Сохраняем данные в стор
    moduleStore.catalogGroups = catalogGroups;

    // Создаем индекс каталогов по applName для быстрого доступа
    if (!moduleStore.indexCatalogsByApplName) {
      moduleStore.indexCatalogsByApplName = {};
    }

    // Индексируем каталоги по appl_name и имени для быстрого доступа
    catalogGroups.forEach((group: CatalogGroup) => {
      group.items?.forEach((item: CatalogItem) => {
        if (item.appl_name && item.name) {
          if (!moduleStore.indexCatalogsByApplName[item.appl_name]) {
            moduleStore.indexCatalogsByApplName[item.appl_name] = new Map();
          }

          moduleStore.indexCatalogsByApplName[item.appl_name.toLowerCase()].set(
            item.name.toLowerCase(),
            item,
          );
        }
      });
    });

    console.log(`getCatalog для ${moduleName} успешно загружен`);

    return { success: true, moduleStore };
  } catch (error) {
    console.error(`Ошибка при загрузке каталогов для модуля ${moduleName}:`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error(`Ошибка при загрузке каталогов для модуля ${moduleName}`),
    };
  }
}

interface CatalogResult {
  success: boolean;
  catalogUrl?: string;
  catalog?: Catalog;
  /** Только новые записи, загруженные в текущем запросе */
  newItems?: any[];
  error?: Error;
}

/**
 * (ШАГ 2) Загружает данные каталога, если они еще не загружены,
 * Для загрузки данных каталога нужна загрузка групп каталогов (ШАГ 1)
 * Загружает данные каталога, если они еще не загружены
 * @param moduleName Имя модуля
 * @param applName Имя приложения
 * @param catalogName Имя каталога
 * @param offset Смещение для пагинации
 * @param limit Лимит записей для загрузки
 * @returns Объект с результатом загрузки, URL каталога и данными
 */
export async function getOrfetchCatalog(
  moduleName: string,
  applName: string,
  catalogName: string,
  offset = 0,
  limit = 20,
): Promise<CatalogResult> {
  const currentCatalog: Catalog = getOrInitCatalogStructure(moduleName, applName, catalogName);

  // Проверяем наличие данных в сторе и загружен ли запрошенный диапазон
  if (currentCatalog?.GET?.results && currentCatalog?.GET?.loadedRanges) {
    if (
      CatalogService.isRangeLoaded(moduleName, applName, catalogName, offset, offset + limit - 1)
    ) {
      console.log(
        `getOrfetchCatalog: Данные для ${moduleName}/${applName}/${catalogName} с offset=${offset}, limit=${limit} уже загружены в стор, используем кэш`,
      );
      // Данные уже есть в кэше
      const catalogGroupsResult = await getOrFetchModuleCatalogs(moduleName);
      let catalogUrl: string | undefined;

      if (catalogGroupsResult.success && catalogGroupsResult.moduleStore) {
        const moduleStore = catalogGroupsResult.moduleStore;
        const indexCatalogsByApplName = moduleStore.indexCatalogsByApplName || {};

        if (indexCatalogsByApplName[applName]) {
          const catalogMap = indexCatalogsByApplName[applName];
          const catalogInfo = catalogMap.get(catalogName);
          catalogUrl = catalogInfo?.href;
        }
      }

      // Возвращаем данные из кэша
      return {
        success: true,
        catalogUrl,
        catalog: currentCatalog,
        newItems: [], // Новых записей нет, все уже в кэше
      };
    }
  }

  // Структура каталога ${catalogName} инициализирована, но данных еще нет, загружаем с сервера
  try {
    const catalogGroupsResult = await getOrFetchModuleCatalogs(moduleName);

    // Получаем URL каталога напрямую из индекса
    let catalogUrl: string | undefined;

    if (catalogGroupsResult.success && catalogGroupsResult.moduleStore) {
      const moduleStore = catalogGroupsResult.moduleStore;
      const indexCatalogsByApplName = moduleStore.indexCatalogsByApplName || {};

      if (indexCatalogsByApplName[applName]) {
        const catalogMap = indexCatalogsByApplName[applName];
        const catalogInfo = catalogMap.get(catalogName);
        catalogUrl = catalogInfo?.href;
      }
    }

    if (!catalogGroupsResult.success || !catalogGroupsResult.moduleStore?.indexCatalogsByApplName) {
      const error = new Error(`Индекс каталогов не загружен для модуля ${moduleName}`);
      console.error(error.message);
      return { success: false, error };
    }

    // Загружаем данные через сервис API
    let responseGET;
    let responseOPTIONS;

    // Проверяем, что URL каталога получен успешно
    if (!catalogUrl) {
      const error = new Error(`Не удалось найти URL для каталога ${applName}/${catalogName}`);
      console.error(error.message);
      return { success: false, error };
    }

    responseGET = await CatalogService.GET(catalogUrl, offset, limit);

    // Загружаем OPTIONS только при первой загрузке каталога
    if (!currentCatalog.OPTIONS) {
      responseOPTIONS = await CatalogService.OPTIONS(catalogUrl);
      currentCatalog.OPTIONS = responseOPTIONS;
    } else {
      console.log(
        `getOrfetchCatalog: Используем кэшированные метаданные для ${moduleName}/${applName}/${catalogName}`,
      );
      responseOPTIONS = currentCatalog.OPTIONS;
    }

    // Сохраняем ответ API в стор, объединяя результаты
    const existingResults = currentCatalog.GET?.results || [];
    const newResults = responseGET.results || [];

    // Если это первая загрузка (offset = 0), заменяем результаты
    // При offset === 0 мы ожидаем, что это новая загрузка с самого начала, поэтому нам нужно заменить все существующие данные новыми
    // При offset > 0 добавляем новые данные к существующим при подгрузке при скролле
    const combinedResults = offset === 0 ? newResults : [...existingResults, ...newResults];

    // Обновляем данные в сторе
    currentCatalog.GET = {
      ...currentCatalog.GET, // Сохраняем существующие данные (например, resultsIndex и loadedRanges)
      ...responseGET, // Добавляем все поля из ответа API
      results: combinedResults, // Явно указываем объединенные результаты
      pageSize: limit, // Добавляем размер страницы
      recordIdToScroll: currentCatalog.GET?.recordIdToScroll || null, // ID записи для скроллинга
    };

    // Если это первая загрузка, инициализируем индекс результатов и загруженные диапазоны
    if (!currentCatalog.GET.resultsIndex) {
      currentCatalog.GET.resultsIndex = new Map<string, any>();
    }

    if (!currentCatalog.GET.loadedRanges) {
      currentCatalog.GET.loadedRanges = {};
    }

    // не индексируем повторно те записи, которые уже были проиндексированы ранее
    if (newResults && Array.isArray(newResults)) {
      newResults.forEach((item: any) => {
        if (item.id !== undefined) {
          const resultsMap = currentCatalog.GET.resultsIndex;
          if (resultsMap) {
            resultsMap.set(String(item.id), item);
          }
        }
      });
    }

    // Сохраняем информацию о загруженном диапазоне
    const loadedRanges = currentCatalog.GET.loadedRanges;
    if (loadedRanges) {
      // Формируем ключ для диапазона в формате "start-end"
      const start = offset;
      const end = offset + (responseGET.results?.length || 0) - 1;
      const rangeKey = `${start}-${end}`;

      // Сохраняем объект диапазона по этому ключу
      loadedRanges[rangeKey] = {
        start,
        end,
        page: Math.floor(offset / limit) + 1,
        timestamp: Date.now(),
      };
    }

    // Сохраняем OPTIONS данные, если они были загружены
    if (responseOPTIONS && !currentCatalog.OPTIONS) {
      currentCatalog.OPTIONS = responseOPTIONS;
    }

    console.log(`getOrfetchCatalog: Каталог ${catalogName} успешно загружен и сохранен в сторе`);
    return {
      success: newResults.length > 0,
      catalogUrl,
      catalog: currentCatalog,
      newItems: newResults,
      error: undefined,
    };
  } catch (error) {
    console.error(`Ошибка при загрузке каталога ${catalogName}:`, error);
    return {
      success: false,
      catalog: undefined,
      newItems: [],
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

interface RecordResult {
  success: boolean;
  recordData?: any;
  catalogUrl?: string;
  catalog?: Catalog;
  error?: Error;
}

/**
 * Загружает данные записи по её ID
 * Сначала загружает данные каталога через getOrfetchCatalog, затем загружает запись через RecordService
 * @param moduleName Имя модуля
 * @param applName Имя приложения
 * @param catalogName Имя каталога
 * @param recordId ID записи
 * @returns Объект с результатом загрузки и данными записи
 */
export async function getOrFetchRecord(
  moduleName: string,
  applName: string,
  catalogName: string,
  recordId: string,
): Promise<RecordResult> {
  try {
    // Шаг 1: Загружаем данные каталога с помощью getOrfetchCatalog
    const catalogResult = await getOrfetchCatalog(moduleName, applName, catalogName);

    if (!catalogResult.success || !catalogResult.catalog) {
      console.error(`Не удалось загрузить каталог ${applName}/${catalogName}`);
      return {
        success: false,
        error:
          catalogResult.error ||
          new Error(`Не удалось загрузить каталог ${applName}/${catalogName}`),
      };
    }

    if (!catalogResult.catalogUrl) {
      const error = new Error(`URL каталога ${applName}/${catalogName} не найден`);
      console.error(error.message);
      return { success: false, error };
    }

    const currentCatalog = catalogResult.catalog;

    try {
      // Проверяем, есть ли запись в кэше
      if (currentCatalog?.GET?.resultsIndex?.has(String(recordId))) {
        const cachedRecord = currentCatalog.GET.resultsIndex.get(String(recordId));
        console.log(`Запись ${recordId} найдена в кэше`);

        return {
          success: true,
          recordData: cachedRecord,
          catalogUrl: catalogResult.catalogUrl,
          catalog: currentCatalog,
        };
      }

      // Загружаем запись с сервера
      const recordData = await RecordService.sendRequest('GET', catalogResult.catalogUrl, recordId);

      // Сохраняем запись в сторе
      if (!currentCatalog?.GET?.resultsIndex) {
        if (!currentCatalog.GET) {
          currentCatalog.GET = { results: [], resultsIndex: new Map<string, any>() };
        } else {
          currentCatalog.GET.resultsIndex = new Map<string, any>();
        }
      }
      currentCatalog.GET.resultsIndex.set(String(recordId), recordData);

      console.log(`Запись ${recordId} успешно загружена и сохранена в сторе`);

      return {
        success: true,
        recordData,
        catalogUrl: catalogResult.catalogUrl,
        catalog: currentCatalog,
      };
    } catch (error) {
      console.error(`Ошибка при загрузке записи ${recordId}:`, error);
      return {
        success: false,
        catalogUrl: catalogResult.catalogUrl,
        catalog: currentCatalog,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  } catch (error) {
    console.error(`Ошибка при загрузке записи ${recordId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Обеспечивает загрузку иерархии данных: модуль -> каталог -> запись
 * @param moduleName Имя модуля
 * @param applName Имя приложения
 * @param catalogName Опционально: имя каталога
 * @param recordId Опционально: ID записи
 * @returns Promise<boolean> Успешность загрузки
 */
export async function ensureHierarchyLoaded(
  moduleName: string,
  applName: string,
  catalogName?: string,
  recordId?: string,
): Promise<boolean> {
  console.log(
    `Загрузка иерархии: модуль=${moduleName}, приложение=${applName}, каталог=${
      catalogName || 'не указан'
    }, запись=${recordId || 'не указана'}`,
  );

  try {
    // Шаг 1: Проверка существования модуля в конфигурации
    const moduleConfig = validateModuleConfig(moduleName);
    if (!moduleConfig) return false;

    // Загрузка данных в зависимости от переданных параметров
    if (!catalogName) {
      const catalogGroupsResult = await getOrFetchModuleCatalogs(moduleName);
      return catalogGroupsResult.success;
    } else if (!recordId) {
      const catalogResult = await getOrfetchCatalog(moduleName, applName, catalogName);
      return catalogResult.success;
    } else {
      const recordResult = await getOrFetchRecord(moduleName, applName, catalogName, recordId);
      return recordResult.success;
    }
  } catch (error) {
    console.error(`Ошибка при загрузке иерархии данных:`, error);
    return false;
  }
}

/**
 * Интерфейс результата создания/обновления записи
 */
export interface RecordSaveResult {
  success: boolean;
  recordId?: string;
  recordData?: any;
  error?: Error;
}

/**
 * Создает новую запись в каталоге
 * @param moduleName Имя модуля
 * @param applName Имя приложения
 * @param catalogName Имя каталога
 * @param data Данные для создания записи
 * @returns Результат операции с ID новой записи
 */
export async function createRecord(
  moduleName: string,
  applName: string,
  catalogName: string,
  data: any,
): Promise<RecordSaveResult> {
  try {
    // Шаг 1: Загружаем данные каталога с помощью getOrfetchCatalog
    const catalogResult = await getOrfetchCatalog(moduleName, applName, catalogName);

    if (!catalogResult.success || !catalogResult.catalogUrl) {
      return {
        success: false,
        error:
          catalogResult.error ||
          new Error(`Не удалось загрузить каталог ${applName}/${catalogName}`),
      };
    }

    // Шаг 2: Отправляем POST запрос через RecordService
    const response = await RecordService.sendRequest(
      'POST',
      catalogResult.catalogUrl,
      undefined,
      data,
    );

    // Получаем ID новой записи
    const recordId = String(response.id || response.ID);

    if (!recordId) {
      return {
        success: false,
        error: new Error('Не удалось получить ID созданной записи'),
      };
    }

    // Шаг 3: Добавляем новую запись в стор
    if (catalogResult.catalog && catalogResult.catalog.GET) {
      if (!catalogResult.catalog.GET.resultsIndex) {
        catalogResult.catalog.GET.resultsIndex = new Map<string, any>();
      }
      catalogResult.catalog.GET.resultsIndex.set(String(recordId), response);

      // Добавляем запись в начало массива results
      if (catalogResult.catalog.GET.results && Array.isArray(catalogResult.catalog.GET.results)) {
        // Добавляем поле isNew для подсветки
        response.isNew = true;

        // Добавляем в начало массива
        catalogResult.catalog.GET.results.unshift(response);

        // Увеличиваем общее количество записей
        catalogResult.catalog.GET.totalCount = (catalogResult.catalog.GET.totalCount || 0) + 1;
      }
    }

    console.log(`Запись ${recordId} успешно создана и добавлена в стор`);

    return {
      success: true,
      recordId,
      recordData: response,
    };
  } catch (error) {
    console.error('Ошибка при создании записи:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Обновляет существующую запись в каталоге
 * @param moduleName Имя модуля
 * @param applName Имя приложения
 * @param catalogName Имя каталога
 * @param recordId ID записи
 * @param data Данные для обновления записи
 * @returns Результат операции с обновленными данными
 */
export async function updateRecord(
  moduleName: string,
  applName: string,
  catalogName: string,
  recordId: string,
  data: any,
): Promise<RecordSaveResult> {
  try {
    // Шаг 1: Проверяем наличие записи в сторе
    const recordResult = await getOrFetchRecord(moduleName, applName, catalogName, recordId);

    if (!recordResult.success || !recordResult.catalogUrl) {
      return {
        success: false,
        error: recordResult.error || new Error(`Не удалось найти запись ${recordId}`),
      };
    }

    // Шаг 2: Отправляем PATCH запрос через RecordService
    const response = await RecordService.sendRequest(
      'PATCH',
      recordResult.catalogUrl,
      recordId,
      data,
    );

    // Шаг 3: Обновляем данные в сторе
    if (recordResult.catalog && recordResult.catalog.GET) {
      if (!recordResult.catalog.GET.resultsIndex) {
        recordResult.catalog.GET.resultsIndex = new Map<string, any>();
      }
      recordResult.catalog.GET.resultsIndex.set(String(recordId), response);

      // Обновляем запись в массиве results, если она там есть
      if (recordResult.catalog.GET.results && Array.isArray(recordResult.catalog.GET.results)) {
        const index = recordResult.catalog.GET.results.findIndex(
          (item) => String(item.id) === String(recordId),
        );
        if (index !== -1) {
          recordResult.catalog.GET.results[index] = response;
        }
      }
    }

    console.log(`Запись ${recordId} успешно обновлена`);

    return {
      success: true,
      recordId,
      recordData: response,
    };
  } catch (error) {
    console.error(`Ошибка при обновлении записи ${recordId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
