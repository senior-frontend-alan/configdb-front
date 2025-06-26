// import { FieldDefinition } from '../../../../services/fieldTypeService';

// Тип форматирования для универсальной функции
export type FormatType = 'date' | 'time' | 'datetime';

// Универсальная функция форматирования:
// - Принимает тип форматирования (date, time, datetime)
// - Проверяет типы от самых ожидаемых к наименее ожидаемым
// - Обрабатывает экземпляры Date, строки, числа (timestamp), null/undefined и объекты
// - Возвращает пустую строку для null/undefined
// - Возвращает сообщение об ошибке в формате "Неверный тип: {значение}" для некорректных типов
// - Имеет защиту от ошибок с помощью блока try/catch

/**
 * Универсальная функция форматирования даты и времени
 * @param value Исходное значение любого типа
 * @param locale Локаль в формате 'ru-RU'
 * @param formatType Тип форматирования: 'date', 'time' или 'datetime'
 * @returns Отформатированное значение или сообщение об ошибке
 */
export function formatDateTime(
  value: any,
  locale: string = 'ru-RU',
  formatType: FormatType = 'date',
): string {
  try {
    // Проверяем типы от самых ожидаемых

    // Настройки форматирования в зависимости от типа
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'UTC',
    };

    // Добавляем нужные опции в зависимости от типа форматирования
    if (formatType === 'date' || formatType === 'datetime') {
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
    }

    if (formatType === 'time' || formatType === 'datetime') {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      options.hour12 = false; // 24-часовой формат
    }

    // Создаем форматтер с нужными опциями
    const formatter = new Intl.DateTimeFormat(locale, options);

    // 1. Проверяем экземпляры Date
    if (value instanceof Date) {
      return formatter.format(value);
    }

    // 2. Проверяем строки, которые можно преобразовать в дату
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return formatter.format(date);
      }
      console.error(`Неправильный формат строки для ${formatType}:`, value);
      return `Неверный тип: "${value}"`;
    }

    // 3. Проверяем числа (timestamp)
    if (typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return formatter.format(date);
      }
      console.error(`Неправильный timestamp для ${formatType}:`, value);
      return `Неверный тип: ${value}`;
    }

    // 4. null или undefined
    if (value === null || value === undefined) {
      return '';
    }

    // 5. Объекты и другие типы
    const valueAsString = typeof value === 'object' ? JSON.stringify(value) : String(value);
    console.error(`Неправильный тип данных для ${formatType}:`, value);
    return `Неверный тип: ${valueAsString}`;
  } catch (error) {
    console.error(`Ошибка при форматировании ${formatType}:`, error, value);
    return `Неверный тип: невозможно преобразовать`;
  }
}

/**
 * Форматирует дату для отображения в таблице
 * @param value Исходное значение любого типа
 * @param locale Локаль в формате 'ru-RU'
 * @returns Отформатированное значение или сообщение об ошибке
 */
export function formatDate(value: FieldDefinition, locale: string = 'ru-RU'): string {
  return formatDateTime(value, locale, 'date');
}

/**
 * Форматирует время для отображения в таблице
 * @param value Исходное значение любого типа
 * @param locale Локаль в формате 'ru-RU'
 * @returns Отформатированное значение или сообщение об ошибке
 */
export function formatTime(value: FieldDefinition, locale: string = 'ru-RU'): string {
  return formatDateTime(value, locale, 'time');
}
