import { Component, h } from 'vue';
import { FRONTEND, FieldDefinition } from '../../../../services/fieldTypeService';

// Это модуль с утилитами, а не компонент Vue
// Кеширование локали здесь создаст глобальное состояние, что усложняет тестирование
// Подписка на изменения стора в модуле может привести к утечкам памяти, так как подписка никогда не будет отменена
// Поэтому локаль передается как пропс

import CharWithButton from './CharWithButton.vue';
import RichEdit from './RichEdit.vue';
import { formatChoiceValue } from './Choice';
import { formatInteger } from './Integer';
import { formatDecimal } from './Decimal';
import { formatChar } from './Char';
import { formatDate, formatTime, formatDateTime } from './DateTime';
import { formatComputedValue } from './Computed';
import { formatRelatedValue } from './Related';
import { formatPrimaryKeyRelatedValue } from './PrimaryKeyRelated';
import { formatManyRelatedValue } from './ManyRelated';
import ManyRelated from './ManyRelated.vue';

// Максимальная длина текста для простого отображения
const MAX_TEXT_LENGTH = 50;

type FieldComponentFactory = {
  (value: unknown, metadata?: unknown): Component | (() => any);
  factory: true; // Маркер для определения, что это фабрика компонентов
};

// createFieldFactory используется для решения проблемы типизации в TypeScript
// Когда мы используем анонимную функцию напрямую, возникает проблема с определением типа.
// Поэтому мы создаем отдельную функцию createFieldFactory, которая явно указывает тип.
// Иначе TypeScript не может автоматически определить, что эта функция является "фабрикой компонентов", а не обычным компонентом Vue.
function createFieldFactory(
  factory: (value: unknown, metadata: unknown, locale: string) => Component | (() => any),
): FieldComponentFactory {
  const typedFactory = factory as FieldComponentFactory;
  typedFactory.factory = true;
  return typedFactory;
}
/**
 * Компоненты полей с оптимизацией производительности:
 * - Используются функциональные компоненты где это возможно
 * - Нет инициализации компонента, его хуков жизненного цикла и реактивных свойств
 * - Нет внутреннего состояния - нет реактивных данных, ref, reactive
 * - Не создается экземпляр компонента - это просто функция, возвращающая VNode
 * - Меньше накладных расходов - не требуется компиляция шаблона, нет наблюдателей (watchers)
 */
export const dynamicField: Record<string, Component | FieldComponentFactory> = {
  [FRONTEND.CHAR]: createFieldFactory((value) => {
    if (typeof value === 'string' && (!value || value.length <= MAX_TEXT_LENGTH)) {
      return () => h('span', {}, String(value || ''));
    }
    // Возвращаем не просто компонент, а функциональный компонент с пропсами
    return (props) =>
      h(CharWithButton, {
        text: String(value || ''),
        maxLength: MAX_TEXT_LENGTH,
      });
  }),
  [FRONTEND.RICH_EDIT]: RichEdit,
  [FRONTEND.CHOICE]: createFieldFactory((value, metadata) => {
    return h('span', {}, formatChoiceValue(value, metadata));
  }),
  [FRONTEND.INTEGER]: createFieldFactory((value) => {
    return h('span', {}, formatInteger(value as FieldDefinition));
  }),
  [FRONTEND.DECIMAL]: createFieldFactory((value) => {
    return h('span', {}, formatDecimal(value as FieldDefinition));
  }),
  [FRONTEND.DATE]: createFieldFactory((value, _metadata, locale) => {
    return h('span', {}, formatDate(value as FieldDefinition, locale));
  }),
  [FRONTEND.TIME]: createFieldFactory((value, _metadata, locale) => {
    return h('span', {}, formatTime(value as FieldDefinition, locale));
  }),
  [FRONTEND.DATE_TIME]: createFieldFactory((value, _metadata, locale) => {
    return h('span', {}, formatDateTime(value as FieldDefinition, locale));
  }),
  [FRONTEND.COMPUTED]: createFieldFactory((value) => {
    return h('span', {}, formatComputedValue(value as FieldDefinition));
  }),
  [FRONTEND.RELATED]: createFieldFactory((value) => {
    return h('span', {}, formatRelatedValue(value as FieldDefinition));
  }),
  [FRONTEND.PRIMARY_KEY_RELATED]: createFieldFactory((value) => {
    return h('span', {}, formatPrimaryKeyRelatedValue(value as FieldDefinition));
  }),
  [FRONTEND.MANY_RELATED]: createFieldFactory((value, metadata) => {
    // Проверяем, является ли value массивом объектов с id и name
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === 'object' &&
      value[0] !== null
    ) {
      // Возвращаем компонент с чипсами
      return () =>
        h(ManyRelated, {
          value: value,
          field: {
            FRONTEND_CLASS: FRONTEND.MANY_RELATED,
            ...(metadata as object),
          },
        });
    }
    // В противном случае возвращаем простой span с отформатированным текстом
    return h('span', {}, formatManyRelatedValue(value));
  }),
  // Для остальных типов будет использоваться стандартный span
};

// Мы не можем просто использовать FIELD_COMPONENTS[field.frontendClass] напрямую, потому что некоторые элементы в FIELD_COMPONENTS - это фабрики компонентов, а не сами компоненты Vue.
// Когда мы используем компонент в шаблоне Vue через директиву :is, Vue ожидает получить один из трех типов:
// Строку с именем зарегистрированного компонента
// Объект компонента Vue
// Функциональный компонент Vue
// Но в FIELD_COMPONENTS у нас есть элементы типа FieldComponentFactory, которые нужно вызвать с параметрами value и metadata, чтобы получить компонент. Если мы передадим фабрику напрямую в :is, Vue не будет знать, как её обработать.
// Решение с resolveComponent

export function resolveComponent(
  component: Component | FieldComponentFactory | undefined,
  value?: unknown,
  metadata?: unknown,
): Component | (() => any) {
  // Если компонент - функция-фабрика, вызываем её с текущим значением и метаданными
  if (typeof component === 'function' && 'factory' in component) {
    return component(value, metadata);
  }

  // Если компонент не является фабрикой, возвращаем его как есть
  return component || (() => h('span', {}, String(value || '')));
}

/**
 * Форматирует значение поля для отображения в тексте (без HTML компонентов)
 * Используется для отображения значений в фильтрах, заголовках и других текстовых контекстах
 */
export function formatFieldValueForDisplay(
  value: unknown,
  fieldType?: string,
  metadata?: unknown,
  locale: string = 'ru'
): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Определяем тип поля и используем соответствующую функцию форматирования
  // Приводим fieldType к нижнему регистру для сравнения
  const normalizedFieldType = fieldType?.toLowerCase();
  
  switch (normalizedFieldType) {
    case FRONTEND.CHOICE:
      return formatChoiceValue(value as string | number | boolean | null | undefined, metadata as any);
    
    case FRONTEND.INTEGER:
      return formatInteger(value as FieldDefinition);
    
    case FRONTEND.DECIMAL:
      return formatDecimal(value as FieldDefinition);
    
    case FRONTEND.DATE:
      return formatDate(value as FieldDefinition, locale);
    
    case FRONTEND.TIME:
      return formatTime(value as FieldDefinition, locale);
    
    case FRONTEND.DATE_TIME:
      return formatDateTime(value as FieldDefinition, locale);
    
    case FRONTEND.COMPUTED:
      return formatComputedValue(value as FieldDefinition);
    
    case FRONTEND.RELATED:
      return formatRelatedValue(value as FieldDefinition);
    
    case FRONTEND.PRIMARY_KEY_RELATED:
      return formatPrimaryKeyRelatedValue(value as FieldDefinition);
    
    case FRONTEND.MANY_RELATED:
      return formatManyRelatedValue(value);
    
    case FRONTEND.CHAR:
    case FRONTEND.RICH_EDIT:
    default:
      return formatChar(value as FieldDefinition);
  }
}
