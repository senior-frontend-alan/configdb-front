// src/services/CatalogService.ts
import { ref, computed } from 'vue';
import api from '../api';
import { useModuleStore, initCatalogStructure } from '../stores/module-factory';
import type { CatalogDetailsAPIResponseGET } from '../stores/types/catalogDetailsAPIResponseGET.type';
import type { CatalogItem } from '../stores/types/catalogsAPIResponseGET.type';

// Маршрутизатор → Стор → Компоненты

// Lazy Loading + Virtual Scroll = Эффективность²
// Lazy Loading: экономит трафик и серверные ресурсы
// Virtual Scroll: экономит память браузера и ускоряет рендеринг

// 3. CatalogService
// Отвечает за: Непосредственную загрузку данных с пагинацией
// Задачи:
// Формирование запросов к API с учетом пагинации
// Кэширование загруженных диапазонов данных
// Управление размером кэша
// Обновление данных в сторе

/**
 * Информация о загруженном диапазоне данных
 */
export interface LoadedRange {
  start: number;
  end: number;
  page: number;
  timestamp: number;
}

/**
 * Структура GET-запроса каталога
 */
export interface CatalogGetData {
  RESULTS?: Map<string, any>;
  results?: any[];
  loadedRanges?: LoadedRange[];
  count?: number;
  totalCount: number;
  pageSize: number;
  next: string | null;
  previous: string | null;
}

/**
 * Структура данных каталога в сторе
 */
export interface CatalogData {
  GET: CatalogGetData;
  OPTIONS: Record<string, any>;
  PATCH: Record<string, any>;
  moduleName: string;
  url: string;
}

/**
 * Структура каталога в группе каталогов
 */
export interface CatalogInfo {
  name: string;
  url: string;
}

/**
 * Структура группы каталогов
 */
export interface CatalogGroup {
  name: string;
  verbose_name?: string;
  description?: string | null;
  display?: boolean;
  items: CatalogItem[];
  tags?: string[] | null;
  // Для обратной совместимости
  catalogs?: CatalogInfo[];
}

/**
 * Структура стора модуля
 */
export interface ModuleStore {
  catalogsByName: Record<string, CatalogData>;
  catalogGroups: CatalogGroup[];
  catalogItemsIndex?: Map<string, any>; // Индекс для быстрого доступа к элементам каталога
  loading: boolean;
  error: string | null;
  url?: string;
}

/**
 * Сервис для ленивой загрузки данных с использованием гибридного подхода
 * Позволяет эффективно управлять кэшированием и загрузкой данных по страницам
 */
export class CatalogService {
  // Максимальное количество записей в кэше
  private static readonly MAX_CACHED_ITEMS = 1000;

  /**
   * Проверяет, загружен ли указанный диапазон данных
   */
  static isRangeLoaded(
    moduleName: string,
    catalogName: string,
    page: number,
    pageSize: number,
  ): boolean {
    const moduleStore = useModuleStore(moduleName) as ModuleStore | undefined;
    if (!moduleStore || !moduleStore.catalogsByName?.[catalogName]?.GET) {
      return false;
    }

    // Проверяем наличие информации о загруженных диапазонах
    const loadedRanges = moduleStore.catalogsByName[catalogName].GET.loadedRanges;
    if (!loadedRanges) return false;

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;

    // Проверяем, есть ли диапазон, который полностью включает запрашиваемый
    return loadedRanges.some(
      (range: LoadedRange) => range.start <= startIndex && range.end >= endIndex,
    );
  }

  /**
   * Загружает данные с указанным смещением
   */
  static async GET(
    moduleName: string,
    catalogName: string,
    offset: number,
    limit: number = 20,
  ): Promise<any[]> {
    console.log(
      `CatalogService.GET: Запрос данных для ${moduleName}/${catalogName}, offset ${offset}, limit ${limit}`,
    );
    try {
      const moduleStore = useModuleStore(moduleName) as ModuleStore | undefined;
      if (!moduleStore) {
        throw new Error(`Не удалось получить стор для модуля ${moduleName}`);
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

      // Примечание: при использовании offset мы не проверяем кэш, так как при бесконечном скролле
      // нам нужно добавлять новые данные к уже загруженным

      // Формируем URL с параметрами пагинации
      const queryChar = url.includes('?') ? '&' : '?';
      const paginatedUrl = `${url}${queryChar}limit=${limit}&offset=${offset}&mode=short`;

      console.log(`CatalogService.GET: Запрос к API: ${paginatedUrl}`);
      const response = await api.get<CatalogDetailsAPIResponseGET>(paginatedUrl);
      const data = response.data;
      // Инициализируем структуру каталога в сторе с помощью функции initCatalogStructure
      initCatalogStructure(moduleName, catalogName, url);

      // Сохраняем ответ API в стор, объединяя результаты
      const existingResults = moduleStore.catalogsByName[catalogName].GET?.results || [];
      const newResults = data.results || [];

      // Если это первая загрузка (offset = 0), заменяем результаты
      // При offset === 0 мы ожидаем, что это новая загрузка с самого начала, поэтому нам нужно заменить все существующие данные новыми, а не добавлять новые данные к старым.
      // Текущая реализация с условием обеспечивает:
      // Очистку старых данных при новой загрузке с начала (offset === 0)
      // Добавление новых данных к существующим при подгрузке при скролле (offset > 0)
      const combinedResults = offset === 0 ? newResults : [...existingResults, ...newResults];

      moduleStore.catalogsByName[catalogName].GET = {
        ...moduleStore.catalogsByName[catalogName].GET, // Сохраняем существующие данные (например, RESULTS и loadedRanges)
        ...data, // Добавляем все поля из ответа API
        results: combinedResults, // Явно указываем объединенные результаты
        pageSize: limit, // Добавляем размер страницы
      };

      if (data?.results && Array.isArray(data.results)) {
        data.results.forEach((item: any) => {
          if (item.id !== undefined) {
            const resultsMap = moduleStore.catalogsByName[catalogName].GET.RESULTS;
            if (resultsMap) {
              resultsMap.set(String(item.id), item);
            }
          }
        });
      }

      const loadedRanges = moduleStore.catalogsByName[catalogName].GET.loadedRanges;
      if (loadedRanges) {
        loadedRanges.push({
          start: offset,
          end: offset + (data.results?.length || 0) - 1,
          page: Math.floor(offset / limit) + 1,
          timestamp: Date.now(),
        });
      }

      // TODO:
      // Ограничиваем размер кэша при необходимости
      // this.limitCacheSize(moduleName, catalogName);

      // Возвращаем данные с сервера
      console.log(
        `CatalogService.GET: Возвращаем ${
          data.results?.length || 0
        } элементов с сервера (от ${offset} до ${offset + limit})`,
      );
      return data.results || [];
    } catch (error) {
      console.error(
        `Ошибка при загрузке данных с offset ${offset} для каталога ${catalogName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Ограничивает размер кэша, удаляя старые данные
   */
  static limitCacheSize(
    moduleName: string,
    catalogName: string,
    maxItems: number = this.MAX_CACHED_ITEMS,
  ): void {
    const moduleStore = useModuleStore(moduleName) as ModuleStore | undefined;
    if (!moduleStore || !moduleStore.catalogsByName?.[catalogName]?.GET?.RESULTS) {
      return;
    }

    const resultsMap = moduleStore.catalogsByName[catalogName].GET.RESULTS;
    if (!resultsMap || resultsMap.size <= maxItems) return;

    // Если превышен лимит, удаляем самые старые загруженные диапазоны
    const loadedRanges = moduleStore.catalogsByName[catalogName].GET.loadedRanges;
    if (!loadedRanges || loadedRanges.length <= 1) return;

    // Сортируем диапазоны по времени загрузки (от старых к новым)
    loadedRanges.sort((a, b) => a.timestamp - b.timestamp);

    // Удаляем старые диапазоны, пока не уложимся в лимит
    // Для упрощения будем просто удалять самый старый диапазон
    // В реальном приложении здесь нужна более сложная логика
    const oldestRange = loadedRanges.shift();
    if (!oldestRange) return;

    // Удаляем самый старый диапазон из списка
    moduleStore.catalogsByName[catalogName].GET.loadedRanges = loadedRanges.filter(
      (range) => range.timestamp !== oldestRange.timestamp,
    );

    // В реальном приложении здесь нужно удалить записи, относящиеся к этому диапазону
    // Но это сложно реализовать без дополнительного хранения ID для каждого диапазона
    // Поэтому в данной реализации мы просто удаляем диапазон из списка
    console.log(`Удален устаревший диапазон данных для страницы ${oldestRange.page}`);
  }

  /**
   * Получает элементы для указанной страницы из кэша
   */
  static getItemsForPage(
    moduleName: string,
    catalogName: string,
    page: number,
    pageSize: number = 10,
  ): any[] {
    const moduleStore = useModuleStore(moduleName) as ModuleStore | undefined;
    if (!moduleStore || !moduleStore.catalogsByName?.[catalogName]?.GET) {
      return [];
    }

    // Проверяем, есть ли в кэше результаты в виде Map (новый формат)
    if (moduleStore.catalogsByName[catalogName].GET.RESULTS) {
      const resultsMap = moduleStore.catalogsByName[catalogName].GET.RESULTS;
      if (!resultsMap) return [];

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      // Преобразуем Map в массив и берем нужный диапазон
      const resultsArray = Array.from(resultsMap.values());
      return resultsArray.slice(startIndex, Math.min(endIndex, resultsArray.length));
    }

    // Если есть массив results, используем его напрямую (обратная совместимость)
    if (
      moduleStore.catalogsByName[catalogName].GET.results &&
      Array.isArray(moduleStore.catalogsByName[catalogName].GET.results)
    ) {
      const results = moduleStore.catalogsByName[catalogName].GET.results;
      if (!results) return [];

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return results.slice(startIndex, Math.min(endIndex, results.length));
    }

    return [];
  }

  /**
   * Получает общее количество элементов
   */
  static getTotalCount(moduleName: string, catalogName: string): number {
    console.log(`CatalogService.getTotalCount: Запрос для ${moduleName}/${catalogName}`);
    const moduleStore = useModuleStore(moduleName) as ModuleStore | undefined;
    if (!moduleStore || !moduleStore.catalogsByName?.[catalogName]?.GET) {
      console.log('CatalogService.getTotalCount: Нет данных в сторе');
      return 0;
    }

    const count = moduleStore.catalogsByName[catalogName].GET.count || 0;
    console.log(`CatalogService.getTotalCount: Возвращаем count: ${count}`);
    return count;
  }

  /**
   * Получает текущие результаты из стора
   */
  static getResults(moduleName: string, catalogName: string): any[] {
    const moduleStore = useModuleStore(moduleName) as ModuleStore | undefined;
    if (!moduleStore || !moduleStore.catalogsByName?.[catalogName]?.GET?.results) {
      return [];
    }
    return moduleStore.catalogsByName[catalogName].GET.results || [];
  }

  /**
   * Получает элемент по ID из кэша
   */
  static getItemById(moduleName: string, catalogName: string, id: string | number): any | null {
    const moduleStore = useModuleStore(moduleName) as ModuleStore | undefined;
    if (!moduleStore || !moduleStore.catalogsByName?.[catalogName]?.GET?.RESULTS) {
      return null;
    }

    const resultsMap = moduleStore.catalogsByName[catalogName].GET.RESULTS;
    return resultsMap ? resultsMap.get(String(id)) || null : null;
  }

  /**
   * Очищает кэш для указанного каталога
   */
  static clearCache(moduleName: string, catalogName: string): void {
    const moduleStore = useModuleStore(moduleName) as ModuleStore | undefined;
    if (!moduleStore || !moduleStore.catalogsByName?.[catalogName]) {
      return;
    }

    // Сбрасываем данные GET
    moduleStore.catalogsByName[catalogName].GET = {
      RESULTS: new Map(),
      loadedRanges: [],
      metadata: {
        totalCount: 0,
        pageSize: 10,
        next: null,
        previous: null,
      },
    };

    console.log(`Кэш для каталога ${catalogName} очищен`);
  }
}

/**
 * Композабл для использования ленивой загрузки в компонентах Vue
 */
export function useLazyLoad(moduleName: string, catalogName: string, initialPageSize: number = 10) {
  const currentPage = ref(1);
  const pageSize = ref(initialPageSize);
  const loading = ref(false);
  const items = ref<any[]>([]);
  const totalItems = ref(0);

  // Вычисляемое свойство для общего количества страниц
  const totalPages = computed(() => {
    return Math.ceil(totalItems.value / pageSize.value);
  });

  // Загрузка данных для текущей страницы
  const loadCurrentPage = async () => {
    loading.value = true;
    try {
      const result = await CatalogService.GET(
        moduleName,
        catalogName,
        currentPage.value,
        pageSize.value,
      );

      items.value = result;

      // Обновляем общее количество элементов
      totalItems.value = CatalogService.getTotalCount(moduleName, catalogName);
    } catch (error) {
      console.error('CatalogService.GET error:', error);
      console.trace('CatalogService.GET error stack trace');
      throw error;
    } finally {
      console.log('CatalogService.GET: Загрузка данных завершена');
      loading.value = false;
    }
  };

  // Переход на указанную страницу
  const goToPage = async (page: number) => {
    if (page < 1 || (totalPages.value > 0 && page > totalPages.value)) return;

    currentPage.value = page;
    await loadCurrentPage();
  };

  // Переход на следующую страницу
  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      goToPage(currentPage.value + 1);
    }
  };

  // Переход на предыдущую страницу
  const prevPage = () => {
    if (currentPage.value > 1) {
      goToPage(currentPage.value - 1);
    }
  };

  // Изменение размера страницы
  const changePageSize = async (newSize: number) => {
    pageSize.value = newSize;
    currentPage.value = 1; // Сбрасываем на первую страницу при изменении размера
    await loadCurrentPage();
  };

  // Обновление данных (принудительная перезагрузка)
  const refresh = () => {
    CatalogService.clearCache(moduleName, catalogName);
    loadCurrentPage();
  };

  // Загружаем первую страницу при инициализации
  loadCurrentPage();

  return {
    currentPage,
    pageSize,
    loading,
    items,
    totalItems,
    totalPages,
    loadCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    refresh,
  };
}
