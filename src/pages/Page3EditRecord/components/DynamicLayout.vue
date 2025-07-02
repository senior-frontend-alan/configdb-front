<!-- 
DynamicLayout: чисто презентационный компонент
Задача - отображении элементов формы и передаче событий изменения данных родительскому компоненту.
Получать данные через пропсы от родителя и отправлять события обновления обратно родителю
НЕ работать напрямую со стором 

Родительская форма определяет isModified
Централизованное управление - вся логика изменений находится в одном месте
Единообразие - все поля используют одинаковую логику определения изменений
Оптимизация - можно оптимизировать хранение данных об изменениях (например, хранить только разницу)
Простота глобальных действий - легко реализовать действия для всех измененных полей (сброс, подсветка и т.д.)
Контроль транзакций - проще реализовать отмену/повтор действий на уровне всей формы
-->

<template>
  <template v-if="elementsArray.length > 0">
    <!-- Отображение в виде JSON для отладки -->
    <pre
      v-if="showDebugJson"
      style="
        background-color: #f5f5f5;
        padding: 10px;
        border-radius: 5px;
        overflow: auto;
        max-height: 300px;
      "
      >{{ JSON.stringify(elementsArray, null, 2) }}</pre
    >
    <template v-for="(element, index) in elementsArray" :key="element.name || index">
      <!-- Если это секция (LayoutSection) -->
      <!-- {{ element.class_name }} -->
      <div v-if="element.class_name === BACKEND.class_name.LAYOUT_SECTION" class="layout-section">
        <h3 v-if="element.label" class="section-title-wrapper">
          <span class="section-title">{{ element.label }}</span>
        </h3>
        <!-- Рекурсивно обрабатываем вложенные элементы -->
        <DynamicLayout
          v-if="element.elements && element.elements.length > 0"
          :layout-elements="element.elementsIndex"
          :model-value="modelValue"
          :patch-data="patchData"
          @update:model-value="(newValue) => emit('update:modelValue', newValue)"
        />
      </div>

      <!-- Если это строка (LayoutRow) -->
      <div v-else-if="element.class_name === BACKEND.class_name.LAYOUT_ROW" class="layout-row">
        <!-- Рекурсивно обрабатываем вложенные элементы строки -->
        <DynamicLayout
          v-if="element.elements && element.elements.length > 0"
          :layout-elements="element.elementsIndex"
          :model-value="modelValue"
          :patch-data="patchData"
          @update:model-value="(newValue) => emit('update:modelValue', newValue)"
        />
      </div>

      <!-- Если это обычное поле -->
      <div v-else :class="{ 'form-field': true }">
        <div v-if="debugField(element)" class="debug-info">
          Поле: {{ element.name }}, Значение: {{ modelValue[element.name] }}
        </div>
        <!-- v-on="..." событие reset-field передается только компоненту ViewSetInlineLayout, а не всем компонентам полей. -->
        <component
          :is="getComponent(element.FRONTEND_CLASS || FRONTEND.CHAR)"
          :options="element"
          :model-value="modelValue[element.name]"
          :is-modified="isFieldModified(element.name) || false"
          @update:model-value="updateFieldValue(element.name, $event)"
          v-on="element.FRONTEND_CLASS === FRONTEND.VIEW_SET_INLINE_LAYOUT ? { 'reset-field': (fieldName: string) => emit('reset-field', fieldName) } : {}"
        />
      </div>
    </template>
  </template>
  <div v-else class="no-fields-message">
    <Message severity="info">Нет полей для отображения</Message>
  </div>
</template>

<script lang="ts">
  /**
   * Интерфейс для элементов формы
   */
  export interface FormElement {
    name: string;
    label?: string;
    class_name?: string;
    field_class?: string;
    type?: string;
    readonly?: boolean;
    required?: boolean;
    placeholder?: string;
    choices?: Array<{ value: string | number; display_name: string }>;
    min?: number;
    max?: number;
    related_model?: string;
    related_url?: string;
    elements?: FormElement[];
    [key: string]: any;
  }

  // Интерфейс FormElement определяет структуру элементов макета формы
</script>

<script setup lang="ts">
  import { defineProps, defineEmits, computed, ref } from 'vue';
  import { getComponent } from './fields';
  import { FRONTEND, BACKEND } from '../../../services/fieldTypeService';
  import Message from 'primevue/message';

  // Используем интерфейс FormElement из верхнего скрипта
  const showDebugJson = ref(false); // Показывать ли JSON для отладки

  const props = defineProps<{
    layoutElements: Map<string, FormElement>;
    modelValue: Record<string, any>;
    patchData?: Record<string, any>; // Данные о измененных полях (PATCH)
  }>();

  // В шаблоне Vue директива v-for работает с массивами
  const elementsArray = computed(() => {
    const elements = Array.from(props.layoutElements.values());
    console.log('DynamicLayout - элементы макета:', elements);
    console.log('DynamicLayout - полученные данные:', props.modelValue);
    return elements;
  });

  const emit = defineEmits<{
    'update:modelValue': [value: Record<string, any>];
    'reset-field': [fieldName: string];
  }>();

  const isFieldModified = (fieldName: string) => {
    return props.patchData && fieldName in props.patchData;
  };

  const updateFieldValue = (name: string, value: any) => {
    // Создаем копию текущего объекта modelValue
    const updatedData = { ...props.modelValue };

    // Обновляем значение поля
    updatedData[name] = value;
    // НЕ Удалять, в будущем тут будет валидация

    // Отправляем обновленные данные родительскому компоненту
    emit('update:modelValue', updatedData);
  };

  // Функция для отладки полей формы
  const debugField = (element: FormElement) => {
    // console.log(`Поле ${element.name}:`, {
    //   значение: props.modelValue[element.name],
    //   метаданные: element,
    // });
    return false; // Отключаем отображение отладочной информации в UI
  };
</script>

<style scoped>
  .section-title-wrapper {
    display: flex;
    margin: 0;
    position: relative;
    top: -1.1rem;
    margin-bottom: 0.5rem;
  }

  .section-title {
    color: var(--text-color-secondary);
    background-color: #f8fafc;
    padding: 0 1rem;
    font-weight: 500;
  }

  .layout-section {
    margin-top: 2rem;
    margin-bottom: 1.5rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    padding-left: 1rem;
    padding-right: 1rem;
    border-radius: 4px;
    border: 1px solid var(--p-surface-300);
    background-color: var(rgb(99, 99, 99));
  }

  .dynamic-form-layout {
    width: 100%;
  }

  .layout-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    width: 100%;
  }

  .row-label {
    width: 100%;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .form-field {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    margin-bottom: 1rem;
    min-width: 0; /* Предотвращает переполнение контента */
  }

  .form-field.p-col {
    flex: 1 1 300px;
    margin-bottom: 0.5rem;
  }

  .form-label {
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
</style>
