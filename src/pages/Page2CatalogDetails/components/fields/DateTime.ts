import { FieldDefinition, FormattingOptions } from '../../../../services/fieldTypeService';

// Константа для сообщения об ошибке
const INVALID_DATA_TYPE = 'Неверный тип данных';

/**
 * Проверяет, является ли значение датой или строкой, которую можно преобразовать в дату
 * @param value Проверяемое значение
 * @returns true, если значение можно преобразовать в дату
 */
function isDateFieldValue(value: any): value is Date | string {
  if (value instanceof Date) return true;
  if (typeof value !== 'string') return false;

  // Проверяем, можно ли строку преобразовать в дату
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Форматирует значение для отображения в таблице
 * @param value Исходное значение
 * @param options Опции форматирования
 * @returns Отформатированное значение
 */

export function formatDateValue(value: FieldDefinition, options: FormattingOptions = {}): string {
  if (!isDateFieldValue(value)) {
    console.error('Неправильный тип данных для formatDateValue:', value);
    return INVALID_DATA_TYPE;
  }

  const dateValue = value instanceof Date ? value : new Date(String(value));
  const locale = options.locale || 'ru-RU';
  return dateValue.toLocaleDateString(locale);
}

export function formatTimeValue(value: FieldDefinition, options: FormattingOptions = {}): string {
  if (!isDateFieldValue(value)) {
    console.error('Неправильный тип данных для formatTimeValue:', value);
    return INVALID_DATA_TYPE;
  }

  const dateValue = value instanceof Date ? value : new Date(String(value));
  const locale = options.locale || 'ru-RU';
  return dateValue.toLocaleTimeString(locale, { timeZone: 'UTC' });
}

export function formatDateTimeValue(value: FieldDefinition, options: FormattingOptions = {}): string {
  if (!isDateFieldValue(value)) {
    console.error('Неправильный тип данных для formatDateTimeValue:', value);
    return INVALID_DATA_TYPE;
  }

  const dateValue = value instanceof Date ? value : new Date(String(value));
  const locale = options.locale || 'ru-RU';
  return dateValue.toLocaleString(locale);
}