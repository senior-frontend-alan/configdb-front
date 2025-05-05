<template>
  <template v-for="(element, index) in elements" :key="index">
    <!-- Если это секция (LayoutSection) -->
    <div v-if="element.class_name === 'LayoutSection'" class="layout-section">
      <h3 v-if="element.label" class="section-title">{{ element.label }}</h3>
      <!-- Рекурсивно обрабатываем вложенные элементы -->
      <DynamicFormLayout
        v-if="element.elements && element.elements.length > 0"
        :elements="element.elements"
        :model-value="modelValue"
        @update:model-value="(newValue) => emit('update:modelValue', newValue)"
      />
    </div>

    <!-- Если это строка (LayoutRow) -->
    <div v-else-if="element.class_name === 'LayoutRow'" class="layout-row">
      <!-- Рекурсивно обрабатываем вложенные элементы строки -->
      <DynamicFormLayout
        v-if="element.elements && element.elements.length > 0"
        :elements="element.elements"
        :model-value="modelValue"
        @update:model-value="(newValue) => emit('update:modelValue', newValue)"
      />
    </div>

    <!-- Если это обычное поле -->
    <div v-else :class="{ 'form-field': true }">
      <DynamicFormField
        :field="{
          name: element.name,
          type: element.type || 'text',
          class_name: element.class_name,
          field_class: element.field_class,
          readonly: element.readonly,
          required: element.required,
          placeholder: element.placeholder,
          choices: element.choices,
          min: element.min,
          max: element.max,
          related_model: element.related_model,
          related_url: element.related_url,
        }"
        :model-value="modelValue[element.name]"
        @update:model-value="updateFieldValue(element.name, $event)"
      />
    </div>
  </template>
</template>

<script setup lang="ts">
  import { defineProps, defineEmits } from 'vue';
  import DynamicFormField from './DynamicFormField.vue';

  interface FormElement {
    name: string;
    label?: string;
    class_name?: string;
    field_class?: string;
    type?: string;
    elements?: FormElement[];
    [key: string]: any;
  }

  const props = defineProps<{
    elements: FormElement[];
    modelValue: Record<string, any>;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: Record<string, any>): void;
  }>();

  // Функция для обновления значения поля в родительском объекте данных
  const updateFieldValue = (fieldName: string, value: any) => {
    if (!fieldName) return;

    const updatedData = { ...props.modelValue };
    updatedData[fieldName] = value;

    emit('update:modelValue', updatedData);
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
