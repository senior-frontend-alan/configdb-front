import { Component, h } from 'vue';
import { FRONTEND } from '../../../../services/fieldTypeService.ts';
import CharWithButton from './CharWithButton.vue';
import RichEdit from './RichEdit.vue';
import { formatChoiceValue } from './Choice.ts';

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
  factory: (value: unknown, metadata?: unknown) => Component | (() => any),
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
export const DYNAMIC_FIELD: Record<string, Component | FieldComponentFactory> = {
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
  // Здесь можно добавить другие типы полей и соответствующие им компоненты
  // [FRONTEND.DATE]: DateField,
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
