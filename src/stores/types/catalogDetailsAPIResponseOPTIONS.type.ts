/**
 * Типы для ответа OPTIONS запроса деталей каталога
 */

export enum LayoutClasses {
  LayoutSection = "LayoutSection",
  LayoutRow = "LayoutRow",
  LayoutTabControl = "LayoutTabControl",
  LayoutTabPanel = "LayoutTabPanel",
  LayoutComputedField = "LayoutComputedField",
  LayoutField = "LayoutField",
  LayoutCharField = "LayoutCharField",
  LayoutIntegerField = "LayoutIntegerField",
  LayoutRichEditField = "LayoutRichEditField",
  LayoutRelatedField = "LayoutRelatedField",
  LayoutChoiceField = "LayoutChoiceField",
  LayoutReverseReferenceField = "LayoutReverseReferenceField",
  ViewSetInlineLayout = "ViewSetInlineLayout",
  ViewSetInlineDynamicLayout = "ViewSetInlineDynamicLayout",
  ViewSetInlineDynamicModelLayout = "ViewSetInlineDynamicModelLayout",
  ViewSetLayout = "ViewSetLayout",
  LayoutChartField = "LayoutChartField",
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

// Столбец таблицы (Любой тип даннных описывается этими полями)
export interface LayoutField {
  // Унаследованные свойства от LayoutElement:
  class_name: string,         // Имя класса элемента
  element_id: string,         // Уникальный идентификатор элемента
  dynamic_component?: string, // Опциональное имя динамического компонента
  name: string,               // ! Имя элемента (ПО ЭТОМУ ПОЛЮ сопоставляется с данными из GET)
  label: string,              // ! Название столбца!
  help_text?: string,         // Опциональный текст подсказки
  grid_cols?: number,         // Опциональное количество колонок в сетке
  widget?: { [key: string]: any },  // Опциональный виджет
  show_if?: FieldSubstitution | string, // Условие отображения
  enable_if?: FieldSubstitution | string, // Условие активации
  discr_keys?: string[],      // Опциональные ключи дискриминации

  // Унаследованные свойства от LayoutFieldBase:
  field_class: string,        // !Класс поля
  minimize?: boolean,         // Опция минимизации
  js_item_repr?: string,      // Строковое представление элемента в JS
  _jsItemReprFn?: (RepresentationFunction | null), // Функция для представления

  // Собственные свойства LayoutField:
  required?: boolean,         // Является ли поле обязательным
  allow_null?: boolean,       // Разрешены ли null значения
  default?: (string | number), // Значение по умолчанию
  read_only?: boolean,        // Только для чтения
  input_type?: string,        // Тип ввода
  pattern?: string,           // Шаблон для валидации
  filterable?: boolean,       // Можно ли фильтровать по этому полю
  sortable?: boolean,         // Можно ли сортировать по этому полю
  hidden?: boolean,           // Скрыто ли поле
  fk_relations?: string[],    // Связи с внешними ключами
  weak_ref?: any,             // Слабая ссылка
  auto_field?: boolean,       // Автоматическое поле
  js_validators?: string[],   // Валидаторы на JavaScript
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

// Вычисляемые поля имеют другую природу и не требуют многих свойств обычных полей ввода
export interface LayoutComputedField {
  // Унаследованные свойства от LayoutElement:
  class_name: string,         // Имя класса элемента (должно быть LayoutClasses.LayoutComputedField)
  element_id: string,         // Уникальный идентификатор элемента
  dynamic_component?: string, // Опциональное имя динамического компонента
  name: string,               // Имя элемента
  label?: string,             // Опциональная метка
  help_text?: string,         // Опциональный текст подсказки
  grid_cols?: number,         // Опциональное количество колонок в сетке
  widget?: { [key: string]: any }, // Опциональный виджет
  show_if?: FieldSubstitution | string, // Условие отображения
  enable_if?: FieldSubstitution | string, // Условие активации
  discr_keys?: string[],      // Опциональные ключи дискриминации

  // Унаследованные свойства от LayoutFieldBase:
  field_class: string,        // Класс поля
  minimize?: boolean,         // Опция минимизации
  js_item_repr?: string,      // Строковое представление элемента в JS
  _jsItemReprFn?: (RepresentationFunction | null), // Функция для представления

  // Собственные свойства LayoutComputedField:
  list_view_items?: string,   // Количество элементов для отображения в списке
}

// Интерфейс используется для представления обратных связей между моделями данных, 
// где одна модель ссылается на другую через внешний ключ. Он позволяет отображать 
// и управлять связанными данными в интерфейсе пользователя.
export interface LayoutReverseField {
  // Унаследованные свойства от LayoutElement:
  class_name: string,         // Имя класса элемента (должно быть LayoutClasses.LayoutReverseReferenceField)
  element_id: string,         // Уникальный идентификатор элемента
  dynamic_component?: string, // Опциональное имя динамического компонента
  name: string,               // Имя элемента
  label?: string,             // Опциональная метка
  help_text?: string,         // Опциональный текст подсказки
  grid_cols?: number,         // Опциональное количество колонок в сетке
  widget?: { [key: string]: any },            // Опциональный виджет
  show_if?: FieldSubstitution | string, // Условие отображения
  enable_if?: FieldSubstitution | string, // Условие активации
  discr_keys?: string[],      // Опциональные ключи дискриминации

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
