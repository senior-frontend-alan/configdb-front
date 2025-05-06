import { FieldDefinition, FormattingOptions } from '../../../../services/fieldTypeService';
/**
 * Форматирует значение для отображения в таблице
 * @param value Исходное значение
 * @param options Опции форматирования
 * @returns Отформатированное значение
 */

export function formatChoiceValue(
  value: FieldDefinition,
  choices?: Array<{ value: string | number; display_name: string }> | Record<string, string>,
  options: FormattingOptions = {},
): string {
  // Создаем карту выбора (аналогично choicesMap в AbstractField)
  if (Array.isArray(choices) && choices.length > 0) {
    const choicesMap: Record<string, string> = {};
    choices.reduce((obj, x) => {
      obj[String(x.value)] = x.display_name;
      return obj;
    }, choicesMap);

    // Ищем значение в карте выбора
    const valueStr = String(value);
    if (valueStr in choicesMap) {
      return choicesMap[valueStr];
    }
  }

  // Если choices - объект с ключами-значениями
  if (choices && typeof choices === 'object' && !Array.isArray(choices)) {
    const key = String(value);
    return key in choices ? choices[key] : String(value);
  }

  return String(value);
}