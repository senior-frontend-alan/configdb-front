/**
 * Экспортирует объект-отображение для доступа к компонентам по типу поля
 */

// Получать данные только через пропсы
// Отправлять события изменений через update:modelValue
// НЕ иметь прямого доступа к стору

import { Component } from 'vue';
import { FRONTEND } from '../../../../services/fieldTypeService';

// Импортируем все компоненты полей
import Char from './Char.vue';
import IntegerDecimal from './IntegerDecimal.vue';
import Boolean from './Boolean.vue';
import DateTime from './DateTime.vue';
import Date from './Date.vue';
import Time from './Time.vue';
import Choice from './Choice.vue';
import RichEdit from './RichEdit.vue';
import Computed from './Computed.vue';
import Related from './Related.vue';
import PrimaryKeyRelated from './PrimaryKeyRelated.vue';
import ManyRelated from './ManyRelated.vue';
import ViewSetInlineLayout from './ViewSetInlineLayout.vue';

/**
 * Объект-отображение для компонентов полей с доступом O(1)
 * Используется для быстрого доступа к компонентам по типу поля
 */
export const dynamicField: Record<string, Component> = {
  [FRONTEND.CHAR]: Char,
  [FRONTEND.INTEGER]: IntegerDecimal,
  [FRONTEND.DECIMAL]: IntegerDecimal,
  [FRONTEND.BOOLEAN]: Boolean,
  [FRONTEND.DATE_TIME]: DateTime,
  [FRONTEND.DATE]: Date,
  [FRONTEND.TIME]: Time,
  [FRONTEND.CHOICE]: Choice,
  [FRONTEND.RICH_EDIT]: RichEdit,
  [FRONTEND.COMPUTED]: Computed,
  [FRONTEND.RELATED]: Related,
  [FRONTEND.PRIMARY_KEY_RELATED]: PrimaryKeyRelated,
  [FRONTEND.MANY_RELATED]: ManyRelated,
  [FRONTEND.VIEW_SET_INLINE_LAYOUT]: ViewSetInlineLayout,
};

/**
 * Функция для получения компонента по типу поля
 * @param fieldType - тип поля из FRONTEND
 * @returns компонент для отображения поля или компонент по умолчанию
 */
export function getComponent(fieldType: string): Component {
  return dynamicField[fieldType] || Char; // По умолчанию возвращаем текстовое поле
}

// Экспортируем все компоненты для удобства использования
export {
  Char,
  IntegerDecimal,
  Boolean,
  DateTime,
  Date,
  Time,
  Choice,
  RichEdit,
  PrimaryKeyRelated,
  Computed,
  Related,
  ViewSetInlineLayout,
};
