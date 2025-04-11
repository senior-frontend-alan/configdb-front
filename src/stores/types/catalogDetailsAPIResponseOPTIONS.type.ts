/**
 * Типы для ответа OPTIONS запроса деталей каталога
 */

// соотношение нашего UI с тем что приходит из class_name
export enum LayoutClasses {
  LayoutSection = "LayoutSection",
  LayoutRow = "LayoutRow",
  LayoutTabControl = "LayoutTabControl",
  LayoutTabPanel = "LayoutTabPanel",
  LayoutComputedField = "LayoutComputedField", // отобразить в таблице
  LayoutField = "LayoutField", // по-хорошему с бэка приходить не должны (оставлена для обратной совместимости)
  LayoutCharField = "LayoutCharField", // отобразить в таблице
  LayoutIntegerField = "LayoutIntegerField", // отобразить в таблице
  LayoutRichEditField = "LayoutRichEditField", // отобразить в таблице (CLOB отобразить первые несколько символов, отобразить и порезать, любые текстовые данные YAML, JSON, кусок кода, все что угодно) может посмотреть на ф js item repr
  LayoutRelatedField = "LayoutRelatedField", // отобразить в таблице (вывести связанный объект)
  LayoutChoiceField = "LayoutChoiceField", // отобразить в таблице СЕЛЕКТ
  LayoutReverseReferenceField = "LayoutReverseReferenceField",
  ViewSetInlineLayout = "ViewSetInlineLayout", // отобразить в таблике ОБЪЕКТ заданной структуры с четким строковым представлением
  ViewSetInlineDynamicLayout = "ViewSetInlineDynamicLayout", 
  ViewSetInlineDynamicModelLayout = "ViewSetInlineDynamicModelLayout",
  ViewSetLayout = "ViewSetLayout", // описание OPTION запроса (берется дефолтный список полей, их порядко, возможность сортировок на бэкенде)
  LayoutChartField = "LayoutChartField", // ! нужно будет отделить лэйаут для дашбордов от лэйаута форм ввода
}

interface LayoutElement {
  class_name: string,
  element_id: string,
  dynamic_component?:string,
  name: string,
  label?: string,
  help_text?: string,
  grid_cols?: number,
  widget?: Widget,
  show_if?: FieldSubstitution | string,
  enable_if?: FieldSubstitution | string,
  discr_keys?: string[],
}

export interface Widget {
  [key: string]: any,
}



// Не удалять мой оригинальный интерфейс
// export interface LayoutElement {
//   class_name: LayoutClasses;
//   element_id: string;
//   name: string; // по этому полю сопоставляется с данными из GET
//   label?: string;
//   help_text?: string;
//   field_class?: string;
//   required?: boolean;
//   read_only?: boolean;
//   input_type?: string;
//   min_value?: number;
//   max_value?: number;
//   max_length?: number;
//   multiline?: boolean;
//   allow_null?: boolean;
//   elements?: LayoutElement[];
// }

// Каждый Столбец таблицы (Любой тип даннных описывается этими полями)

export interface LayoutField {
  // Свойства из LayoutElement
  class_name: string,         // !тип компонента макета
  element_id: string,         // уникальный идентификатор элемента
  dynamic_component?: string, // опциональное имя динамического компонента
  name: string,               // !имя элемента (используется для сопоставления с данными из GET)
  label: string,              // !название столбца
  help_text?: string,         // подсказка
  grid_cols?: number,         // количество колонок в сетке
  widget?: { [key: string]: any }, // виджет
  show_if?: FieldSubstitution | string, // условие отображения
  enable_if?: FieldSubstitution | string, // условие активации
  discr_keys?: string[],      // опциональные ключи дискриминации
  
  // Свойства из LayoutFieldBase
  field_class: string,        // тип данных поля (НЕ ЗАВЯЗЫВАЕМСЯ на него)
  minimize?: boolean,         // опция минимизации
  js_item_repr?: string,      // строковое представление элемента в JS
  multiple?: boolean,         //  флаг множественного выбора
  list_view_items?: number,   // количество элементов для отображения в списке
  
  // Свойства из LayoutField
  required?: boolean,         // обязательное поле
  allow_null?: boolean,       // разрешены null значения
  default?: (string | number | object | (string | number | object)[]), // значение по умолчанию  (с расширенным типом)
  read_only?: boolean,        // только для чтения
  input_type?: string,        // тип ввода
  pattern?: string,           // шаблон для валидации
  filterable?: boolean,       // можно ли фильтровать по этому полю
  sortable?: boolean,         // можно ли сортировать по этому полю
  hidden?: boolean,           // скрытое поле
  fk_relations?: string[],    // связь с внешними ключами
  weak_ref?: any,             // слабая ссылка
  auto_field?: boolean,       // автоматическое поле
  js_validators?: string[],   // валидаторы на JavaScript
}

export interface FieldSubstitution {
  [fieldname: string]: (string | number | string[] | number[]),
}

type RepresentationFunction = (data: any) => any;

export interface LayoutCharField extends LayoutField {
  max_length?: number,
  multiline?: boolean,
}

export interface LayoutIntegerField extends LayoutField {
  min_value?: number,
  max_value?: number,
}

export interface LayoutRelatedField extends LayoutField {
  list_url: string,
  view_name: string,
  appl_name: string,
  lookup?: boolean,
  choices?: Choice[],
  related_fk?: FieldSubstitution,
  substitutions?: (string[] | FieldSubstitution),
  display_list?: string[],
  item_repr?: string,
  obj_repr?: string[],
  auto_select_unique?: boolean,
}

export interface LayoutRichEditField extends LayoutField {
  edit_mode: string
}

export interface Choice {
  value: (string|number),
  display_name: string
};

// Интерфейс для поля выбора из списка
export interface LayoutChoiceField extends LayoutField {
  choices?: Choice[],
  multiple?: boolean,
  chocesMap?: {[value: string | number]: Choice}
}

export interface ViewSetInlineDynamicLayout extends LayoutField {
  layout_uri: string,
  layout_fk?: FieldSubstitution,
}

// Интерфейс используется для представления обратных связей между моделями данных, 
// где одна модель ссылается на другую через внешний ключ. Он позволяет отображать 
// и управлять связанными данными в интерфейсе пользователя.
export interface LayoutReverseField {
  // Свойства из LayoutElement
  class_name: string,         // !тип компонента макета
  element_id: string,         // уникальный идентификатор элемента
  dynamic_component?: string, // опциональное имя динамического компонента
  name: string,               // !имя элемента (используется для сопоставления с данными из GET)
  label: string,              // !название столбца
  help_text?: string,         // подсказка
  grid_cols?: number,         // количество колонок в сетке
  widget?: { [key: string]: any }, // виджет
  show_if?: FieldSubstitution | string, // условие отображения
  enable_if?: FieldSubstitution | string, // условие активации
  discr_keys?: string[],      // опциональные ключи дискриминации

  // Собственные свойства LayoutReverseField:
  field_class: string,        // Класс поля
  appl_name: string,          // Имя приложения
  view_name: string,          // Имя представления
  model_label: string,        // Метка модели
  url: string,                // URL для доступа к связанным данным
  to_field: string,           // Поле назначения
  fk_field: string,           // Поле внешнего ключа
  multiple?: boolean,         // Множественная связь
  queries: any,               // Запросы для фильтрации связанных данных
}

// Вычисляемые поля имеют другую природу и не требуют многих свойств обычных полей ввода
export interface LayoutComputedField {
  // Свойства из LayoutElement
  class_name: string,         // !тип компонента макета
  element_id: string,         // уникальный идентификатор элемента
  dynamic_component?: string, // опциональное имя динамического компонента
  name: string,               // !имя элемента (используется для сопоставления с данными из GET)
  label: string,              // !название столбца
  help_text?: string,         // подсказка
  grid_cols?: number,         // количество колонок в сетке
  widget?: { [key: string]: any }, // виджет
  show_if?: FieldSubstitution | string, // условие отображения
  enable_if?: FieldSubstitution | string, // условие активации
  discr_keys?: string[],      // опциональные ключи дискриминации

  // Унаследованные свойства от LayoutFieldBase:
  field_class: string,        // Класс поля
  minimize?: boolean,         // Опция минимизации
  js_item_repr?: string,      // Строковое представление элемента в JS
  _jsItemReprFn?: (RepresentationFunction | null), // Функция для представления

  // Собственные свойства LayoutComputedField:
  list_view_items?: string,   // Количество элементов для отображения в списке
}

export interface ViewSetInlineLayout extends ModelLayout {
  field_class: string,
  label: string,
  read_only?: boolean;
  allow_null?: boolean,
  allow_empty?: boolean,
  min_cardinality?: number,
  max_cardinality?: number,
  list_view_items?: number,
  js_default_order?: string[],
  batch_create_by?: string,
  schema?: any,
  domain?: string,
}

export interface ModelLayout extends LayoutGroup {
  view_name: string,
  display_list?: string[],
  filterable_list?: string[],
  sortable_list?: string[]
  natural_key: string[],
  primary_key: string,
  keyset?: string[],
  js_validators?: string[],
  item_repr?: string,
  js_item_repr?: string,
  hierarchy_parent?: string,
  hierarchy_child?: string,
  discriminator?: string,
  discriminator_map?: {[value: string]: (string | number)[]},
}

export interface LayoutGroup extends LayoutElement {
  elements: LayoutGroupElement[]
}

type LayoutGroupElement = (
  LayoutField | LayoutCharField | LayoutIntegerField | LayoutRichEditField |
  LayoutChoiceField | LayoutReverseField | LayoutGroup
);



// Тип для layout
export interface Layout {
  class_name: LayoutClasses;
  element_id: string;
  name: string;
  elements: LayoutField[];
  view_name: string;
  natural_key: string[];
  primary_key: string;
  keyset: string[];
  set_operations: boolean;
  display_list_modal: string[];
}

// ------------------------------------------------------------------------------------------------------
// Базовый тип для поля в actions
export interface ActionField {
  type: string;
  required: boolean;
  read_only: boolean;
  label: string;
  max_length?: number;
  min_value?: number;
  max_value?: number;
}

// Тип для действий (POST, PUT, PATCH и т.д.)
export interface Actions {
  [method: string]: {
    [fieldName: string]: ActionField;
  };
}

// Тип для разрешенных действий
export interface PermittedAction {
  detail: boolean;
  methods: string[];
}

export interface PermittedActions {
  get: boolean;
  delete: boolean;
  patch: boolean;
  put: boolean;
  post: boolean;
  copy?: boolean;
  batch?: PermittedAction; // поле определяет разрешения для пакетных операций, первый столбец (чекбоксы в таблице)
  count?: PermittedAction;
  exportData?: PermittedAction;
  importData?: PermittedAction;
  lastTransaction?: PermittedAction;
  maxUpdated?: PermittedAction;
  [key: string]: boolean | PermittedAction | undefined;
}

// Основной тип для ответа OPTIONS запроса
export interface CatalogDetailsAPIResponseOPTIONS {
  name: string;
  description: string;
  renders: string[];
  parses: string[];
  actions: Actions;
  layout: Layout;
  transaction_required: boolean;
  permitted_actions: PermittedActions;
}

// Для обратной совместимости
export type OptionsResponse = CatalogDetailsAPIResponseOPTIONS;
