import { FieldDefinition } from '../../../../services/fieldTypeService';

/**
 * Форматирует значение текстового поля для отображения
 * @param value - значение поля
 * @returns отформатированная строка
 */
export function formatChar(value: FieldDefinition): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Преобразуем в строку и обрезаем лишние пробелы
  const stringValue = String(value).trim();
  
  return stringValue;
}
