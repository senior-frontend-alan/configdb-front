// Константа для отображения ошибки неверного типа данных
export const INVALID_DATA_TYPE = 'Неверный тип данных';

// Обрабатывает различные типы входных данных:
// null или undefined → возвращает прочерк "—"
// Строки → пытается распарсить как JSON, если это массив
// Объекты → преобразует в JSON-строку
// Примитивы → преобразует в строку через String()
// Массивы → обрабатывает каждый элемент и соединяет через запятую
// Для массива объектов:
// Сначала пытается получить свойство name
// Если нет name, пытается получить id
// Если нет ни того, ни другого, берет первое свойство объекта
// В крайнем случае преобразует весь объект в JSON
// Имеет надежную обработку ошибок:
// Весь код обернут в блок try/catch
// Логирует ошибки в консоль для отладки
// Возвращает константу INVALID_DATA_TYPE при любой ошибке
/**
 * Форматирует значение поля типа many_related для отображения в таблице
 * @param value Значение поля (может быть любого типа)
 * @returns Отформатированная строка с именами объектов через запятую или сообщение об ошибке
 */
export function formatManyRelatedValue(value: any): string {
  try {
    // Проверка на null, undefined или пустой массив
    if (!value) {
      return '';
    }

    // Преобразование строки в массив (JSON)
    if (typeof value === 'string') {
      try {
        // Пробуем распарсить JSON
        const parsedValue = JSON.parse(value);
        if (Array.isArray(parsedValue)) {
          value = parsedValue;
        } else {
          // Если не массив, возвращаем строку как есть
          return value;
        }
      } catch {
        // Если не JSON, возвращаем строку как есть
        return value;
      }
    }

    // Проверка, является ли значение массивом
    if (!Array.isArray(value)) {
      // Если это объект, преобразуем его в строку
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      // Если это примитив, преобразуем в строку
      return String(value);
    }

    // Проверка на пустой массив
    if (value.length === 0) {
      return '';
    }

    // Обработка массива объектов или примитивов
    return value
      .map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          // Если это объект, пытаемся получить name или id
          if (item.hasOwnProperty('name')) {
            return item.name;
          } else if (item.hasOwnProperty('id')) {
            return String(item.id);
          } else {
            // Если нет ни name, ни id, преобразуем в JSON
            const keys = Object.keys(item);
            if (keys.length > 0) {
              return item[keys[0]];
            }
            return JSON.stringify(item);
          }
        }
        // Если это примитив, преобразуем в строку
        return String(item);
      })
      .join(', ');
  } catch (error) {
    console.error('Ошибка при обработке many_related данных:', error, value);
    return INVALID_DATA_TYPE;
  }
}
