// src/services/CatalogService.ts
import { FieldTypeService, FRONTEND } from '../services/fieldTypeService';
import api from '../api';
import { useModuleStore, Catalog } from '../stores/module-factory';
import type { CatalogDetailsAPIResponseGET } from '../stores/types/catalogDetailsAPIResponseGET.type';
import type { CatalogDetailsAPIResponseOPTIONS } from '../stores/types/catalogDetailsAPIResponseOPTIONS.type';
import type { Layout } from '../stores/types/catalogDetailsAPIResponseOPTIONS.type';
import type { CatalogItem } from '../stores/types/catalogsAPIResponseGET.type';

// Сервис отвечает только за коммуникацию с API (не отвечают за кэширование и обновление соответствующих сторов)
// Маршрутизатор → Стор → Сервисы → Компоненты

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

export class CatalogService {
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
   * @description Только взаимодействие с API, без работы со стором
   */
  static async GET(url: string, offset: number, limit: number = 20): Promise<any> {
    try {
      if (!url) {
        throw new Error(`URL каталога не указан.`);
      }

      // Формируем URL с параметрами пагинации
      const queryChar = url.includes('?') ? '&' : '?';
      const paginatedUrl = `${url}${queryChar}limit=${limit}&offset=${offset}&mode=short`;

      console.log(`CatalogService.GET: Запрос к API: ${paginatedUrl}`);
      const response = await api.get<CatalogDetailsAPIResponseGET>(paginatedUrl);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при загрузке данных с offset ${offset} для URL ${url}:`, error);
      throw error;
    }
  }

  // Загрузка метаданных каталога через OPTIONS-запрос
  static async OPTIONS(url: string): Promise<CatalogDetailsAPIResponseOPTIONS> {
    try {
      if (!url) {
        throw new Error(`URL каталога не указан.`);
      }

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

      console.log(`CatalogService.OPTIONS: Метаданные успешно загружены для ${url}`);
      return optionsResponseData;
    } catch (error) {
      console.error(`Ошибка при загрузке метаданных для URL ${url}:`, error);
      throw error;
    }
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
