/**
 * Форматтер полей для отображения данных в интерфейсе
 */

import { useModuleStore } from '../stores/module-factory';

// Константа для сообщения об ошибке
export const INVALID_DATA_TYPE = 'Неверный тип данных';

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

  // ! не проваливаемся внутрь на этапе показа колонок таблицы
  // VIEW_SET_INLINE_LAYOUT: 'ViewSetInlineLayout', // подчиненная вложенная таблица/объект
  // VIEW_SET_INLINE_DYNAMIC_LAYOUT: 'ViewSetInlineDynamicLayout', // подчиненная вложенная таблица/объект
  // VIEW_SET_INLINE_DYNAMIC_MODEL_LAYOUT: 'ViewSetInlineDynamicModelLayout', // подчиненная вложенная таблица/объект
  // или field_class: "ListSerializer"

  // на этапе добавления записи скрываются read_only поля

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

  // Чекбокс: v-else-if="item.el.input_type=='checkbox' || item.el.field_class=='BooleanField' || item.el.field_class=='NullBooleanField'"
  // Файл: v-else-if="item.el.input_type=='file'"
  COMPUTED_FIELD: 'ComputedField',
} as const;

// Типы данных для форматирования
export type FieldValue = any;
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

// Определяем типы для разных полей
type IntegerFieldValue = number | string | boolean;
type DecimalFieldValue = number | string;
type CharFieldValue = any; // Может быть любым типом, т.к. всегда преобразуется в строку
type DateValue = Date | string; // Общий тип для всех полей с датами
type ComputedFieldValue = any;

// Определяет тип содержимого (JSON, YAML, HTML, CSS, SQL)
export type ContentTypeResult = {
  label: string;
  value: FieldValue;
  formattedValue: string; // Отформатированное значение для отображения
};

/**
 * Определяет тип содержимого (JSON, YAML, HTML, CSS, SQL)
 * @param value Значение для определения типа
 * @returns Объект с меткой типа содержимого, исходным значением и отформатированным значением
 */
export function detectContentType(value: FieldValue): ContentTypeResult {
  // Для массивов показываем количество элементов
  if (Array.isArray(value)) {
    return {
      label: `Array(${value.length})`,
      value,
      formattedValue: JSON.stringify(value, null, 2),
    };
  }

  // Для объектов проверяем, можно ли их сериализовать в JSON
  if (typeof value === 'object' && value !== null) {
    try {
      const formatted = JSON.stringify(value, null, 2);
      return {
        label: 'JSON',
        value,
        formattedValue: formatted,
      };
    } catch (e) {
      // Если не удалось сериализовать, это не JSON
      return {
        label: 'Object',
        value,
        formattedValue: String(value),
      };
    }
  }

  // Для других типов данных
  if (typeof value !== 'string') {
    return {
      label: typeof value,
      value,
      formattedValue: String(value),
    };
  }

  // Проверяем на JSON строки
  if (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']'))
  ) {
    try {
      JSON.parse(value);
      return {
        label: 'JSON',
        value,
        formattedValue: JSON.stringify(JSON.parse(value), null, 2),
      };
    } catch (e) {
      // Если не удалось распарсить, это не JSON
    }
  }

  // Проверяем на HTML
  if (
    value.includes('<html') ||
    value.includes('<!DOCTYPE html') ||
    (value.includes('<') && value.includes('</') && value.includes('>'))
  ) {
    return {
      label: 'HTML',
      value,
      formattedValue: value,
    };
  }

  // Проверяем на YAML
  if (
    value.includes(':') &&
    value.includes('\n') &&
    !value.includes('{') &&
    !value.includes('[') &&
    (value.includes('  ') || value.includes('- '))
  ) {
    return {
      label: 'YAML',
      value,
      formattedValue: value,
    };
  }

  // Проверяем на CSS
  if (value.includes('{') && value.includes('}') && value.includes(':') && value.includes(';')) {
    return {
      label: 'CSS',
      value,
      formattedValue: value,
    };
  }

  // Проверяем на SQL
  if (
    (value.toUpperCase().includes('SELECT') && value.toUpperCase().includes('FROM')) ||
    value.toUpperCase().includes('INSERT INTO') ||
    (value.toUpperCase().includes('UPDATE') && value.toUpperCase().includes('SET'))
  ) {
    return {
      label: 'SQL',
      value,
      formattedValue: value,
    };
  }

  return {
    label: 'String',
    value,
    formattedValue: value,
  };
}

// Type guards для проверки типов
function isIntegerFieldValue(value: FieldValue): value is IntegerFieldValue {
  return !(value instanceof Object) || Array.isArray(value);
}

function isDecimalFieldValue(value: FieldValue): value is DecimalFieldValue {
  return !(value instanceof Object) || Array.isArray(value);
}

function isDateFieldValue(value: FieldValue): value is DateValue {
  if (value instanceof Date) return true;
  if (typeof value !== 'string') return false;

  try {
    const date = new Date(value);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

// Форматирует значение по типу поля (class_name или field_class), в будущем будет использоваться только class_name
export function formatByClassName(
  className: string,
  value: FieldValue,
  options: FormattingOptions = {},
): string | ContentTypeResult {
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
      return formatRichEditValue(value);

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
  if (!isIntegerFieldValue(value)) {
    console.error('Неправильный тип данных для formatIntegerValue:', value);
    return INVALID_DATA_TYPE;
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  // Преобразование в целое число и округление
  const numValue = typeof value !== 'number' ? parseInt(String(value), 10) : value;
  return String(Number.isInteger(numValue) ? numValue : Math.round(numValue));
}

export function formatDecimalValue(value: FieldValue, options: FormattingOptions = {}): string {
  if (!isDecimalFieldValue(value)) {
    console.error('Неправильный тип данных для formatDecimalValue:', value);
    return INVALID_DATA_TYPE;
  }

  // Преобразование в число
  const numValue = typeof value !== 'number' ? parseFloat(String(value)) : value;
  const decimals = options.roundDecimals !== undefined ? options.roundDecimals : 2;

  // Использование toFixed для форматирования с указанным количеством десятичных знаков
  return numValue.toFixed(decimals);
}

export function formatCharValue(value: FieldValue, options: FormattingOptions = {}): string {
  // Для CharField принимаем любой тип и преобразуем в строку
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

  // Возвращаем строку (аналогично CharField._asString)
  return strValue;
}

/**
 * Форматирует значение с расширенным редактированием (CLOB, YAML, JSON, код)
 * Использует тип LayoutRichEditField из catalogDetailsAPIResponseOPTIONS.type.ts
 */
export function formatRichEditValue(value: FieldValue): ContentTypeResult {
  // Определяем тип содержимого и возвращаем результат
  return detectContentType(value);
}

// Отображает связанный объект из другой таблицы/модели.
export function formatRelatedValue(value: FieldValue, options: FormattingOptions = {}): string {
  // Обработка массивов только если multiple = true
  if (Array.isArray(value)) {
    const isMultiple = options.multiple === true;

    if (isMultiple) {
      return value.length === 0
        ? options.emptyArrayValue || '[]'
        : value.map(formatSingleRelatedValue).join(', ');
    } else {
      // Если multiple = false, но пришел массив
      return INVALID_DATA_TYPE;
    }
  }

  return formatSingleRelatedValue(value);
}

function formatSingleRelatedValue(value: FieldValue): string {
  if (typeof value === 'object' && !Array.isArray(value)) {
    if ('name' in value && value.name !== undefined && value.name !== null) {
      return String(value.name);
    }

    // Если есть только id, форматируем как <id: значение>
    if ('id' in value && value.id !== undefined && value.id !== null) {
      return `<id: ${value.id}>`;
    }
  }

  // Примитивные значения (число или строка) форматируем как <id: значение>
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
  try {
    // Проверяем, есть ли jsItemRepr в опциях
    if (options.jsItemRepr) {
      // Если указан moduleId, пытаемся получить JS-функции модуля
      if (options.moduleId && typeof options.moduleId === 'string') {
        // Получаем стор модуля напрямую
        const moduleStore = useModuleStore(options.moduleId);

        // Получаем доступ к JS-функциям модуля
        const jsi = moduleStore.getJSIFunctions();

        try {
          // Выполняем JS-код с доступом к функциям модуля через jsi
          const fn = new Function('value', 'jsi', 'obj', options.jsItemRepr);
          const result = fn(value, jsi, value);
          return result !== null && result !== undefined ? String(result) : '';
        } catch (innerError: any) {
          console.error(`Ошибка выполнения jsItemRepr:`, innerError);
          return `<Ошибка: ${innerError.message}>`;
        }
      } else {
        // Если moduleId не указан, выполняем jsItemRepr без доступа к функциям модуля
        try {
          const innerFn = new Function('value', 'obj', options.jsItemRepr);
          const result = innerFn(value, value);
          return result !== null && result !== undefined ? String(result) : '';
        } catch (innerError: any) {
          console.error(`Ошибка выполнения jsItemRepr без модуля:`, innerError);
          return `<Ошибка: ${innerError.message}>`;
        }
      }
    }

    // Если нет ни moduleId, ни jsItemRepr, просто преобразуем значение в строку
    return value !== null && value !== undefined ? String(value) : '';
  } catch (e: any) {
    console.error(`Ошибка в formatComputedValue:`, e);
    return `<Ошибка: ${e.message}>`;
  }
}

export function formatDateValue(value: FieldValue, options: FormattingOptions = {}): string {
  if (!isDateFieldValue(value)) {
    console.error('Неправильный тип данных для formatDateValue:', value);
    return INVALID_DATA_TYPE;
  }

  const dateValue = value instanceof Date ? value : new Date(String(value));
  const locale = options.locale || 'ru-RU';
  return dateValue.toLocaleDateString(locale);
}

export function formatTimeValue(value: FieldValue, options: FormattingOptions = {}): string {
  if (!isDateFieldValue(value)) {
    console.error('Неправильный тип данных для formatTimeValue:', value);
    return INVALID_DATA_TYPE;
  }

  const dateValue = value instanceof Date ? value : new Date(String(value));
  const locale = options.locale || 'ru-RU';
  return dateValue.toLocaleTimeString(locale, { timeZone: 'UTC' });
}

export function formatDateTimeValue(value: FieldValue, options: FormattingOptions = {}): string {
  if (!isDateFieldValue(value)) {
    console.error('Неправильный тип данных для formatDateTimeValue:', value);
    return INVALID_DATA_TYPE;
  }

  const dateValue = value instanceof Date ? value : new Date(String(value));
  const locale = options.locale || 'ru-RU';
  return dateValue.toLocaleString(locale);
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
