// src/services/CatalogService.ts
import { ref, computed } from 'vue';
import { FieldTypeService, FRONTEND } from '../services/fieldTypeService';
import api from '../api';
import { useModuleStore, initCatalogStructure, Catalog } from '../stores/module-factory';
import type { CatalogDetailsAPIResponseGET } from '../stores/types/catalogDetailsAPIResponseGET.type';
import type { CatalogDetailsAPIResponseOPTIONS } from '../stores/types/catalogDetailsAPIResponseOPTIONS.type';
import type { Layout } from '../stores/types/catalogDetailsAPIResponseOPTIONS.type';
import type { CatalogItem } from '../stores/types/catalogsAPIResponseGET.type';

// Сервисы отвечают за API-запросы, кэширование и обновление соответствующих сторов
// Сторы предоставляют интерфейс для доступа к данным и их изменения

// Маршрутизатор → Стор (Сервисы) → Компоненты

// Сервисы с обновлением стора
// Сервисы отвечают за:
// формирование API-запросов
// обновление соответствующих сторов

// Сторы отвечают за:
// хранение состояния
// предоставление методов для его изменения

// Компоненты отвечают за:
// отображение данных
// вызов сервисов

// Lazy Loading + Virtual Scroll = Эффективность²
// Lazy Loading: экономит трафик и серверные ресурсы
// Virtual Scroll: экономит память браузера и ускоряет рендеринг

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
 * Тип для хранения загруженных диапазонов в виде объекта с ключами по диапазонам
 * Ключ имеет формат "start-end", например "0-19"
 */
export type LoadedRangesMap = Record<string, LoadedRange>;

/**
 * Структура GET-запроса каталога
 */
export interface CatalogGetData {
  resultsIndex: Map<string, Object>;
  results: Object[];
  loadedRanges: LoadedRangesMap;
  count?: number;
  totalCount: number;
  pageSize: number;
  next: string | null;
  previous: string | null;
  recordIdToScroll?: string | null; // ID записи для автоматического скроллинга до нее
}

/**
 * Структура данных каталога в сторе
 */
export interface CatalogData {
  GET: CatalogGetData;
  OPTIONS: Record<string, any>;
  unsavedChanges: Record<string, any>;
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
  loadedCatalogsByApplName: Record<string, Record<string, Catalog>>;
  catalogGroups: CatalogGroup[];
  indexCatalogsByApplName: Record<string, Map<string, any>>;
  loading: boolean;
  error: string | null;
  url?: string;
}

// Интерфейс для описания макета с элементами и списком отображения
interface LayoutWithElements {
  // Массив элементов макета
  elements: any[];
  // Опциональный список полей для отображения
  display_list?: string[];
}

// Расширяем интерфейс Layout для включения дополнительных свойств
interface ExtendedLayout extends Layout {
  TABLE_COLUMNS: Map<string, any>; // Соответствует возвращаемому значению createTableColumns
  elementsIndex: Map<string, any>; // Соответствует возвращаемому значению createElementsMap
}

/**
 * Сервис для ленивой загрузки данных с использованием гибридного подхода
 * Позволяет эффективно управлять кэшированием и загрузкой данных по страницам
 */
export class CatalogService {
  /**
   * Поиск URL для каталога в сторе или в индексе
   * @param moduleName Имя модуля
   * @param applName Имя приложения
   * @param catalogName Имя каталога
   * @returns URL каталога, выбрасывает ошибку, если URL не найден
   */
  static findCatalogUrl(moduleName: string, applName: string, catalogName: string): string {
    const moduleStore = useModuleStore(moduleName);
    let url: string;

    // Проверяем наличие индекса
    if (!moduleStore.indexCatalogsByApplName) {
      const errorMessage = `Индекс каталогов не найден. Загрузите сперва группы каталогов.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Пробуем получить URL из индекса
    const applCatalogs = moduleStore.indexCatalogsByApplName[applName.toLowerCase()];
    if (!applCatalogs) {
      const errorMessage = `Приложение ${applName} не найдено в индексе каталогов. Загрузите сперва группы каталогов.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const catalogItem = applCatalogs.get(catalogName.toLowerCase());
    if (!catalogItem || !catalogItem.href) {
      const errorMessage = `Не найден URL для каталога ${moduleName}/${applName}/${catalogName}. Загрузите сперва группы каталогов.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    url = catalogItem.href;
    console.log(
      `Найден URL для каталога ${moduleName}/${applName}/${catalogName} в индексе: ${url}`,
    );
    return url;
  }

  // Максимальное количество записей в кэше
  // Максимальное количество элементов в кэше было удалено, так как не используется

  /**
   * загружен ли указанный диапазон данных в GET
   */
  static isRangeLoaded(
    moduleName: string,
    applName: string,
    catalogName: string,
    startIndex: number,
    endIndex: number,
  ): boolean {
    const moduleStore = useModuleStore(moduleName) as ModuleStore | undefined;

    if (
      !moduleStore ||
      !moduleStore.loadedCatalogsByApplName ||
      !moduleStore.loadedCatalogsByApplName[applName] ||
      !moduleStore.loadedCatalogsByApplName[applName][catalogName]?.GET
    ) {
      return false;
    }

    // Явное приведение типов для работы с индексированными свойствами
    const catalogData = moduleStore.loadedCatalogsByApplName[applName][catalogName] as Record<
      string,
      any
    >;

    // Проверяем наличие информации о загруженных диапазонах
    const loadedRanges = catalogData.GET?.loadedRanges;
    if (!loadedRanges) return false;

    // Сначала проверяем точное совпадение по ключу (O(1))
    const exactKey = `${startIndex}-${endIndex}`;
    if (loadedRanges[exactKey]) return true;

    return false;
  }

  /**
   * Загружает данные с указанным смещением
   */
  static async GET(
    moduleName: string,
    applName: string,
    catalogName: string,
    offset: number,
    limit: number = 20,
  ): Promise<any[]> {
    console.log(
      `CatalogService.GET: !Запрос данных для ${moduleName}/${applName}/${catalogName}, offset ${offset}, limit ${limit}`,
    );
    try {
      // Получаем URL для загрузки каталога
      const url = CatalogService.findCatalogUrl(moduleName, applName, catalogName);

      // Инициализируем структуру каталога в сторе и получаем ссылку на нее
      const currentCatalog = initCatalogStructure(moduleName, applName, catalogName);

      // Проверяем наличие данных и загружен ли запрошенный диапазон
      if (currentCatalog?.GET?.results && currentCatalog?.GET?.loadedRanges) {
        // Если запрашиваем конкретный диапазон, проверяем его наличие в кэше
        if (this.isRangeLoaded(moduleName, applName, catalogName, offset, offset + limit - 1)) {
          console.log(
            `CatalogService.GET: Данные для ${moduleName}/${applName}/${catalogName} с offset=${offset}, limit=${limit} уже загружены в стор, используем кэш`,
          );

          // Возвращаем только запрошенный диапазон из кэша
          const allResults = currentCatalog.GET.results;
          return allResults.slice(offset, offset + limit);
        } else {
          console.log(
            `CatalogService.GET: Данные для ${moduleName}/${applName}/${catalogName} с offset=${offset}, limit=${limit} не найдены в кэше, загружаем с сервера`,
          );
        }
      } else {
        console.log(
          `CatalogService.GET: Структура каталога ${catalogName} инициализирована, но данных еще нет, загружаем с сервера`,
        );
      }

      // Примечание: при использовании offset мы не проверяем кэш, так как при бесконечном скролле
      // нам нужно добавлять новые данные к уже загруженным
      const queryChar = url.includes('?') ? '&' : '?';
      const paginatedUrl = `${url}${queryChar}limit=${limit}&offset=${offset}&mode=short`;

      console.log(`CatalogService.GET: Запрос к API: ${paginatedUrl}`);
      const response = await api.get<CatalogDetailsAPIResponseGET>(paginatedUrl);
      const data = response.data;

      // Сохраняем ответ API в стор, объединяя результаты
      const existingResults = currentCatalog.GET?.results || [];
      const newResults = data.results || [];

      // Если это первая загрузка (offset = 0), заменяем результаты
      // При offset === 0 мы ожидаем, что это новая загрузка с самого начала, поэтому нам нужно заменить все существующие данные новыми, а не добавлять новые данные к старым.
      // Текущая реализация с условием обеспечивает:
      // Очистку старых данных при новой загрузке с начала (offset === 0)
      // Добавление новых данных к существующим при подгрузке при скролле (offset > 0)
      const combinedResults = offset === 0 ? newResults : [...existingResults, ...newResults];

      currentCatalog.GET = {
        ...currentCatalog.GET, // Сохраняем существующие данные (например, resultsIndex и loadedRanges)
        ...data, // Добавляем все поля из ответа API
        results: combinedResults, // Явно указываем объединенные результаты
        pageSize: limit, // Добавляем размер страницы
        recordIdToScroll: currentCatalog.GET?.recordIdToScroll || null, // ID записи для скроллинга
      };

      if (data?.results && Array.isArray(data.results)) {
        data.results.forEach((item: any) => {
          if (item.id !== undefined) {
            const resultsMap = currentCatalog.GET.resultsIndex;
            if (resultsMap) {
              resultsMap.set(String(item.id), item);
            }
          }
        });
      }

      const loadedRanges = currentCatalog.GET.loadedRanges;
      if (loadedRanges) {
        // Формируем ключ для диапазона в формате "start-end"
        const start = offset;
        const end = offset + (data.results?.length || 0) - 1;
        const rangeKey = `${start}-${end}`;

        // Сохраняем объект диапазона по этому ключу
        loadedRanges[rangeKey] = {
          start,
          end,
          page: Math.floor(offset / limit) + 1,
          timestamp: Date.now(),
        };
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

  // Загрузка метаданных каталога через OPTIONS-запрос и формирование структуры OPTIONS в сторе
  static async OPTIONS(
    moduleName: string,
    applName: string,
    catalogName: string,
  ): Promise<CatalogDetailsAPIResponseOPTIONS> {
    const moduleStore = useModuleStore(moduleName);

    // Возвращаем OPTIONS из кэша если он есть
    if (
      moduleStore.loadedCatalogsByApplName &&
      moduleStore.loadedCatalogsByApplName[applName] &&
      moduleStore.loadedCatalogsByApplName[applName][catalogName]?.OPTIONS
    ) {
      console.log(
        `CatalogService.OPTIONS: Метаданные для ${moduleName}/${applName}/${catalogName} уже загружены в стор, используем кэш`,
      );
      return moduleStore.loadedCatalogsByApplName[applName][catalogName].OPTIONS;
    }

    // findCatalogUrl выбросит ошибку, если URL не найден
    const url = CatalogService.findCatalogUrl(moduleName, applName, catalogName);

    // ШАГ 2: Загрузка метаданных через OPTIONS-запрос
    const optionsResponse = await api.options<CatalogDetailsAPIResponseOPTIONS>(url);
    const optionsResponseData = optionsResponse.data;

    // Добавляем наши вычисляемые поля в OPTIONS для удобства
    if (optionsResponseData?.layout) {
      const layout = optionsResponseData.layout as ExtendedLayout;

      // Создаем таблицу колонок с учетом порядка из display_list
      layout.TABLE_COLUMNS = CatalogService.createTableColumns(layout);

      // Создаем иерархическую структуру элементов
      layout.elementsIndex = CatalogService.createElementsMap(layout.elements);
    }

    // Инициализируем структуру каталога и получаем ссылку на нее
    const currentCatalog = initCatalogStructure(moduleName, applName, catalogName);
    currentCatalog.OPTIONS = optionsResponseData;

    console.log(
      `Метаданные каталога ${catalogName} успешно загружены через OPTIONS и сохранены в сторе`,
    );
    return optionsResponseData;
  }

  // Функция для создания плоской Map-структуры со всеми полями из elements и их вложенных элементов
  static createTableColumns(obj: LayoutWithElements): Map<string, any> {
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
        let choicesIndex: Map<string, string> | undefined;
        if (
          FRONTEND_CLASS === FRONTEND.CHOICE &&
          element.choices &&
          Array.isArray(element.choices)
        ) {
          choicesIndex = new Map<string, string>();
          element.choices.forEach((choice: { value: string | number; display_name: string }) => {
            choicesIndex?.set(String(choice.value), choice.display_name);
          });
        }

        // Определяем видимость элемента на основе display_list
        // Если display_list пуст, то все элементы видимы, иначе только те, которые в списке
        const VISIBLE = displayList.length === 0 || displayList.includes(element.name);

        const elementCopy = {
          ...element,
          FRONTEND_CLASS,
          VISIBLE,
          ...(choicesIndex ? { choicesIndex } : {}),
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
  }

  // Функция для создания иерархической Map-структуры элементов
  // Он добавляет дополнительные вычисляемые поля к элементам:
  // FRONTEND_CLASS - определяет тип поля для фронтенда
  // TABLE_COLUMNS - для элементов типа ViewSetInlineLayout
  // elementsIndex - вложенная Map-структура для дочерних элементов
  static createElementsMap = (elements: any[] | undefined): Map<string, any> => {
    const elementsIndex = new Map<string, any>();

    if (!elements || !Array.isArray(elements)) {
      return elementsIndex;
    }

    // Обрабатываем элементы текущего уровня
    elements.forEach((element, index) => {
      // ! ИМЯ МОЖЕТ БЫТЬ ПУСТЫМ и тогда мы пропустим элемент
      // Используем имя элемента или его индекс как ключ
      const key = element.name || `unnamed_${index}`;

      element.FRONTEND_CLASS = FieldTypeService.getFieldType(element);

      // Добавляем элемент в Map текущего уровня
      elementsIndex.set(key, element);

      // Если это ViewSetInlineLayout, создаем TABLE_COLUMNS
      if (element.class_name === 'ViewSetInlineLayout' && element.elements?.length > 0) {
        // Создаем плоскую структуру для всех вложенных элементов
        element.TABLE_COLUMNS = CatalogService.createTableColumns(element);
      }

      // Если у элемента есть вложенные элементы, создаем для них свою Map-структуру
      if (element.elements?.length > 0) {
        // Создаем Map для вложенных элементов
        element.elementsIndex = CatalogService.createElementsMap(element.elements);
      }
    });

    return elementsIndex;
  };

  /**
   * Не удалять!
   * Ограничивает размер кэша, удаляя старые данные
   */
  // static limitCacheSize(
  //   moduleName: string,
  //   catalogName: string,
  //   maxItems: number = this.MAX_CACHED_ITEMS,
  // ): void {
  //   const moduleStore = useModuleStore(moduleName) as ModuleStore | undefined;
  //   if (!moduleStore || !moduleStore.loadedCatalogsByApplName[applName][catalogName]?.GET?.resultsIndex) {
  //     return;
  //   }

  //   const resultsMap = moduleStore.loadedCatalogsByApplName[applName][catalogName].GET.resultsIndex;
  //   if (!resultsMap || resultsMap.size <= maxItems) return;

  //   // Если превышен лимит, удаляем самые старые загруженные диапазоны
  //   const loadedRanges = moduleStore.loadedCatalogsByApplName[applName][catalogName].GET.loadedRanges;
  //   if (!loadedRanges || loadedRanges.length <= 1) return;

  //   // Сортируем диапазоны по времени загрузки (от старых к новым)
  //   loadedRanges.sort((a, b) => a.timestamp - b.timestamp);

  //   // Удаляем старые диапазоны, пока не уложимся в лимит
  //   // Для упрощения будем просто удалять самый старый диапазон
  //   // В реальном приложении здесь нужна более сложная логика
  //   const oldestRange = loadedRanges.shift();
  //   if (!oldestRange) return;

  //   // Удаляем самый старый диапазон из списка
  //   moduleStore.loadedCatalogsByApplName[applName][catalogName].GET.loadedRanges = loadedRanges.filter(
  //     (range) => range.timestamp !== oldestRange.timestamp,
  //   );

  //   // В реальном приложении здесь нужно удалить записи, относящиеся к этому диапазону
  //   // Но это сложно реализовать без дополнительного хранения ID для каждого диапазона
  //   // Поэтому в данной реализации мы просто удаляем диапазон из списка
  //   console.log(`Удален устаревший диапазон данных для страницы ${oldestRange.page}`);
  // }

  /**
   * Получает общее количество элементов
   */
  static getTotalCount(moduleName: string, applName: string, catalogName: string): number {
    console.log(
      `CatalogService.getTotalCount: Запрос для ${moduleName}/${applName}/${catalogName}`,
    );
    const moduleStore = useModuleStore(moduleName);

    // Проверяем наличие структуры в сторе
    if (
      !moduleStore ||
      !moduleStore.loadedCatalogsByApplName ||
      !moduleStore.loadedCatalogsByApplName[applName] ||
      !moduleStore.loadedCatalogsByApplName[applName][catalogName]?.GET
    ) {
      console.log('CatalogService.getTotalCount: Нет данных в сторе');
      return 0;
    }

    // Явное приведение типов для работы с индексированными свойствами
    const catalogData = moduleStore.loadedCatalogsByApplName[applName][catalogName] as Record<
      string,
      any
    >;
    const count = catalogData.GET?.count || 0;
    console.log(`CatalogService.getTotalCount: Возвращаем count: ${count}`);
    return count;
  }

  /**
   * Очищает кэш для указанного каталога
   */
  static clearCache(moduleName: string, applName: string, catalogName: string): void {
    const moduleStore = useModuleStore(moduleName);
    if (
      !moduleStore ||
      !moduleStore.loadedCatalogsByApplName ||
      !moduleStore.loadedCatalogsByApplName[applName] ||
      !moduleStore.loadedCatalogsByApplName[applName][catalogName]
    ) {
      return;
    }

    // Сбрасываем данные GET
    moduleStore.loadedCatalogsByApplName[applName][catalogName].GET = {
      resultsIndex: new Map(),
      loadedRanges: {},
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
export function useLazyLoad(
  moduleName: string,
  applName: string,
  catalogName: string,
  initialPageSize: number = 10,
) {
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
        applName,
        catalogName,
        currentPage.value,
        pageSize.value,
      );

      items.value = result;

      // Обновляем общее количество элементов
      totalItems.value = CatalogService.getTotalCount(moduleName, applName, catalogName);
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
    CatalogService.clearCache(moduleName, applName, catalogName);
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
