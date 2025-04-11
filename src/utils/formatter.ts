/**
 * Форматтер полей для отображения данных в интерфейсе
 */

// Константы для типов полей = class_name или field_class
export const FIELD_TYPES = {
  // Типы полей на основе class_name
  LAYOUT_FIELD: 'LayoutField',
  LAYOUT_INTEGER_FIELD: 'LayoutIntegerField',
  LAYOUT_CHAR_FIELD: 'LayoutCharField',
  LAYOUT_RICH_EDIT_FIELD: 'LayoutRichEditField', // отобразить в таблице (CLOB отобразить первые несколько символов, отобразить и порезать, любые текстовые данные YAML, JSON, кусок кода, все что угодно) может посмотреть на ф js item repr
  LAYOUT_COMPUTED_FIELD: 'LayoutComputedField',
  LAYOUT_RELATED_FIELD: 'LayoutRelatedField',
  LAYOUT_CHOICE_FIELD: 'LayoutChoiceField',
  // LAYOUT_REVERSE_REFERENCE_FIELD: 'LayoutReverseReferenceField',
  // VIEW_SET_INLINE_LAYOUT: 'ViewSetInlineLayout',
  // VIEW_SET_INLINE_DYNAMIC_LAYOUT: 'ViewSetInlineDynamicLayout',

  // Типы полей на основе field_class (для обратной совместимости)
  INTEGER_FIELD: 'IntegerField',
  DECIMAL_FIELD: 'DecimalField',
  CHAR_FIELD: 'CharField',
  DATE_TIME_FIELD: 'DateTimeField',
  DATE_FIELD: 'DateField',
  TIME_FIELD: 'TimeField',
  CHOICE_FIELD: 'ChoiceField',
  PRIMARY_KEY_RELATED_FIELD: 'PrimaryKeyRelatedLookupField',
  // MANY_RELATED_FIELD: 'ManyRelatedField',
  // WEAK_RELATED_FIELD: 'WeakRelatedLookupField',
  // LIST_SERIALIZER: 'ListSerializer',
  // SERIALIZER: 'Serializer',
  COMPUTED_FIELD: 'ComputedField',
} as const;

export interface FormattingOptions {
  nullValue?: string;
  emptyArrayValue?: string;
  locale?: string;
  roundDecimals?: number;
  maximumLength?: number;
  richEditMaxLength?: number;
  maxInlineItems?: number;
  choices?: Array<{ value: string | number; display_name: string }>;
  jsItemRepr?: string; // Строка с JavaScript кодом для вычисляемых полей
}

export type FieldValue = string | number | boolean | Date | object | Array<any> | null | undefined;

// Форматирует значение по типу поля (class_name или field_class), в будущем будет использоваться только class_name
export function formatByClassName(
  className: string,
  value: FieldValue,
  options: FormattingOptions = {},
): string {
  // Если значение null или undefined, возвращаем пустую строку или указанное значение для null
  if (value === null || value === undefined || value === '') {
    return options.nullValue || '';
  }

  // Проверка на NaN для числовых значений
  if (typeof value === 'number' && isNaN(value)) {
    return 'NaN';
  }

  switch (className) {
    // Типы на основе class_name
    case FIELD_TYPES.LAYOUT_INTEGER_FIELD:
      return formatIntegerValue(value);

    case FIELD_TYPES.LAYOUT_CHAR_FIELD:
      return formatCharValue(value, options);

    case FIELD_TYPES.LAYOUT_RICH_EDIT_FIELD:
      return formatRichEditValue(value, options);

    case FIELD_TYPES.LAYOUT_RELATED_FIELD:
      return formatRelatedValue(value, options);

    case FIELD_TYPES.LAYOUT_CHOICE_FIELD:
      return formatChoiceValue(value, undefined, options);

    case FIELD_TYPES.LAYOUT_COMPUTED_FIELD:
      return formatComputedValue(value, options);

    // case FIELD_TYPES.VIEW_SET_INLINE_LAYOUT:
    // case FIELD_TYPES.VIEW_SET_INLINE_DYNAMIC_LAYOUT:
    //   return formatInlineValue(value, options);

    // ! Типы на основе field_class (для обратной совместимости)
    // ! УДАЛИТЬ в будущем и оставить только class_name
    case FIELD_TYPES.INTEGER_FIELD:
      return formatIntegerValue(value);

    case FIELD_TYPES.DECIMAL_FIELD:
      return formatDecimalValue(value, options);

    case FIELD_TYPES.CHAR_FIELD:
      return formatCharValue(value, options);

    case FIELD_TYPES.CHOICE_FIELD:
      return formatChoiceValue(value, undefined, options);

    case FIELD_TYPES.DATE_FIELD:
      return formatDateValue(value, options);

    case FIELD_TYPES.TIME_FIELD:
      return formatTimeValue(value, options);

    case FIELD_TYPES.DATE_TIME_FIELD:
      return formatDateTimeValue(value, options);

    case FIELD_TYPES.PRIMARY_KEY_RELATED_FIELD:
      // case FIELD_TYPES.MANY_RELATED_FIELD:
      return formatRelatedValue(value, options);

    // case FIELD_TYPES.WEAK_RELATED_FIELD:
    //   return formatRelatedValue(value, options);

    // case FIELD_TYPES.LIST_SERIALIZER:
    // case FIELD_TYPES.SERIALIZER:
    //   return formatInlineValue(value, options);

    case FIELD_TYPES.COMPUTED_FIELD:
      return formatComputedValue(value, options);

    // По умолчанию просто преобразуем в строку
    default:
      return String(value);
  }
}

function formatIntegerValue(value: FieldValue): string {
  if (value instanceof Object && !Array.isArray(value)) {
    throw Error('Imporperly configured');
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  // Преобразование в целое число и округление
  const numValue = typeof value !== 'number' ? parseInt(String(value), 10) : value;
  return String(Number.isInteger(numValue) ? numValue : Math.round(numValue));
}

export function formatDecimalValue(value: FieldValue, options: FormattingOptions = {}): string {
  if (value instanceof Object && !Array.isArray(value)) {
    throw Error('Imporperly configured');
  }

  // Преобразование в число
  const numValue = typeof value !== 'number' ? parseFloat(String(value)) : value;
  const decimals = options.roundDecimals !== undefined ? options.roundDecimals : 2;

  // Использование toFixed для форматирования с указанным количеством десятичных знаков
  return numValue.toFixed(decimals);
}

export function formatCharValue(value: FieldValue, options: FormattingOptions = {}): string {
  // Обработка специальных случаев (массивы, объекты)
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  const strValue = String(value);

  if (options.maximumLength && strValue.length > options.maximumLength) {
    return strValue.substring(0, options.maximumLength) + '...';
  }

  // Возвращаем строковое представление (аналогично CharField._asString)
  return strValue;
}

// форматирует только дату (без времени) "10.04.2025"
export function formatDateValue(value: FieldValue, options: FormattingOptions = {}): string {
  let dateValue: Date;
  try {
    dateValue = value instanceof Date ? value : new Date(String(value));
  } catch (e) {
    throw Error('Imporperly configured');
  }

  // Проверяем валидность даты
  if (isNaN(dateValue.getTime())) {
    throw Error('Imporperly configured');
  }

  const locale = options.locale || 'ru-RU';

  return dateValue.toLocaleDateString(locale);
}

// форматирует только время (без даты) "15:19:37"
export function formatTimeValue(value: FieldValue, options: FormattingOptions = {}): string {
  let dateValue: Date;
  try {
    dateValue = value instanceof Date ? value : new Date(String(value));
  } catch (e) {
    throw Error('Imporperly configured');
  }

  // Проверяем валидность даты
  if (isNaN(dateValue.getTime())) {
    throw Error('Imporperly configured');
  }

  const locale = options.locale || 'ru-RU';

  return dateValue.toLocaleTimeString(locale, { timeZone: 'UTC' });
}

// форматирует дату и время "10.04.2025, 15:19:37"
export function formatDateTimeValue(value: FieldValue, options: FormattingOptions = {}): string {
  let dateValue: Date;
  try {
    dateValue = value instanceof Date ? value : new Date(String(value));
  } catch (e) {
    throw Error('Imporperly configured');
  }

  // Проверяем валидность даты
  if (isNaN(dateValue.getTime())) {
    throw Error('Imporperly configured');
  }

  const locale = options.locale || 'ru-RU';

  return dateValue.toLocaleString(locale);
}

/**
 * Форматирует значение с расширенным редактированием (CLOB, YAML, JSON, код)
 * Использует тип LayoutRichEditField из catalogDetailsAPIResponseOPTIONS.type.ts
 */
export function formatRichEditValue(value: FieldValue, options: FormattingOptions = {}): string {
  // Для rich edit полей обычно показываем только начало текста
  const maxLength = options.richEditMaxLength || 50;
  const strValue = String(value);

  if (strValue.length > maxLength) {
    return strValue.substring(0, maxLength) + '...';
  }

  return strValue;
}

// Отображает связанный объект из другой таблицы/модели.
export function formatRelatedValue(value: FieldValue, options: FormattingOptions = {}): string {
  // Обработка объектов
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // Обработка объектов с полем value и наличием choices
    if ('value' in value && value.value !== undefined && options.choices?.length) {
      const valueStr = String(value.value);
      const choice = options.choices.find((c) => String(c.value) === valueStr);
      if (choice) return String(choice.display_name);
    }

    // Приоритет полей для отображения
    if (
      'display_name' in value &&
      value.display_name !== undefined &&
      value.display_name !== null
    ) {
      return String(value.display_name);
    }

    if ('name' in value && value.name !== undefined && value.name !== null) {
      return String(value.name);
    }

    if ('id' in value && value.id !== undefined && value.id !== null) {
      return `<id: ${value.id}>`;
    }
  }

  // Обработка массивов
  if (Array.isArray(value)) {
    return value.length === 0
      ? options.emptyArrayValue || '[]'
      : value.map((item) => formatRelatedValue(item, options)).join(', ');
  }

  // Примитивные значения (ID)
  return `<id: ${value}>`;
}

export function formatChoiceValue(
  value: FieldValue,
  choices?: Array<{ value: string | number; display_name: string }> | Record<string, string>,
  options: FormattingOptions = {},
): string {
  // Создаем карту выбора (аналогично choicesMap в AbstractField)
  if (Array.isArray(choices) && choices.length > 0) {
    const choicesMap: Record<string, string> = {};
    choices.reduce((obj, x) => {
      obj[String(x.value)] = x.display_name;
      return obj;
    }, choicesMap);

    // Ищем значение в карте выбора
    const valueStr = String(value);
    if (valueStr in choicesMap) {
      return choicesMap[valueStr];
    }
  }

  // Если choices - объект с ключами-значениями
  if (choices && typeof choices === 'object' && !Array.isArray(choices)) {
    const key = String(value);
    return key in choices ? choices[key] : String(value);
  }

  return String(value);
}

export function formatComputedValue(value: FieldValue, options: FormattingOptions = {}): string {
  // Для вычисляемых полей используем js_item_repr, если оно есть
  if (options.jsItemRepr) {
    try {
      // Создаем функцию из строки js_item_repr
      const innerFn = new Function('value', 'options', options.jsItemRepr);

      // Вызываем функцию с переданными параметрами
      const result = innerFn(value, options);

      // Возвращаем результат как строку
      return result !== null && result !== undefined ? String(result) : '';
    } catch (e: any) {
      console.error(`formatComputedValue: jsItemRepr="${options.jsItemRepr}" error: ${e}`);
      return `<Ошибка вычисления: ${e.message}>`;
    }
  }

  // Если нет js_item_repr, просто преобразуем значение в строку
  return value !== null && value !== undefined ? String(value) : '';
}

// НЕ удалять пока
// export function formatInlineValue(value: FieldValue, options: FormattingOptions = {}): string {
//   // Если value - массив, форматируем как список
//   if (Array.isArray(value)) {
//     if (value.length === 0) {
//       return options.emptyArrayValue || '[]';
//     }

//     // Ограничиваем количество отображаемых элементов
//     const maxItems = options.maxInlineItems || 3;
//     const items = value.slice(0, maxItems).map(item => {
//       if (typeof item === 'object' && item !== null) {
//         if ('name' in item && item.name) return String(item.name);
//         if ('__str__' in item && item.__str__) return String(item.__str__);
//         return JSON.stringify(item);
//       }
//       return String(item);
//     });

//     // Если есть еще элементы, добавляем "и еще N"
//     if (value.length > maxItems) {
//       return `${items.join(', ')} и еще ${value.length - maxItems}`;
//     }

//     return items.join(', ');
//   }

//   // Если value - объект
//   if (typeof value === 'object' && value !== null) {
//     if ('name' in value && value.name) return String(value.name);
//     if ('__str__' in value && value.__str__) return String(value.__str__);
//     return JSON.stringify(value);
//   }

//   return String(value);
// }
