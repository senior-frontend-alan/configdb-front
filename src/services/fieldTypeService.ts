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
    // LIST_SERIALIZER: 'ListSerializer',
    // SERIALIZER: 'Serializer',
    
    // ! не проваливаемся внутрь на этапе показа колонок таблицы
    // VIEW_SET_INLINE_LAYOUT: 'ViewSetInlineLayout', // подчиненная вложенная таблица/объект
    // VIEW_SET_INLINE_DYNAMIC_LAYOUT: 'ViewSetInlineDynamicLayout', // подчиненная вложенная таблица/объект
    // VIEW_SET_INLINE_DYNAMIC_MODEL_LAYOUT: 'ViewSetInlineDynamicModelLayout', // подчиненная вложенная таблица/объект
    // или field_class: "ListSerializer"
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
  INTEGER: 'Integer',
  DECIMAL: 'Decimal',
  BOOLEAN: 'Boolean',
  CHAR: 'Char',
  DATE_TIME: 'DateTime',
  DATE: 'Date',
  TIME: 'Time',
  CHOICE: 'Choice',
  RICH_EDIT: 'RichEdit',
  PRIMARY_KEY_RELATED: 'PrimaryKeyRelated',
  COMPUTED: 'Computed',
  RELATED: 'Related',
  // MANY_RELATED_FIELD: 'ManyRelatedField',
  // WEAK_RELATED_FIELD: 'WeakRelatedLookupField',
  // LIST_SERIALIZER: 'ListSerializer',
  // SERIALIZER: 'Serializer',

  // Чекбокс: v-else-if="item.el.input_type=='checkbox' || item.el.field_class=='BooleanField' || item.el.field_class=='NullBooleanField'"
  // Файл: v-else-if="item.el.input_type=='file'"
} as const;

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
  moduleId?: string;
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
        case BACKEND.field_class.MANY_RELATED_FIELD:
        // case BACKEND.field_class.WEAK_RELATED_FIELD:
          return FRONTEND.RELATED;
        case BACKEND.field_class.COMPUTED_FIELD:
          return FRONTEND.COMPUTED;
        case BACKEND.field_class.BOOLEAN_FIELD:
        case BACKEND.field_class.NULL_BOOLEAN_FIELD:
          return FRONTEND.BOOLEAN;
        default:
          return FRONTEND.CHAR;
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
        default:
          return FRONTEND.CHAR;
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
  

  static isCheckboxField(fieldDef: FieldDefinition): boolean {
    return (
      fieldDef.input_type === 'checkbox' ||
      fieldDef.field_class === 'BooleanField' ||
      fieldDef.field_class === 'NullBooleanField'
    );
  }

  static isFileField(fieldDef: FieldDefinition): boolean {
    return fieldDef.input_type === 'file';
  }


  static isNumberField(fieldDef: FieldDefinition): boolean {
    return (
      fieldDef.field_class === 'IntegerField' ||
      fieldDef.field_class === 'DecimalField' ||
      fieldDef.input_type === 'number'
    );
  }

  static isChoiceField(fieldDef: FieldDefinition): boolean {
    return (
      fieldDef.field_class === 'ChoiceField' ||
      fieldDef.class_name === FIELD_TYPES.LAYOUT_CHOICE_FIELD ||
      (fieldDef.choices && Array.isArray(fieldDef.choices) && fieldDef.choices.length > 0)
    );
  }

  static isRelatedField(fieldDef: FieldDefinition): boolean {
    return (
      fieldDef.field_class === 'PrimaryKeyRelatedLookupField' ||
      fieldDef.field_class === 'ManyRelatedField' ||
      fieldDef.field_class === 'WeakRelatedLookupField' ||
      fieldDef.class_name === FIELD_TYPES.LAYOUT_RELATED_FIELD
    );
  }

  static isDateTimeField(fieldDef: FieldDefinition): boolean {
    return (
      fieldDef.field_class === 'DateTimeField' ||
      fieldDef.field_class === 'DateField' ||
      fieldDef.field_class === 'TimeField' ||
      fieldDef.input_type === 'date' ||
      fieldDef.input_type === 'datetime' ||
      fieldDef.input_type === 'time'
    );
  }

  static isReadOnlyField(fieldDef: FieldDefinition): boolean {
    return fieldDef.read_only === true;
  }

  static isRequiredField(fieldDef: FieldDefinition): boolean {
    return fieldDef.required === true && fieldDef.allow_null !== true;
  }

  /**
   * Возвращает компонент для отображения поля в таблице
   * @param fieldDef Определение поля
   * @returns Имя компонента для отображения в таблице
   */
  static getTableCellComponent(fieldDef: FieldDefinition): string {
    if (this.isCheckboxField(fieldDef)) {
      return 'BooleanFieldCell';
    }

    if (this.isRelatedField(fieldDef)) {
      return 'RelatedFieldCell';
    }

    if (this.isChoiceField(fieldDef)) {
      return 'ChoiceFieldCell';
    }

    if (this.isDateTimeField(fieldDef)) {
      return 'DateTimeFieldCell';
    }

    const fieldType = this.getFieldType(fieldDef);

    switch (fieldType) {
      case FIELD_TYPES.LAYOUT_RICH_EDIT_FIELD:
        return 'RichEditCell';
      default:
        return 'DefaultFieldCell';
    }
  }

  /**
   * Возвращает компонент для редактирования поля в форме
   * @param fieldDef Определение поля
   * @returns Имя компонента для редактирования в форме
   */
  static getFormFieldComponent(fieldDef: FieldDefinition): string {
    if (this.isReadOnlyField(fieldDef)) {
      return 'ReadOnlyField';
    }

    if (this.isCheckboxField(fieldDef)) {
      return 'BooleanField';
    }

    if (this.isFileField(fieldDef)) {
      return 'FileField';
    }

    if (this.isRelatedField(fieldDef)) {
      return 'RelatedField';
    }

    if (this.isChoiceField(fieldDef)) {
      return 'ChoiceField';
    }

    const fieldType = this.getFieldType(fieldDef);

    switch (fieldType) {
      case FIELD_TYPES.LAYOUT_RICH_EDIT_FIELD:
        return 'RichEditField';
      case FIELD_TYPES.LAYOUT_INTEGER_FIELD:
      case FIELD_TYPES.LAYOUT_DECIMAL_FIELD:
        return 'NumberField';
      case FIELD_TYPES.DATE_TIME_FIELD:
        return 'DateTimeField';
      case FIELD_TYPES.DATE_FIELD:
        return 'DateField';
      case FIELD_TYPES.TIME_FIELD:
        return 'TimeField';
      default:
        return 'TextField';
    }
  }
}
