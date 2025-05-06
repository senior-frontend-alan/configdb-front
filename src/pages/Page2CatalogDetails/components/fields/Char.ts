import { FieldDefinition, FormattingOptions } from '../../../../services/fieldTypeService';
/**
 * Форматирует значение для отображения в таблице
 * @param value Исходное значение
 * @param options Опции форматирования
 * @returns Отформатированное значение
 */

export function formatChar(value: FieldDefinition, options: FormattingOptions = {}): string {
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