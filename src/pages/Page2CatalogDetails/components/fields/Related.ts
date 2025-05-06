import { FieldDefinition, FormattingOptions } from '../../../../services/fieldTypeService';
/**
 * Форматирует значение для отображения в таблице
 * @param value Исходное значение
 * @param options Опции форматирования
 * @returns Отформатированное значение
 */

const INVALID_DATA_TYPE = 'Неверный тип данных';

// Отображает связанный объект из другой таблицы/модели.
export function formatRelatedValue(value: FieldDefinition, options: FormattingOptions = {}): string {
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

function formatSingleRelatedValue(value: FieldDefinition): string {
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