/**
 * Индексный файл для компонентов полей
 * Экспортирует все форматтеры полей и объект-отображение для доступа к ним
 */

import { FRONTEND } from '../../../../services/fieldTypeService';
import { formatChar } from './Char';
import { formatInteger } from './Integer';
import { formatDecimal } from './Decimal';
import { formatRichEdit } from './RichEdit';
import { formatDateValue, formatTimeValue, formatDateTimeValue } from './DateTime';
import { formatComputedValue } from './Computed';
import { formatRelatedValue } from './Related';
import { formatChoiceValue } from './Choice';

// Тип для функций форматирования
export type FormatterFunction = (value: any, fieldMetadata?: any) => string | any;

// Тип для объекта форматтеров
export type FormattersMap = {
  [key: string]: FormatterFunction;
  default: FormatterFunction;
};

/**
 * Объект-отображение для функций форматирования полей с доступом O(1)
 * Используется для быстрого доступа к функциям форматирования по типу поля
 */
export const formatters: FormattersMap = {
  [FRONTEND.INTEGER]: (value: any) => formatInteger(value),
  [FRONTEND.DECIMAL]: (value: any) => formatDecimal(value),
  [FRONTEND.CHAR]: (value: any) => formatChar(value, { maximumLength: 100 }),
  [FRONTEND.RICH_EDIT]: (value: any) => formatRichEdit(value),
  [FRONTEND.DATE]: (value: any) => formatDateValue(value),
  [FRONTEND.TIME]: (value: any) => formatTimeValue(value),
  [FRONTEND.DATE_TIME]: (value: any) => formatDateTimeValue(value),
  [FRONTEND.COMPUTED]: (value: any) => formatComputedValue(value),
  [FRONTEND.RELATED]: (value: any) => formatRelatedValue(value),
  [FRONTEND.CHOICE]: (value: any, fieldMetadata?: any) => formatChoiceValue(value, fieldMetadata),
  // Функция по умолчанию для неизвестных типов
  default: (value: any) => formatChar(value, { maximumLength: 100 }),
};

// Экспортируем все форматтеры для удобства использования
export {
  formatChar,
  formatInteger,
  formatDecimal,
  formatRichEdit,
  formatDateValue,
  formatTimeValue,
  formatDateTimeValue,
  formatComputedValue,
  formatRelatedValue,
  formatChoiceValue,
};
