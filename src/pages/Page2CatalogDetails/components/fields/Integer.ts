import { FieldDefinition, FormattingOptions } from '../../../../services/fieldTypeService';

/**
 * Форматирует значение целочисленного поля
 * @param value Значение для форматирования
 * @param options Опции форматирования
 * @returns Отформатированная строка или сообщение об ошибке
 */
export function formatInteger(value: FieldDefinition, options: FormattingOptions = {}): string {
  try {
    // Проверяем типы от самых ожидаемых

    // 1. Числа - самый ожидаемый тип
    if (typeof value === 'number') {
      return String(Number.isInteger(value) ? value : Math.round(value));
    }

    // 2. Строки, которые можно преобразовать в числа
    if (typeof value === 'string') {
      if (/^-?\d+$/.test(value)) {
        const numValue = parseInt(value, 10);
        return String(numValue);
      }
      // Если строка не преобразуется в число
      console.error('Неправильный тип данных для formatIntegerValue:', value);
      return `Неверный тип: "${value}"`;
    }

    // 3. Булевы значения
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }

    // 4. null или undefined
    if (value === null || value === undefined) {
      return '';
    }

    // 5. Объекты и другие типы
    const valueAsString = typeof value === 'object' ? JSON.stringify(value) : String(value);
    console.error('Неправильный тип данных для formatIntegerValue:', value);
    return `Неверный тип: ${valueAsString}`;
  } catch (error) {
    // В случае любой ошибки
    console.error('Ошибка при форматировании целочисленного значения:', error, value);
    return `Неверный тип: невозможно преобразовать`;
  }
}
