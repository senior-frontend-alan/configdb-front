// src/stores/data-loaders.ts
import { useModuleStore, type Catalog } from './module-factory';
import { CatalogService } from '../services/CatalogService';
import { RecordService } from '../services/RecordService';
import api from '../api';
import type {
  CatalogsAPIResponseGET,
  CatalogGroup,
  CatalogItem,
} from './types/catalogsAPIResponseGET.type';

/**
 * Ищет каталог во всех модулях
 * @param applName Имя приложения
 * @param catalogName Имя каталога
 * @returns Объект с результатом поиска, именем модуля и URL каталога
 */
async function findCatalogInAllModules(
  applName: string,
  catalogName: string,
): Promise<{
  found: boolean;
  moduleName: string;
  catalogUrl: string;
  moduleStore?: any;
  error?: Error;
}> {
  // список модулей из конфигурации
  if (!window.APP_CONFIG?.modules || !Array.isArray(window.APP_CONFIG.modules)) {
    return {
      found: false,
      moduleName: '',
      catalogUrl: '',
      error: new Error(`Не удалось получить список модулей из конфигурации`),
    };
  }

  for (const moduleConfig of window.APP_CONFIG.modules) {
    const moduleUrlPath = moduleConfig.urlPath;
    if (!moduleUrlPath) continue; // Пропускаем модули без идентификатора

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
        found: true,
        moduleName: moduleUrlPath,
        catalogUrl: catalogInfo.href,
        moduleStore: moduleStore,
      };
    }
  }

  // Каталог не найден ни в одном модуле
  return {
    found: false,
    moduleName: '',
    catalogUrl: '',
    error: new Error(`Каталог ${applName}/${catalogName} не найден ни в одном из модулей`),
  };
}

/**
 * Общая функция для поиска URL каталога и инициализации стора
 * @param moduleName Имя модуля
 * @param applName Имя приложения
 * @param catalogName Имя каталога
 * @returns Объект с результатом поиска, URL каталога, стором и каталогом
 */
async function findCatalogUrlAllModules(
  moduleName: string,
  applName: string,
  catalogName: string,
): Promise<{
  success: boolean;
  catalogUrl?: string;
  moduleStore?: any;
  actualModuleName?: string;
  error?: Error;
}> {
  let moduleStore = useModuleStore(moduleName);
  let actualModuleName = moduleName;

  // Получаем URL каталога для загрузки
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
    // Если каталог не найден в текущем модуле, ищем его во всех модулях
    const catalogSearch = await findCatalogInAllModules(applName, catalogName);

    if (catalogSearch.found) {
      const foundModuleName = catalogSearch.moduleName;
      catalogUrl = catalogSearch.catalogUrl;

      const foundModuleStore = catalogSearch.moduleStore;

      console.log(`Каталог найден в модуле ${foundModuleName}`);
      // Обновляем переменные для дальнейшей работы
      actualModuleName = foundModuleName;
      moduleStore = foundModuleStore;
      // Инициализация каталога будет выполнена позже
    } else {
      // Каталог не найден ни в одном модуле
      return { success: false, error: catalogSearch.error };
    }
  }

  return {
    success: true,
    catalogUrl,
    moduleStore,
    actualModuleName,
  };
}

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
    console.error(`Ошибка при загрузке каталогов для модуля ${moduleName}:`, error);
    return {
      success: false,
      catalogGroups: [],
      indexCatalogsByApplName: {},
      error:
        error instanceof Error
          ? error
          : new Error(`Ошибка при загрузке каталогов для модуля ${moduleName}`),
    };
  }
}

interface CatalogResult {
  success: boolean;
  /** Полный объект каталога (нужен для getOrFetchRecord) */
  catalog?: Catalog;
  /** Конкретный Ключ кэша для которого делался запрос GET */
  cacheKey?: string;
  error?: Error;
}

/**
 * Загружает OPTIONS метаданные каталога, используя кэш если доступно
 * @param moduleName Имя модуля
 * @param applName Имя приложения
 * @param catalogName Имя каталога
 * @returns OPTIONS данные каталога
 */
export async function getOrFetchCatalogOPTIONS(
  moduleName: string,
  applName: string,
  catalogName: string,
): Promise<{ success: boolean; catalog?: Catalog; error?: Error }> {
  // Проверяем, есть ли уже инициализированный каталог
  const moduleStore = useModuleStore(moduleName);
  const catalogKey = `${applName}_${catalogName.toLowerCase()}`;
  const existingCatalog = (moduleStore as any)[catalogKey];

  // Если каталог уже существует и имеет OPTIONS
  if (existingCatalog?.OPTIONS && Object.keys(existingCatalog.OPTIONS).length > 0) {
    console.log(
      `getOrFetchCatalogOPTIONS: Используем кэшированные метаданные для ${moduleName}/${applName}/${catalogName}`,
    );
    return { success: true, catalog: existingCatalog };
  }

  const catalogResult = await findCatalogUrlAllModules(moduleName, applName, catalogName);

  if (!catalogResult.success) {
    return { success: false, error: catalogResult.error };
  }

  try {
    // Используем существующий каталог или создаем новый
    const catalog = existingCatalog || moduleStore.initCatalog(applName, catalogName, undefined);

    const responseOPTIONS = await CatalogService.OPTIONS(catalogResult.catalogUrl!);
    catalog.OPTIONS = responseOPTIONS;

    return { success: true, catalog: catalog };
  } catch (error) {
    console.error(`Ошибка при загрузке OPTIONS для каталога ${applName}/${catalogName}:`, error);
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
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
 * @param filters Фильтры для запроса
 * @returns Объект с результатом загрузки, URL каталога и данными
 */

export async function getOrfetchCatalogGET(
  moduleName: string,
  applName: string,
  catalogName: string,
  offset = 0,
  limit = 20,
  filters?: Record<string, any>,
): Promise<CatalogResult> {
  const moduleStore = useModuleStore(moduleName);
  let currentCatalog: Catalog = moduleStore.initCatalog(applName, catalogName, filters);

  const cacheKey = moduleStore.buildCacheKey(filters);
  const cacheResult = moduleStore.checkCacheForData(currentCatalog, cacheKey, offset, limit);

  if (cacheResult.isCached) {
    console.log(
      `getOrfetchCatalogGET: Данные для ${moduleName}/${applName}/${catalogName} с offset=${offset}, limit=${limit} и фильтрами уже загружены в стор, используем кэш`,
    );
    // Возвращаем данные из кэша
    return {
      success: true,
      catalog: currentCatalog,
      cacheKey,
    };
  }

  // Структура каталога ${catalogName} инициализирована, но данных еще нет, загружаем с сервера
  try {
    const catalogResult = await findCatalogUrlAllModules(moduleName, applName, catalogName);

    if (!catalogResult.success) {
      return { success: false, error: catalogResult.error };
    }

    // Проверяем, есть ли уже инициализированный каталог
    const catalogKey = `${applName}_${catalogName.toLowerCase()}`;
    currentCatalog =
      (moduleStore as any)[catalogKey] || moduleStore.initCatalog(applName, catalogName);

    const responseGET = await CatalogService.GET(catalogResult.catalogUrl!, offset, limit, filters);
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
      error: undefined,
    };
  } catch (error) {
    console.error(`Ошибка при загрузке каталога ${catalogName}:`, error);
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
    const catalogResult = await getOrFetchCatalogOPTIONS(moduleName, applName, catalogName);

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
    console.error(`Ошибка при загрузке записи ${recordId}:`, error);
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
    const catalogResult = await getOrfetchCatalogGET(moduleName, applName, catalogName);

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
    console.error('Ошибка при создании записи:', error);
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
    console.error(`Ошибка при обновлении записи ${recordId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
