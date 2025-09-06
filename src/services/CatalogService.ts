// src/services/CatalogService.ts
import { FieldTypeService, FRONTEND } from '../services/fieldTypeService';
import api from '../api';
import { useModuleStore, Catalog } from '../stores/module-factory';
import type { CatalogDetailsAPIResponseGET } from '../stores/types/catalogDetailsAPIResponseGET.type';
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
 * Структура GET-запроса каталога
 */
export interface CatalogGetData {
  results: any[]; // Массив записей каталога
  loadedCount?: number; // Количество загруженных записей
  count?: number;
  pageSize: number;
  next: string | null;
  previous: string | null;
  lastEditedID?: string | null; // ID записи для автоматического скроллинга до нее
}

/**
 * Структура данных каталога в сторе
 */
export interface CatalogData {
  GET: CatalogGetData;
  OPTIONS: Record<string, any>;
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

// Тип для ответа OPTIONS запроса
export interface CatalogOPTIONS {
  name: string;
  description: string;
  renders: string[];
  parses: string[];
  actions: {
    POST: Record<
      string,
      {
        type: string;
        required: boolean;
        read_only: boolean;
        label: string;
        help_text?: string;
        max_length?: number;
        choices?: Array<{
          value: number;
          display_name: string;
        }>;
      }
    >;
  };
  layout: {
    class_name: string;
    element_id: string;
    name: string;
    elements: Array<{
      class_name: string;
      element_id: string;
      name: string;
      label: string;
      field_class: string;
      read_only?: boolean;
      input_type: string;
      filterable?: boolean;
      help_text?: string;
      allow_null?: boolean;
      max_length?: number;
      multiline?: boolean;
      default?: number;
      choices?: Array<{
        value: number;
        display_name: string;
      }>;
      list_url?: string;
      view_name?: string;
      appl_name?: string;
      lookup?: boolean;
      required?: boolean;
    }>;
    view_name: string;
    display_list: string[];
    filterable_list: string[];
    natural_key: string[];
    primary_key: string;
    keyset: string[];
    item_repr: string;
    set_operations: boolean;
    // Дополнительные свойства, добавляемые в CatalogService.OPTIONS
    TABLE_COLUMNS?:
      | Map<
          string,
          {
            FRONTEND_CLASS?: string;
            VISIBLE?: boolean;
            TITLE?: string;
            [key: string]: any;
          }
        >
      | {
          [key: string]: {
            FRONTEND_CLASS?: string;
            VISIBLE?: boolean;
            TITLE?: string;
            [key: string]: any;
          };
        };
    elementsIndex?:
      | Map<string, any>
      | {
          [key: string]: any;
        };
  };
  transaction_required: boolean;
  permitted_actions: {
    get: boolean;
    post: boolean;
    patch: boolean;
    put: boolean;
    delete: boolean;
    apiSchema: {
      detail: boolean;
      methods: string[];
    };
    batch: {
      detail: boolean;
      methods: string[];
    };
    count: {
      detail: boolean;
      methods: string[];
    };
    export: {
      detail: boolean;
      methods: string[];
    };
    exportData: {
      detail: boolean;
      methods: string[];
    };
    importData: {
      detail: boolean;
      methods: string[];
    };
    lastTransaction: {
      detail: boolean;
      methods: string[];
    };
    maxUpdated: {
      detail: boolean;
      methods: string[];
    };
    copy: boolean;
  };
  filterset_fields: Array<{
    filter_name: string;
    lookup_expr: string;
    label: string;
    class_name: string;
    field_name: string;
  }>;
  search_fields: string[];
  model_name: string;
  verbose_name: string;
  verbose_name_plural: string;
  help: string;
  details_info?: {
    appl_name: string;
    view_name: string;
    primary_field: string;
    show_if: string;
  };
}

/**
 * Структура стора модуля
 */
export interface ModuleStore {
  catalogGroups: CatalogGroup[];
  indexCatalogsByApplName: Record<string, Map<string, any>>;
  loading: boolean;
  error: string | null;
  url?: string;
  // Каталоги сохраняются прямо в теле модуля с ключом "applName_catalogName"
  [catalogKey: string]: any; // Для динамических каталогов
}

// Интерфейс для описания макета с элементами и списком отображения
interface LayoutWithElements {
  // Массив элементов макета
  elements: any[];
  // Опциональный список полей для отображения
  display_list?: string[];
}

// Дополнительные свойства, которые мы добавляем в layout:
// - TABLE_COLUMNS: Map<string, any> - соответствует возвращаемому значению createTableColumns
// - elementsIndex: Map<string, any> - соответствует возвращаемому значению createElementsIndex

export class CatalogService {
  /**
   * Получает каталог из стора (каталоги хранятся напрямую в сторе)
   * @param moduleStore Стор модуля
   * @param applName Имя приложения
   * @param catalogName Имя каталога
   * @returns Каталог или undefined
   */
  static getCatalog(
    moduleStore: ModuleStore,
    applName: string,
    catalogName: string,
  ): Catalog | undefined {
    const catalogKey = `${applName}_${catalogName.toLowerCase()}`;
    return (moduleStore as any)[catalogKey];
  }
  /**
   * загружен ли указанный диапазон данных в GET
   */
  static isRangeLoaded(
    moduleStore: ModuleStore,
    applName: string,
    catalogName: string,
    offset: number,
    limit: number,
  ): boolean {
    const catalog = this.getCatalog(moduleStore, applName, catalogName);
    if (!catalog?.GET) {
      console.log(`[isRangeLoaded] Нет каталога или GET данных`);
      return false;
    }

    const loadedCount = catalog.GET.loadedCount || 0;
    const totalCount = catalog.GET.count || 0;
    const requiredCount = offset + limit;

    console.log(
      `[isRangeLoaded] Загружено: ${loadedCount}, нужно: ${requiredCount}, всего: ${totalCount}`,
    );

    // Если все данные загружены, то любой запрос покрыт
    // Загружено: 7, нужно: 20, всего: 7
    if (totalCount > 0 && loadedCount >= totalCount) {
      return true;
    }

    // Проверяем, достаточно ли загруженных данных для запроса
    const rangeIsCovered = loadedCount >= requiredCount;

    return rangeIsCovered;
  }

  /**
   * Загружает данные с указанным смещением
   * @description Только взаимодействие с API, без работы со стором
   */
  static async GET(
    url: string,
    offset: number,
    limit: number = 20,
    filters?: Record<string, any>, // transaction: '1' !!!НЕ transaction: {value: '1'}
  ): Promise<any> {
    try {
      if (!url) {
        throw new Error(`URL каталога не указан.`);
      }

      // Формируем URL с параметрами пагинации
      const queryChar = url.includes('?') ? '&' : '?';
      let paginatedUrl = `${url}${queryChar}limit=${limit}&offset=${offset}&mode=short`;

      if (filters) {
        const filterParams = Object.entries(filters)
          .filter(([, value]) => value !== undefined && value !== null && value !== '')
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');

        if (filterParams) {
          paginatedUrl += `&${filterParams}`;
        }
      }

      console.log(`CatalogService.GET: Запрос к API: ${paginatedUrl}`);
      const response = await api.get<CatalogDetailsAPIResponseGET>(paginatedUrl);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при загрузке данных с offset ${offset} для URL ${url}:`, error);
      throw error;
    }
  }

  // Загрузка метаданных каталога через OPTIONS-запрос
  static async OPTIONS(url: string): Promise<CatalogOPTIONS> {
    try {
      if (!url) {
        throw new Error(`URL каталога не указан.`);
      }

      const optionsResponse = await api.options<CatalogOPTIONS>(url);
      const optionsResponseData = optionsResponse.data;

      // Добавляем наши вычисляемые поля в OPTIONS для удобства
      if (optionsResponseData?.layout) {
        // Создаем необходимые свойства
        const tableColumns = CatalogService.createTableColumns(optionsResponseData.layout);
        const elementsIndex = CatalogService.createElementsIndex(
          optionsResponseData.layout.elements,
        );

        // Добавляем свойства напрямую в layout
        // Используем приведение типов для обхода ограничений TypeScript
        // Создаем таблицу колонок с учетом порядка из display_list
        (optionsResponseData.layout as any).TABLE_COLUMNS = tableColumns;
        // Создаем иерархическую структуру элементов
        (optionsResponseData.layout as any).elementsIndex = elementsIndex;
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
  static createElementsIndex = (elements: any[] | undefined): Map<string, any> => {
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
        element.elementsIndex = CatalogService.createElementsIndex(element.elements);
      }
    });

    // Разрешаем зависимости после создания всей структуры
    // Для каждого поля с related_fk находит связанное поле и добавляет hasDependentFields
    const elementsWithDependencies = CatalogService.resolveFieldDependencies(elementsIndex);

    return elementsWithDependencies;
  };

  // Поиск связанного поля по related_fk в дереве элементов
  // Ищет "снизу вверх": сначала на текущем уровне, затем на родительских уровнях
  static findRelatedField(
    targetField: any,
    currentLevel: Map<string, any>,
    scopeChain: Map<string, any>[] = [],
  ): any | null {
    const relatedFk = targetField.related_fk;
    if (!relatedFk) return null;

    // Поддерживаем разные форматы related_fk:
    // - строка: "char_spec"
    // - массив: ["char_spec"]
    // - объект: {"char_spec": "someValue"}
    let relatedNames: string[] = [];

    if (typeof relatedFk === 'string') {
      relatedNames = [relatedFk];
    } else if (Array.isArray(relatedFk)) {
      relatedNames = relatedFk;
    } else if (typeof relatedFk === 'object') {
      relatedNames = Object.keys(relatedFk);
    }

    // Ищем первое найденное связанное поле
    for (const relatedName of relatedNames) {
      // 1. Сначала ищем на текущем уровне (siblings)
      if (currentLevel.has(relatedName)) {
        return currentLevel.get(relatedName);
      }

      // 2. Поднимаемся по родительским уровням (от ближайшего к дальнему)
      for (let i = scopeChain.length - 1; i >= 0; i--) {
        const parentLevel = scopeChain[i];
        if (parentLevel.has(relatedName)) {
          return parentLevel.get(relatedName);
        }
      }
    }

    return null; // Не найдено
  }

  // Разрешение зависимостей полей в дереве элементов
  // Рекурсивно обходит дерево и находит связанные поля для каждого элемента с related_fk
  // Модифицирует переданную Map напрямую, добавляя поля hasDependentFields и resolvedRelatedField
  static resolveFieldDependencies(
    elements: Map<string, any>,
    parentScopes: Map<string, any>[] = [],
    currentPath: string[] = [],
  ): Map<string, any> {
    elements.forEach((field) => {
      // Строим полный путь к текущему полю
      const fieldPath = [...currentPath, field.name].join(' → ');

      // Если у поля есть related_fk, ищем связанное поле
      if (field.related_fk) {
        const relatedField = this.findRelatedField(
          field,
          elements, // текущий уровень
          parentScopes, // родительские уровни
        );

        if (relatedField) {
          field.resolvedRelatedField = relatedField;

          // Отмечаем связанное поле как имеющее зависимые от него поля
          if (!relatedField.hasDependentFields) {
            relatedField.hasDependentFields = [];
          }
          relatedField.hasDependentFields.push({
            name: field.name,
            path: fieldPath, // полный путь к зависимому полю
            dependentField: field,
          });
        }
      }

      // Рекурсивно обрабатываем вложенные элементы
      if (field.elementsIndex) {
        this.resolveFieldDependencies(
          field.elementsIndex,
          [elements, ...parentScopes], // добавляем текущий уровень в цепочку
          [...currentPath, field.name], // добавляем текущее поле в путь
        );
      }
    });

    return elements; // возвращаем модифицированную Map
  }

  /**
   * Получает общее количество элементов
   */
  static getTotalCount(moduleName: string, applName: string, catalogName: string): number {
    console.log(
      `CatalogService.getTotalCount: Запрос для ${moduleName}/${applName}/${catalogName}`,
    );
    const moduleStore = useModuleStore(moduleName);

    // Получаем каталог по новой схеме
    const catalog = this.getCatalog(moduleStore, applName, catalogName);
    if (!catalog?.GET) {
      console.log('CatalogService.getTotalCount: Нет данных в сторе');
      return 0;
    }

    const catalogData = catalog as Record<string, any>;
    const count = catalogData.GET?.count || 0;
    console.log(`CatalogService.getTotalCount: Возвращаем count: ${count}`);
    return count;
  }

  /**
   * Очищает кэш для указанного каталога
   */
  static clearCache(moduleName: string, applName: string, catalogName: string): void {
    const moduleStore = useModuleStore(moduleName);

    // Получаем каталог по новой схеме
    const catalog = this.getCatalog(moduleStore, applName, catalogName);
    if (!catalog) {
      return;
    }

    // Сбрасываем данные GET
    catalog.GET = {
      results: [], // Массив записей
      loadedCount: 0,
      count: 0,
      pageSize: 20,
      next: null,
      previous: null,
    };

    // Сбрасываем черновики (оставляем пустым объектом)
    catalog.DRAFT = {};

    console.log(`Кэш для каталога ${catalogName} очищен`);
  }
}
