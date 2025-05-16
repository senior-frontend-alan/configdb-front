<!-- 
DynamicLayout: чисто презентационный компонент
Задача - отображении элементов формы и передаче событий изменения данных родительскому компоненту.
Получать данные через пропсы от родителя и отправлять события обновления обратно родителю
НЕ работать напрямую со стором 
-->

<template>
  <div class="dynamic-layout">
    <template v-if="elementsArray.length > 0">
      <template v-for="(element, index) in elementsArray" :key="element.name || index">
        <!-- Если это секция (LayoutSection) -->
        <div v-if="element.class_name === 'LayoutSection'" class="layout-section">
          <h3 v-if="element.label" class="section-title">{{ element.label }}</h3>
          <!-- Рекурсивно обрабатываем вложенные элементы -->
          <DynamicLayout
            v-if="element.elements && element.elements.length > 0"
            :layout-elements="element.ELEMENTS"
            :model-value="modelValue"
            @update:model-value="(newValue) => emit('update:modelValue', newValue)"
          />
        </div>

        <!-- Если это строка (LayoutRow) -->
        <div v-else-if="element.class_name === 'LayoutRow'" class="layout-row">
          <!-- Рекурсивно обрабатываем вложенные элементы строки -->
          <DynamicLayout
            v-if="element.elements && element.elements.length > 0"
            :layout-elements="element.ELEMENTS"
            :model-value="modelValue"
            @update:model-value="(newValue) => emit('update:modelValue', newValue)"
          />
        </div>

        <!-- Если это обычное поле -->
        <div v-else :class="{ 'form-field': true }">
          <component
            :is="getComponent(element.FRONTEND_CLASS || FRONTEND.CHAR)"
            :id="element.name"
            :label="element.label || element.name"
            :model-value="modelValue[element.name]"
            @update:model-value="updateFieldValue(element.name, $event)"
            :placeholder="element.placeholder || ''"
            :disabled="element.readonly"
            :required="element.required"
            :min="element.min"
            :max="element.max"
            :max_length="element.max_length"
            :options="element.choices"
            :apiEndpoint="element.related_url"
            :help_text="element.help_text"
          />
        </div>
      </template>
    </template>
    <div v-else class="no-fields-message">
      <Message severity="info">Нет полей для отображения</Message>
    </div>
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
  import { defineProps, defineEmits, computed } from 'vue';
  import { getComponent } from './fields';
  import { FRONTEND } from '../../../services/fieldTypeService';
  import Message from 'primevue/message';

  // Используем интерфейс FormElement из верхнего скрипта

  const props = defineProps<{
    layoutElements: Map<string, FormElement>;
    modelValue: Record<string, any>;
    recordId?: string;
  }>();

  // В шаблоне Vue директива v-for работает с массивами
  const elementsArray = computed(() => {
    return Array.from(props.layoutElements.values());
  });

  const emit = defineEmits<{
    'update:modelValue': [value: Record<string, any>];
  }>();

  const updateFieldValue = (name: string, value: any) => {
    // Получаем элемент напрямую из Map - O(1) а если использовать оригинальный props.layoutElements то будет O(n)
    // Валидация каждого поля перед сохранением
    const element = props.layoutElements.get(name);

    // НЕ Удалять, в будущем тут будет валидация
    let processedValue = value;

    // if (element?.type === 'number' && typeof value === 'number') {
    //   if (element.min !== undefined && value < element.min) {
    //     processedValue = element.min;
    //   } else if (element.max !== undefined && value > element.max) {
    //     processedValue = element.max;
    //   }
    // }

    // Обновляем данные формы
    const newData = { ...props.modelValue, [name]: processedValue };
    emit('update:modelValue', newData);
  };
</script>

<style scoped>
  .section-title {
    color: var(--text-color-secondary);
    margin-bottom: 0.5rem;
  }

  .layout-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: #fff;
    border-radius: 4px;
    border: 1px solid var(--p-surface-200);
  }

  .dynamic-form-layout {
    width: 100%;
  }

  .layout-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .row-label {
    width: 100%;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .form-field {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    margin-bottom: 1rem;
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
