import { FieldDefinition, FormattingOptions } from '../../../../services/fieldTypeService';

// Переработаны все три функции форматирования:
// formatDateValue - для форматирования только даты
// formatTimeValue - для форматирования только времени
// formatDateTimeValue - для форматирования даты и времени вместе
// Каждая функция теперь:
// Проверяет типы от самых ожидаемых к наименее ожидаемым
// Обрабатывает экземпляры Date, строки, числа (timestamp), null/undefined и объекты
// Возвращает пустую строку для null/undefined
// Возвращает сообщение об ошибке в формате "Неверный тип: {значение}" для некорректных типов
// Имеет защиту от ошибок с помощью блока try/catch

/**
 * Форматирует значение для отображения в таблице
 * @param value Исходное значение любого типа
 * @param options Опции форматирования
 * @returns Отформатированное значение или сообщение об ошибке
 */
export function formatDateValue(value: FieldDefinition, options: FormattingOptions = {}): string {
  try {
    // Проверяем типы от самых ожидаемых
    const locale = options.locale || 'ru-RU';

    // 1. Проверяем экземпляры Date
    if (value instanceof Date) {
      return value.toLocaleDateString(locale);
    }

    // 2. Проверяем строки, которые можно преобразовать в дату
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString(locale);
      }
      console.error('Неправильный формат строки для даты:', value);
      return `Неверный тип: "${value}"`;
    }

    // 3. Проверяем числа (timestamp)
    if (typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString(locale);
      }
      console.error('Неправильный timestamp для даты:', value);
      return `Неверный тип: ${value}`;
    }

    // 4. null или undefined
    if (value === null || value === undefined) {
      return '';
    }

    // 5. Объекты и другие типы
    const valueAsString = typeof value === 'object' ? JSON.stringify(value) : String(value);
    console.error('Неправильный тип данных для formatDateValue:', value);
    return `Неверный тип: ${valueAsString}`;
  } catch (error) {
    console.error('Ошибка при форматировании даты:', error, value);
    return `Неверный тип: невозможно преобразовать`;
  }
}

/**
 * Форматирует время для отображения в таблице
 * @param value Исходное значение любого типа
 * @param options Опции форматирования
 * @returns Отформатированное значение или сообщение об ошибке
 */
export function formatTimeValue(value: FieldDefinition, options: FormattingOptions = {}): string {
  try {
    // Проверяем типы от самых ожидаемых
    const locale = options.locale || 'ru-RU';
    const timeOptions = { timeZone: 'UTC' };

    // 1. Проверяем экземпляры Date
    if (value instanceof Date) {
      return value.toLocaleTimeString(locale, timeOptions);
    }

    // 2. Проверяем строки, которые можно преобразовать в дату
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString(locale, timeOptions);
      }
      console.error('Неправильный формат строки для времени:', value);
      return `Неверный тип: "${value}"`;
    }

    // 3. Проверяем числа (timestamp)
    if (typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString(locale, timeOptions);
      }
      console.error('Неправильный timestamp для времени:', value);
      return `Неверный тип: ${value}`;
    }

    // 4. null или undefined
    if (value === null || value === undefined) {
      return '';
    }

    // 5. Объекты и другие типы
    const valueAsString = typeof value === 'object' ? JSON.stringify(value) : String(value);
    console.error('Неправильный тип данных для formatTimeValue:', value);
    return `Неверный тип: ${valueAsString}`;
  } catch (error) {
    console.error('Ошибка при форматировании времени:', error, value);
    return `Неверный тип: невозможно преобразовать`;
  }
}

/**
 * Форматирует дату и время для отображения в таблице
 * @param value Исходное значение любого типа
 * @param options Опции форматирования
 * @returns Отформатированное значение или сообщение об ошибке
 */
export function formatDateTimeValue(
  value: FieldDefinition,
  options: FormattingOptions = {},
): string {
  try {
    // Проверяем типы от самых ожидаемых
    const locale = options.locale || 'ru-RU';

    // 1. Проверяем экземпляры Date
    if (value instanceof Date) {
      return value.toLocaleString(locale);
    }

    // 2. Проверяем строки, которые можно преобразовать в дату
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString(locale);
      }
      console.error('Неправильный формат строки для даты и времени:', value);
      return `Неверный тип: "${value}"`;
    }

    // 3. Проверяем числа (timestamp)
    if (typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString(locale);
      }
      console.error('Неправильный timestamp для даты и времени:', value);
      return `Неверный тип: ${value}`;
    }

    // 4. null или undefined
    if (value === null || value === undefined) {
      return '';
    }

    // 5. Объекты и другие типы
    const valueAsString = typeof value === 'object' ? JSON.stringify(value) : String(value);
    console.error('Неправильный тип данных для formatDateTimeValue:', value);
    return `Неверный тип: ${valueAsString}`;
  } catch (error) {
    console.error('Ошибка при форматировании даты и времени:', error, value);
    return `Неверный тип: невозможно преобразовать`;
  }
}
