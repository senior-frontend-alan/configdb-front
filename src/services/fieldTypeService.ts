// сервис FieldTypeService определяет типы полей в проекте
// Определяет тип поля на основе class_name, field_class или input_type
// Содержит методы для проверки конкретных типов полей (чекбокс, файл, число и т.д.)
// Выбирает подходящий компонент для отображения поля в таблице или форме

// Константы для типов полей = class_name или field_class
export const BACKEND = {
  class_name: {
    // Типы полей на основе class_name
    LAYOUT_FIELD: 'LayoutField',
    LAYOUT_INTEGER_FIELD: 'LayoutIntegerField',
    LAYOUT_CHAR_FIELD: 'LayoutCharField',
    LAYOUT_RICH_EDIT_FIELD: 'LayoutRichEditField', // отобразить в таблице (CLOB отобразить первые несколько символов, отобразить и порезать, любые текстовые данные YAML, JSON, кусок кода, все что угодно) может посмотреть на ф js item repr
    LAYOUT_COMPUTED_FIELD: 'LayoutComputedField',
    LAYOUT_RELATED_FIELD: 'LayoutRelatedField',
    LAYOUT_CHOICE_FIELD: 'LayoutChoiceField',

    // ! не проваливаемся внутрь на этапе показа колонок таблицы
    VIEW_SET_INLINE_LAYOUT: 'ViewSetInlineLayout', // подчиненная вложенная таблица/объект
    VIEW_SET_INLINE_DYNAMIC_LAYOUT: 'ViewSetInlineDynamicLayout', // подчиненная вложенная таблица/объект с динамическим макетом
    VIEW_SET_INLINE_DYNAMIC_MODEL_LAYOUT: 'ViewSetInlineDynamicModelLayout', // подчиненная вложенная таблица/объект с динамической моделью

    LAYOUT_SECTION: 'LayoutSection',
    LAYOUT_ROW: 'LayoutRow',
    // LAYOUT_REVERSE_REFERENCE_FIELD: 'LayoutReverseReferenceField',
  },
  field_class: {
    // Типы полей на основе field_class (для обратной совместимости)
    INTEGER_FIELD: 'IntegerField',
    DECIMAL_FIELD: 'DecimalField',
    BOOLEAN_FIELD: 'BooleanField',
    NULL_BOOLEAN_FIELD: 'NullBooleanField',
    CHAR_FIELD: 'CharField',
    DATE_TIME_FIELD: 'DateTimeField',
    DATE_FIELD: 'DateField',
    TIME_FIELD: 'TimeField',
    CHOICE_FIELD: 'ChoiceField',
    PRIMARY_KEY_RELATED_FIELD: 'PrimaryKeyRelatedLookupField',
    COMPUTED_FIELD: 'ComputedField',
    MANY_RELATED_FIELD: 'ManyRelatedField',
    // WEAK_RELATED_FIELD: 'WeakRelatedLookupField',
    // SERIALIZER: 'Serializer',

    // ! не проваливаемся внутрь на этапе показа колонок таблицы
    // VIEW_SET_INLINE_DYNAMIC_LAYOUT: 'ViewSetInlineDynamicLayout', // подчиненная вложенная таблица/объект
    // VIEW_SET_INLINE_DYNAMIC_MODEL_LAYOUT: 'ViewSetInlineDynamicModelLayout', // подчиненная вложенная таблица/объект
    // или field_class: "ListSerializer"
    LIST_SERIALIZER: 'ListSerializer', // Сериализатор списка
  },
  input_type: {
    CHECKBOX: 'checkbox',
    // Чекбокс: v-else-if="item.el.input_type=='checkbox' || item.el.field_class=='BooleanField' || item.el.field_class=='NullBooleanField'"
    // Файл: v-else-if="item.el.input_type=='file'"
  },

  // на этапе добавления записи скрываются read_only поля
} as const;

// По ним будут рисоваться компоненты для отображения полей в интерфейсе
export const FRONTEND = {
  // Типы полей для фронтенда
  CHAR: 'char',
  INTEGER: 'integer',
  DECIMAL: 'decimal',
  BOOLEAN: 'boolean',
  DATE_TIME: 'datetime',
  DATE: 'date',
  TIME: 'time',
  CHOICE: 'choice',
  RICH_EDIT: 'rich_edit',
  COMPUTED: 'computed',
  RELATED: 'related', // простой дропдаун (как choice)
  PRIMARY_KEY_RELATED: 'primary_key_related', // модальное окно с новой таблицей
  MANY_RELATED: 'many_related', // модальное окно с новой таблицей и возможность добавления нескольких записей (chips)
  VIEW_SET_INLINE_LAYOUT: 'view_set_inline_layout', // подчиненная вложенная в поле таблица/объект

  SECTION: 'section',
  ROW: 'row',
} as const;

// Теперь используем только BACKEND и FRONTEND константы

/**

 * Базовый интерфейс для определения поля
 */
export interface FieldDefinition {
  name: string;
  label?: string;
  class_name?: string;
  field_class?: string;
  input_type?: string;
  required?: boolean;
  allow_null?: boolean;
  read_only?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  multiple?: boolean;
  default?: any;
  help_text?: string;
  placeholder?: string;
  [key: string]: any;
}

export type FormattingOptions = {
  moduleName?: string;
  jsItemRepr?: string;
  emptyArrayValue?: string;
  nullValue?: string;
  locale?: string;
  roundDecimals?: number;
  maximumLength?: number;
  richEditMaxLength?: number;
  maxInlineItems?: number;
  multiple?: boolean;
  choices?: Array<{ value: string | number; display_name: string }>;
};

export class FieldTypeService {
  static getFieldType(fieldDef: FieldDefinition): string {
    // Приоритет: field_class > class_name > input_type

    // Определение по field_class
    if (fieldDef.field_class) {
      switch (fieldDef.field_class) {
        case BACKEND.field_class.INTEGER_FIELD:
          return FRONTEND.INTEGER;
        case BACKEND.field_class.DECIMAL_FIELD:
          return FRONTEND.DECIMAL;
        case BACKEND.field_class.CHAR_FIELD:
          // Проверяем, является ли поле редактором кода (LAYOUT_RICH_EDIT_FIELD)
          if (fieldDef.class_name === BACKEND.class_name.LAYOUT_RICH_EDIT_FIELD) {
            return FRONTEND.RICH_EDIT;
          }
          return FRONTEND.CHAR;
        case BACKEND.field_class.DATE_TIME_FIELD:
          return FRONTEND.DATE_TIME;
        case BACKEND.field_class.DATE_FIELD:
          return FRONTEND.DATE;
        case BACKEND.field_class.TIME_FIELD:
          return FRONTEND.TIME;
        case BACKEND.field_class.CHOICE_FIELD:
          return FRONTEND.CHOICE;
        case BACKEND.field_class.PRIMARY_KEY_RELATED_FIELD:
          if (fieldDef.choices && Array.isArray(fieldDef.choices)) {
            return FRONTEND.RELATED; // Если есть choices, то это обычный Related (отображаем как выпадающий список),
          }
          return FRONTEND.PRIMARY_KEY_RELATED; // иначе - PrimaryKeyRelated (отображаем как модальное окно с новой таблицей)
        case BACKEND.field_class.MANY_RELATED_FIELD:
          return FRONTEND.MANY_RELATED;
        // case BACKEND.field_class.WEAK_RELATED_FIELD:
        case BACKEND.field_class.COMPUTED_FIELD:
          return FRONTEND.COMPUTED;
        case BACKEND.field_class.BOOLEAN_FIELD:
        case BACKEND.field_class.NULL_BOOLEAN_FIELD:
          return FRONTEND.BOOLEAN;
      }
    }

    // Определение по class_name
    if (fieldDef.class_name) {
      switch (fieldDef.class_name) {
        case BACKEND.class_name.LAYOUT_INTEGER_FIELD:
          return FRONTEND.INTEGER;
        case BACKEND.class_name.LAYOUT_FIELD:
        case BACKEND.class_name.LAYOUT_CHAR_FIELD:
          return FRONTEND.CHAR;
        case BACKEND.class_name.LAYOUT_RICH_EDIT_FIELD:
          return FRONTEND.RICH_EDIT;
        case BACKEND.class_name.LAYOUT_CHOICE_FIELD:
          return FRONTEND.CHOICE;
        case BACKEND.class_name.LAYOUT_COMPUTED_FIELD:
          return FRONTEND.COMPUTED;
        case BACKEND.class_name.LAYOUT_RELATED_FIELD:
          return FRONTEND.RELATED;
        case BACKEND.class_name.VIEW_SET_INLINE_LAYOUT:
          return FRONTEND.VIEW_SET_INLINE_LAYOUT;

        case BACKEND.class_name.LAYOUT_SECTION:
          return FRONTEND.SECTION;
        case BACKEND.class_name.LAYOUT_ROW:
          return FRONTEND.ROW;
      }
    }

    // Определение по input_type
    if (fieldDef.input_type) {
      switch (fieldDef.input_type) {
        case BACKEND.input_type.CHECKBOX:
          return FRONTEND.BOOLEAN;
        default:
          return FRONTEND.CHAR;
      }
    }

    // По умолчанию - текстовое поле
    return FRONTEND.CHAR;
  }
}
