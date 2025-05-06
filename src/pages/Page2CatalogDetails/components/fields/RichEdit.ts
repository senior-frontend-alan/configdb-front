import { FieldDefinition, FormattingOptions } from '../../../../services/fieldTypeService';

// Тип для значения поля (используем any для совместимости с предыдущим кодом)
type FieldValue = any;

/**
 * Определяет тип содержимого (JSON, YAML, HTML, CSS, SQL)
 */
export type ContentTypeResult = {
  label: string;
  value: FieldValue;
  formattedValue: string; // Отформатированное значение для отображения
};

/**
 * Определяет тип содержимого (JSON, YAML, HTML, CSS, SQL)
 * @param value Значение для определения типа
 * @returns Объект с меткой типа содержимого, исходным значением и отформатированным значением
 */
export function detectContentType(value: FieldValue): ContentTypeResult {
  // Для массивов показываем количество элементов
  if (Array.isArray(value)) {
    return {
      label: `Array(${value.length})`,
      value,
      formattedValue: JSON.stringify(value, null, 2),
    };
  }

  // Для объектов проверяем, можно ли их сериализовать в JSON
  if (typeof value === 'object' && value !== null) {
    try {
      const formatted = JSON.stringify(value, null, 2);
      return {
        label: 'JSON',
        value,
        formattedValue: formatted,
      };
    } catch (e) {
      // Если не удалось сериализовать, это не JSON
      return {
        label: 'Object',
        value,
        formattedValue: String(value),
      };
    }
  }

  // Для других типов данных
  if (typeof value !== 'string') {
    return {
      label: typeof value,
      value,
      formattedValue: String(value),
    };
  }

  // Проверяем на JSON строки
  if (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']'))
  ) {
    try {
      JSON.parse(value);
      return {
        label: 'JSON',
        value,
        formattedValue: JSON.stringify(JSON.parse(value), null, 2),
      };
    } catch (e) {
      // Если не удалось распарсить, это не JSON
    }
  }

  // Проверяем на HTML
  if (
    value.includes('<html') ||
    value.includes('<!DOCTYPE html') ||
    (value.includes('<') && value.includes('</') && value.includes('>'))
  ) {
    return {
      label: 'HTML',
      value,
      formattedValue: value,
    };
  }

  // Проверяем на YAML
  if (
    value.includes(':') &&
    value.includes('\n') &&
    !value.includes('{') &&
    !value.includes('[') &&
    (value.includes('  ') || value.includes('- '))
  ) {
    return {
      label: 'YAML',
      value,
      formattedValue: value,
    };
  }

  // Проверяем на CSS
  if (value.includes('{') && value.includes('}') && value.includes(':') && value.includes(';')) {
    return {
      label: 'CSS',
      value,
      formattedValue: value,
    };
  }

  // Проверяем на SQL
  if (
    (value.toUpperCase().includes('SELECT') && value.toUpperCase().includes('FROM')) ||
    value.toUpperCase().includes('INSERT INTO') ||
    (value.toUpperCase().includes('UPDATE') && value.toUpperCase().includes('SET'))
  ) {
    return {
      label: 'SQL',
      value,
      formattedValue: value,
    };
  }

  return {
    label: 'String',
    value,
    formattedValue: value,
  };
}

/**
 * Форматирует значение с расширенным редактированием (CLOB, YAML, JSON, код)
 * @param value Исходное значение
 * @returns Объект с типом содержимого и отформатированным значением
 */
export function formatRichEdit(value: FieldValue): ContentTypeResult {
  return detectContentType(value);
}
