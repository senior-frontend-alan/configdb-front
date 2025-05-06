import { FieldDefinition, FormattingOptions } from '../../../../services/fieldTypeService';

// Константа для сообщения об ошибке
export const INVALID_DATA_TYPE = 'Неверный тип данных';

/**
 * Форматирует десятичное значение для отображения в таблице
 * @param value Исходное значение
 * @param options Опции форматирования
 * @returns Отформатированное значение
 */
export function formatDecimal(value: FieldDefinition, options: FormattingOptions = {}): string {
  // Обработка специальных случаев
  if (value === null || value === undefined) {
    return options.nullValue || '';
  }
  
  if (Array.isArray(value)) {
    console.error('Неправильный тип данных для formatDecimal (массив):', value);
    return INVALID_DATA_TYPE;
  }
  
  if (typeof value === 'object') {
    console.error('Неправильный тип данных для formatDecimal (объект):', value);
    return INVALID_DATA_TYPE;
  }
  
  // Преобразование в число
  let numValue: number;
  try {
    numValue = typeof value !== 'number' ? parseFloat(String(value)) : value;
    if (isNaN(numValue)) {
      throw new Error('Не удалось преобразовать в число');
    }
  } catch (e) {
    console.error('Ошибка преобразования в число:', e);
    return INVALID_DATA_TYPE;
  }
  
  // Использование toFixed для форматирования с указанным количеством десятичных знаков
  const decimals = options.roundDecimals !== undefined ? options.roundDecimals : 2;
  return numValue.toFixed(decimals);
}