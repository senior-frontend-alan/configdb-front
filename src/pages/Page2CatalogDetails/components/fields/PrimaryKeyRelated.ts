import { FormattingOptions } from '../../../../services/fieldTypeService';
const INVALID_DATA_TYPE = 'Неверный тип данных';

// PrimaryKeyRelatedValue — динамических данных из других таблиц, где количество записей может быть очень большим
// т.е. если записей мало то можем передать их в OPTIONS и отобразить в Choice
// а если записей много то уже передаем их в GET
// RelatedObj = {id: 1, name: "Object Name-1"}; // всегда такой формы строгой формы и отобразим name
// RelatedObjIncorrect = {id: 1}; // (красным) "<id: 1>"
// RelatedIncorrect = 1 // придет 1 или строка "123" Отобразить как внутренний идентификатор (красным) "<id: 1>"
// !!! ВНИМАНИЕ !!!
// ManyRelatedObj = [{id: 1, name: "Object Name-1"}, {id: 2, name: "Object Name-2"}]; // смотреть всегда на ?mode=short отобразить чипсами (заранее из OPTIONS НЕ знаем! поэтому name приходит тут)

export function formatPrimaryKeyRelatedValue(value: any, options: FormattingOptions = {}): string {
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

function formatSingleRelatedValue(value: any): string {
  // Добавляем проверку на null и undefined перед использованием оператора 'in'
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    // Проверяем наличие свойства name и что оно не null
    if ('name' in value && value.name !== null) {
      return String(value.name);
    }

    // Если есть только id, форматируем как <id: значение>
    if ('id' in value && value.id !== null) {
      return `<id: ${value.id}>`;
    }
  }

  // Примитивные значения (число или строка) форматируем как <id: значение>
  return `<id: ${value}>`;
}
