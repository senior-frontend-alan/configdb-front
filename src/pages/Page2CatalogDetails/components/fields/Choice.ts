import { FormattingOptions } from '../../../../services/fieldTypeService';

// Choice — для статических, предопределенных списков с небольшим количеством значений
// единицы, десякти записей, без дополнительных атрибутов (захардкоженный небольшой Enum)
// только { value, name }
// На вход value передается значение поля выбора (например, 1, 2, 3...),
// а fieldMetadata - метаданные поля, которые содержат информацию о поле выбора,
// включая список возможных значений (CHOICES).
// Пример объекта метаданных поля выбора (LayoutChoiceField):
// {
//   "class_name": "LayoutChoiceField",
//   "element_id": "characteristicspec/value_imtype",
//   "name": "value_imtype",
//   "label": "Value type",
//   "help_text": "A kind of value that the characteristic can take on...",
//   "field_class": "ChoiceField",
//   "default": 2,
//   "input_type": "text",
//   "filterable": true,
//   "choices": [
//     {"value": 1, "display_name": "Number"},
//     {"value": 2, "display_name": "String"},
//     {"value": 3, "display_name": "Boolean"},
//     ...
//   ],
//   "FRONTEND_CLASS": "Choice",
//   "visible": true
// }

interface ChoiceField {
  class_name?: string;
  element_id?: string;
  name?: string;
  label?: string;
  help_text?: string;
  field_class?: string;
  default?: any;
  input_type?: string;
  filterable?: boolean;
  FRONTEND_CLASS?: string;
  VISIBLE?: boolean;
  choices?: Array<{ value: string | number; display_name: string }> | Record<string, string>;
  // Map-структура для быстрого доступа к значениям выбора
  CHOICES?: Map<string, string>;
  [key: string]: any; // Для поддержки других свойств
}

export function formatChoiceValue(
  value: string | number | boolean | null | undefined,
  fieldMetadata: ChoiceField,
  options: FormattingOptions = {},
): string {
  // Используем готовую Map-структуру CHOICES, которую мы создали в сторе на момент получения OPTIONS
  if (fieldMetadata && fieldMetadata.CHOICES && fieldMetadata.CHOICES instanceof Map) {
    const valueStr = String(value);
    if (fieldMetadata.CHOICES.has(valueStr)) {
      return fieldMetadata.CHOICES.get(valueStr) || String(value);
    }
  }

  return String(value);
}