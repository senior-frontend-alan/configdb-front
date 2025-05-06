import { FieldDefinition, FormattingOptions } from '../../../../services/fieldTypeService';
// Константа для сообщения об ошибке
const INVALID_DATA_TYPE = 'Неверный тип данных';

// Проверка на целочисленное значение
function isIntegerFieldValue(value: FieldDefinition): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return true;
  if (typeof value === 'number') return true;
  if (typeof value === 'string') {
    // Проверяем, что строка может быть преобразована в целое число
    return /^-?\d+$/.test(value);
  }
  return false;
}

export function formatInteger(value: FieldDefinition, options: FormattingOptions = {}): string {
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
  