import { useModuleStore } from '../../../../stores/module-factory';
import { FieldDefinition, FormattingOptions } from '../../../../services/fieldTypeService';

/**
 * Форматирует значение для отображения в таблице
 * @param value Исходное значение
 * @param options Опции форматирования
 * @returns Отформатированное значение
 */
export function formatComputedValue(value: FieldDefinition, options: FormattingOptions = {}): string {
  try {
    // Проверяем, есть ли jsItemRepr в опциях
    if (options.jsItemRepr) {
      // Если указан moduleId, пытаемся получить JS-функции модуля
      if (options.moduleId && typeof options.moduleId === 'string') {
        // Получаем стор модуля напрямую
        const moduleStore = useModuleStore(options.moduleId);

        // Получаем доступ к JS-функциям модуля
        const jsi = moduleStore.getJSIFunctions();

        try {
          // Выполняем JS-код с доступом к функциям модуля через jsi
          const fn = new Function('value', 'jsi', 'obj', options.jsItemRepr);
          const result = fn(value, jsi, value);
          return result !== null && result !== undefined ? String(result) : '';
        } catch (innerError: any) {
          console.error(`Ошибка выполнения jsItemRepr:`, innerError);
          return `<Ошибка: ${innerError.message}>`;
        }
      } else {
        // Если moduleId не указан, выполняем jsItemRepr без доступа к функциям модуля
        try {
          const innerFn = new Function('value', 'obj', options.jsItemRepr);
          const result = innerFn(value, value);
          return result !== null && result !== undefined ? String(result) : '';
        } catch (innerError: any) {
          console.error(`Ошибка выполнения jsItemRepr без модуля:`, innerError);
          return `<Ошибка: ${innerError.message}>`;
        }
      }
    }

    // Если нет ни moduleId, ни jsItemRepr, просто преобразуем значение в строку
    return value !== null && value !== undefined ? String(value) : '';
  } catch (e: any) {
    console.error(`Ошибка в formatComputedValue:`, e);
    return `<Ошибка: ${e.message}>`;
  }
}