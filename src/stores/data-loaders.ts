// src/stores/data-loaders.ts
import { useModuleStore, type Catalog } from './module-factory';
import { CatalogService } from '../services/CatalogService';
import { RecordService } from '../services/RecordService';
import api from '../api';
import type { ToastServiceMethods } from 'primevue/toastservice';
import type {
  CatalogsAPIResponseGET,
  CatalogGroup,
  CatalogItem,
} from './types/catalogsAPIResponseGET.type';

// Переменная для хранения экземпляра Toast
let toastInstance: ToastServiceMethods | null = null;

/**
 * Устанавливает экземпляр Toast для использования в data-loaders
 * @param toast Экземпляр Toast из компонента App
 */
export function setToastInstance(toast: ToastServiceMethods) {
  toastInstance = toast;
}

function showErrorToast(message: string, error?: any) {
  if (toastInstance) {
    toastInstance.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: message,
      life: 0, // 0 = отображается постоянно
    });
  }

  // Логируем ошибку в консоль в любом случае
  if (error) {
    console.error(message, error);
  } else {
    console.error(message);
  }
}

/**
 * Ищет каталог во всех модулях или в указанном модуле
 * @param params Объект с параметрами applName, catalogName и необязательным moduleName
 * @returns Объект с результатом поиска, именем модуля и URL каталога
 */
async function findCatalogInAllModules(params: {
  applName: string;
  catalogName: string;
  moduleName?: string;
}): Promise<{
  success: boolean;
  moduleName: string;
  catalogUrl: string;
  moduleStore?: any;
  error?: Error;
}> {
  const { applName, catalogName, moduleName } = params;

  // Список модулей из конфигурации
  if (!window.APP_CONFIG?.modules || !Array.isArray(window.APP_CONFIG.modules)) {
    return {
      success: false,
      moduleName: '',
      catalogUrl: '',
      error: new Error(`Не удалось получить список модулей из конфигурации`),
    };
  }

  // Если указан конкретный модуль, сначала ищем в нем
  if (moduleName) {
    const moduleCatalogGroupsResult = await getOrFetchModuleCatalogGroups(moduleName);

    if (moduleCatalogGroupsResult.success && moduleCatalogGroupsResult.indexCatalogsByApplName) {
      const indexCatalogsByApplName = moduleCatalogGroupsResult.indexCatalogsByApplName;
      const applNameLower = applName.toLowerCase();

      if (indexCatalogsByApplName[applNameLower]) {
        const catalogMap = indexCatalogsByApplName[applNameLower];
        const catalogInfo = catalogMap.get(catalogName.toLowerCase());

        if (catalogInfo?.href) {
          const moduleStore = useModuleStore(moduleName);
          return {
            success: true,
            moduleName,
            catalogUrl: catalogInfo.href,
            moduleStore,
          };
        }
      }
    }
  }

  // Если модуль не указан или каталог не найден в указанном модуле, ищем во всех модулях
  for (const moduleConfig of window.APP_CONFIG.modules) {
    const moduleUrlPath = moduleConfig.urlPath;
    if (!moduleUrlPath) continue; // Пропускаем модули без идентификатора

    // Если указан модуль и мы его уже проверили, пропускаем
    if (moduleName && moduleUrlPath === moduleName) continue;

    const moduleCatalogGroupsResult = await getOrFetchModuleCatalogGroups(moduleUrlPath);
    if (!moduleCatalogGroupsResult.success) continue;

    // Пропускаем, если нет нужного приложения
    const indexCatalogsByApplName = moduleCatalogGroupsResult.indexCatalogsByApplName || {};
    const applNameLower = applName.toLowerCase();
    if (!indexCatalogsByApplName[applNameLower]) continue;

    const catalogMap = indexCatalogsByApplName[applNameLower];
    const catalogInfo = catalogMap.get(catalogName.toLowerCase());

    if (catalogInfo?.href) {
      // Создаем и возвращаем стор модуля для дальнейшего использования
      const moduleStore = useModuleStore(moduleUrlPath);
      return {
        success: true,
        moduleName: moduleUrlPath,
        catalogUrl: catalogInfo.href,
        moduleStore,
      };
    }
  }

  // Каталог не найден ни в одном из модулей
  const errorMessage = `Каталог ${applName}/${catalogName} не найден ни в одном из модулей.`;
  const detailedError = new Error(errorMessage);
  showErrorToast(errorMessage, detailedError);
  return {
    success: false,
    moduleName: '',
    catalogUrl: '',
    error: detailedError,
  };
}

// Функция findCatalogUrlAllModules удалена, её логика теперь напрямую в getOrfetchCatalogGET

export interface ModuleCatalogsResult {
  success: boolean;
  catalogGroups?: CatalogGroup[];
  indexCatalogsByApplName?: Record<string, Map<string, CatalogItem>>;
  error?: Error;
}

/**
 * (ШАГ 1) Загружает группы каталогов для модуля и возвращает результат загрузки
 * @param moduleName Имя модуля
 * @returns Объект с результатом загрузки, ссылкой на стор модуля и ошибкой (если есть)
 */
export async function getOrFetchModuleCatalogGroups(
  moduleName: string,
): Promise<ModuleCatalogsResult> {
  try {
    const moduleStore = useModuleStore(moduleName);

    // Если данные уже загружены, возвращаем их из кэша
    if (moduleStore.catalogGroups && moduleStore.catalogGroups.length > 0) {
      console.log(`catalogGroups для ${moduleName} уже загружен, используем кэш`);
      return {
        success: true,
        catalogGroups: moduleStore.catalogGroups,
        indexCatalogsByApplName: moduleStore.indexCatalogsByApplName,
      };
    }

    // Проверяем наличие URL для загрузки каталогов
    if (!moduleStore.getCatalog) {
      const error = new Error(
        `URL для загрузки каталогов не найден в конфигурации модуля ${moduleName}`,
      );
      console.error(error.message);
      return { success: false, catalogGroups: [], indexCatalogsByApplName: {}, error };
    }

    const url = moduleStore.getCatalog;
    const response = await api.get<CatalogsAPIResponseGET>(url);
    const catalogGroups = response.data;

    if (!catalogGroups || catalogGroups.length === 0) {
      const error = new Error(`Не удалось загрузить getCatalog для модуля ${moduleName}`);
      console.error(error.message);
      return { success: false, catalogGroups: [], indexCatalogsByApplName: {}, error };
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

    return {
      success: true,
      catalogGroups,
      indexCatalogsByApplName: moduleStore.indexCatalogsByApplName,
    };
  } catch (error) {
    const errorMessage = `Ошибка при загрузке каталогов для модуля ${moduleName}`;
    showErrorToast(errorMessage, error);

    return {
      success: false,
      catalogGroups: [],
      indexCatalogsByApplName: {},
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

interface CatalogResult {
  success: boolean;
  /** Полный объект каталога (нужен для getOrFetchRecord) */
  catalog?: Catalog;
  /** Конкретный Ключ кэша для которого делался запрос GET */
  cacheKey?: string;
  /** !!! Нужны для динамической подгрузки данных таблицы Page2 !!! */
  newResults?: any[];
  error?: Error;
}

interface CatalogOptionsParams {
  moduleName?: string;
  applName: string;
  catalogName: string;
}

/**
 * Загружает OPTIONS метаданные каталога, используя кэш если доступно
 * @param params Объект с параметрами moduleName, applName, catalogName
 * @returns OPTIONS данные каталога
 */
export async function getOrFetchCatalogOPTIONS(
  params: CatalogOptionsParams,
): Promise<{ success: boolean; catalog?: Catalog; error?: Error }> {
  const { moduleName, applName, catalogName } = params;

  let moduleStore;
  let actualModuleName = moduleName;
  let catalogUrl: string | undefined;

  // Шаг 1: Определяем модуль и URL каталога
  // Используем findCatalogInAllModules для поиска каталога в указанном модуле или во всех модулях
  console.log(
    `Поиск каталога ${applName}/${catalogName}${
      moduleName ? ` в модуле ${moduleName}` : ' во всех модулях'
    }...`,
  );

  const catalogSearch = await findCatalogInAllModules({
    applName,
    catalogName,
    moduleName,
  });

  if (!catalogSearch.success) {
    return {
      success: false,
      error:
        catalogSearch.error ||
        new Error(
          `Каталог ${applName}/${catalogName} не найден${
            moduleName ? ` в модуле ${moduleName}` : ' ни в одном из модулей'
          }`,
        ),
    };
  }

  // Используем найденный модуль и URL
  actualModuleName = catalogSearch.moduleName;
  moduleStore = catalogSearch.moduleStore;
  catalogUrl = catalogSearch.catalogUrl;
  console.log(`Каталог ${applName}/${catalogName} найден в модуле ${actualModuleName}`);

  // Шаг 2: Проверяем кэш и загружаем OPTIONS при необходимости
  const catalogKey = `${applName}_${catalogName.toLowerCase()}`;
  const existingCatalog = (moduleStore as any)[catalogKey];

  // Если каталог уже существует и имеет OPTIONS, используем кэш
  if (existingCatalog?.OPTIONS && Object.keys(existingCatalog.OPTIONS).length > 0) {
    console.log(
      `getOrFetchCatalogOPTIONS: Используем кэшированные метаданные для ${actualModuleName}/${applName}/${catalogName}`,
    );
    return { success: true, catalog: existingCatalog };
  }

  // Шаг 3: Загружаем OPTIONS с сервера
  if (!catalogUrl) {
    return {
      success: false,
      error: new Error(`Не удалось получить URL каталога ${applName}/${catalogName}`),
    };
  }

  try {
    // Используем существующий каталог или создаем новый
    const catalog = existingCatalog || moduleStore.initCatalog(applName, catalogName, undefined);

    // Загружаем OPTIONS с сервера
    const responseOPTIONS = await CatalogService.OPTIONS(catalogUrl);

    catalog.OPTIONS = responseOPTIONS;

    return { success: true, catalog };
  } catch (error) {
    const errorMessage = `Ошибка при загрузке OPTIONS для каталога ${applName}/${catalogName}`;
    showErrorToast(errorMessage, error);
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}
interface CatalogGetParams {
  moduleName?: string;
  applName: string;
  catalogName: string;
  offset?: number;
  limit?: number;
  filters?: Record<string, any>; // transaction: '1' !!!НЕ transaction: {value: '1'}
}

/**
 * Преобразует фильтры из формата {key: {value: '1'}} в формат {key: '1'}
 * @param rawFilters Исходные фильтры
 * @returns Преобразованные фильтры
 */
function processFilters(rawFilters?: Record<string, any>): Record<string, any> | undefined {
  if (!rawFilters) return undefined;

  const processedFilters: Record<string, any> = {};
  Object.entries(rawFilters).forEach(([key, filterObj]) => {
    // Проверяем, является ли значение объектом с полем value
    if (typeof filterObj === 'object' && filterObj !== null && 'value' in filterObj) {
      processedFilters[key] = filterObj.value;
    } else {
      processedFilters[key] = filterObj;
    }
  });

  return processedFilters;
}

export async function getOrfetchCatalogGET(params: CatalogGetParams): Promise<CatalogResult> {
  const { moduleName, applName, catalogName, offset = 0, limit = 20, filters: rawFilters } = params;

  // Преобразуем фильтры из формата {value: '1'} в формат '1'
  const filters = processFilters(rawFilters);

  let moduleStore;
  let currentCatalog: Catalog;
  let actualModuleName = moduleName;
  let catalogUrl: string | undefined;

  const catalogSearch = await findCatalogInAllModules({
    applName,
    catalogName,
    moduleName,
  });

  if (!catalogSearch.success) {
    return {
      success: false,
      error:
        catalogSearch.error ||
        new Error(
          `Каталог ${applName}/${catalogName} не найден${
            moduleName ? ` в модуле ${moduleName}` : ' ни в одном из модулей'
          }`,
        ),
    };
  }

  actualModuleName = catalogSearch.moduleName;
  moduleStore = catalogSearch.moduleStore;
  catalogUrl = catalogSearch.catalogUrl;

  // Инициализируем каталог
  currentCatalog = moduleStore.initCatalog(applName, catalogName, filters);

  const cacheKey = moduleStore.buildCacheKey(filters);
  const cacheResult = moduleStore.checkCacheForData(currentCatalog, cacheKey, offset, limit);

  if (cacheResult.isCached) {
    console.log(
      `getOrfetchCatalogGET: Данные для ${moduleName}/${applName}/${catalogName} с offset=${offset}, limit=${limit} и фильтрами уже загружены в стор, используем кэш`,
    );
    // Возвращаем данные из кэша
    // Получаем только нужную часть данных для текущего offset
    const cachedResults = currentCatalog[cacheKey]?.results || [];
    const slicedResults = cachedResults.slice(offset, offset + limit);

    return {
      success: true,
      catalog: currentCatalog,
      cacheKey,
      newResults: slicedResults,
    };
  }

  // Структура каталога ${catalogName} инициализирована, но данных еще нет, загружаем с сервера
  try {
    // Используем уже полученный URL каталога
    if (!catalogUrl) {
      return {
        success: false,
        error: new Error(`Не удалось получить URL каталога ${applName}/${catalogName}`),
      };
    }

    // Проверяем, есть ли уже инициализированный каталог
    const catalogKey = `${applName}_${catalogName.toLowerCase()}`;
    currentCatalog =
      (moduleStore as any)[catalogKey] || moduleStore.initCatalog(applName, catalogName);

    const responseGET = await CatalogService.GET(catalogUrl, offset, limit, filters);
    const newResults = responseGET.results || [];

    moduleStore.updateCatalog(
      currentCatalog,
      cacheKey,
      responseGET,
      newResults,
      offset,
      limit,
      filters,
    );

    console.log(`getOrfetchCatalogGET: Каталог ${catalogName} успешно загружен и сохранен в сторе`);
    return {
      success: newResults.length > 0,
      catalog: currentCatalog,
      cacheKey,
      newResults, // Добавляем новые результаты в ответ
      error: undefined,
    };
  } catch (error) {
    const errorMessage = `Ошибка при загрузке каталога ${catalogName}`;
    showErrorToast(errorMessage, error);

    return {
      success: false,
      catalog: undefined,
      cacheKey: undefined,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Интерфейс результата создания/обновления записи
 */

interface RecordResult {
  success: boolean;
  recordData?: any;
  catalogUrl?: string;
  catalog?: Catalog;
  error?: Error;
}

/**
 * Загружает данные записи по её ID
 * Сначала загружает данные каталога через getOrfetchCatalogGET, затем загружает запись через RecordService
 * @param moduleName Имя модуля
 * @param applName Имя приложения
 * @param catalogName Имя каталога
 * @param recordId ID записи
 * @param filters Фильтры для запроса
 * @returns Объект с результатом загрузки и данными записи
 */
export async function getOrFetchRecord(
  moduleName: string,
  applName: string,
  catalogName: string,
  recordId: string,
): Promise<RecordResult> {
  try {
    // Шаг 1: Загружаем метаданные каталога
    const catalogResult = await getOrFetchCatalogOPTIONS({
      moduleName,
      applName,
      catalogName,
    });

    // Проверяем кэш записи в самом начале
    const moduleStore = useModuleStore(moduleName);
    const catalogKey = `${applName}_${catalogName.toLowerCase()}`;
    const editKey = `${recordId}`;

    // Проверяем, есть ли каталог и запись в кэше
    const existingCatalog = (moduleStore as any)[catalogKey];
    if (existingCatalog && existingCatalog[editKey]) {
      console.log(`Запись ${recordId} найдена в кэше`);

      return {
        success: true,
        recordData: existingCatalog[editKey],
        catalog: existingCatalog,
      };
    }

    // Шаг 2: Если в кэше нет, то загружаем данные каталога
    // Получаем URL каталога из индекса
    const catalogGroupsResult = await getOrFetchModuleCatalogGroups(moduleName);
    let catalogUrl: string | undefined;

    if (catalogGroupsResult.success && catalogGroupsResult.indexCatalogsByApplName) {
      const indexCatalogsByApplName = catalogGroupsResult.indexCatalogsByApplName;
      if (indexCatalogsByApplName[applName]) {
        const catalogMap = indexCatalogsByApplName[applName];
        const catalogInfo = catalogMap.get(catalogName);
        catalogUrl = catalogInfo?.href;
      }
    }

    if (!catalogUrl) {
      const error = new Error(`URL каталога ${applName}/${catalogName} не найден`);
      console.error(error.message);
      return { success: false, error };
    }

    const currentCatalog = catalogResult.catalog || moduleStore.initCatalog(applName, catalogName);

    const recordData = await RecordService.sendRequest('GET', catalogUrl, recordId);

    moduleStore.initRecord(applName, catalogName, editKey, recordData);

    return {
      success: true,
      recordData,
      catalogUrl,
      catalog: currentCatalog,
    };
  } catch (error) {
    const errorMessage = `Ошибка при загрузке записи ${recordId}`;
    showErrorToast(errorMessage, error);

    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

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
    // Шаг 1: Загружаем данные каталога
    const catalogResult = await getOrfetchCatalogGET({
      moduleName,
      applName,
      catalogName,
    });

    if (!catalogResult.success || !catalogResult.catalog) {
      return {
        success: false,
        error:
          catalogResult.error ||
          new Error(`Не удалось загрузить каталог ${applName}/${catalogName}`),
      };
    }

    // Получаем URL каталога из индекса
    const catalogGroupsResult = await getOrFetchModuleCatalogGroups(moduleName);
    let catalogUrl: string | undefined;

    if (catalogGroupsResult.success && catalogGroupsResult.indexCatalogsByApplName) {
      const indexCatalogsByApplName = catalogGroupsResult.indexCatalogsByApplName;
      if (indexCatalogsByApplName[applName]) {
        const catalogMap = indexCatalogsByApplName[applName];
        const catalogInfo = catalogMap.get(catalogName);
        catalogUrl = catalogInfo?.href;
      }
    }

    if (!catalogUrl) {
      return {
        success: false,
        error: new Error(`URL каталога ${applName}/${catalogName} не найден`),
      };
    }

    // Шаг 2: Отправляем POST запрос через RecordService
    const response = await RecordService.sendRequest('POST', catalogUrl, undefined, data);

    // Получаем ID новой записи
    const recordId = String(response.id || response.ID);

    if (!recordId) {
      return {
        success: false,
        error: new Error('Не удалось получить ID созданной записи'),
      };
    }

    // Шаг 3: Добавляем новую запись в массив results
    if (catalogResult.catalog && catalogResult.catalog.GET) {
      // Убеждаемся, что массив results существует
      if (!catalogResult.catalog.GET.results) {
        catalogResult.catalog.GET.results = [];
      }

      // Добавляем поле isNew для подсветки
      response.isNew = true;

      // Добавляем в начало массива
      catalogResult.catalog.GET.results.unshift(response);

      // Увеличиваем общее количество записей
      catalogResult.catalog.GET.count = (catalogResult.catalog.GET.count || 0) + 1;
    }

    console.log(`Запись ${recordId} успешно создана и добавлена в стор`);

    return {
      success: true,
      recordId,
      recordData: response,
    };
  } catch (error) {
    const errorMessage = 'Ошибка при создании записи';
    showErrorToast(errorMessage, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Сохраняет запись в каталоге
 * @param moduleName Имя модуля
 * @param applName Имя приложения
 * @param catalogName Имя каталога
 * @param recordId ID записи
 * @param data Данные для обновления записи
 * @returns Результат операции с обновленными данными
 */
export async function saveRecord(
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

    // Шаг 3: Обновляем данные в массиве results
    if (recordResult.catalog && recordResult.catalog.GET) {
      // Убеждаемся, что массив results существует
      if (!recordResult.catalog.GET.results) {
        recordResult.catalog.GET.results = [];
      }

      // Обновляем запись в массиве results
      const index = recordResult.catalog.GET.results.findIndex(
        (item) => String(item.id) === String(recordId),
      );

      if (index !== -1) {
        // Обновляем существующую запись
        recordResult.catalog.GET.results[index] = response;
      } else {
        // Добавляем запись, если её нет в массиве
        recordResult.catalog.GET.results.push(response);
      }
    }

    // + установиь id для скроллинга
    // + очистить данные в сторе
    console.log(`Запись ${recordId} успешно обновлена`);

    return {
      success: true,
      recordId,
      recordData: response,
    };
  } catch (error) {
    const errorMessage = `Ошибка при обновлении записи ${recordId}`;
    showErrorToast(errorMessage, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
