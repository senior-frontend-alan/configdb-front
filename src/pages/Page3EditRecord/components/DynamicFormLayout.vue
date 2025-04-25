<template>
  <div class="dynamic-form-layout">
    <!-- Обрабатываем каждый элемент из массива elements -->
    <template v-for="(element, index) in elements" :key="index">
      <!-- Если это секция (LayoutSection) -->
      <Card v-if="element.class_name === 'LayoutSection'" class="layout-section mb-3">
        <template #title v-if="element.label">
          {{ element.label }}
        </template>
        <template #content>
          <!-- Рекурсивно обрабатываем вложенные элементы -->
          <DynamicFormLayout
            v-if="element.elements && element.elements.length > 0"
            :elements="element.elements"
            :model-value="modelValue"
            @update:model-value="(newValue) => emit('update:modelValue', newValue)"
          />
        </template>
      </Card>

      <!-- Если это строка (LayoutRow) -->
      <div v-else-if="element.class_name === 'LayoutRow'" class="layout-row p-grid mb-3">
        <template v-if="element.label">
          <div class="row-label mb-2">{{ element.label }}</div>
        </template>
        <!-- Рекурсивно обрабатываем вложенные элементы -->
        <DynamicFormLayout
          v-if="element.elements && element.elements.length > 0"
          :elements="element.elements"
          :model-value="modelValue"
          @update:model-value="(newValue) => emit('update:modelValue', newValue)"
          :is-row="true"
        />
      </div>

      <!-- Если это обычное поле -->
      <div v-else :class="{ 'form-field': true, 'p-col': isRow }">
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
  </div>
</template>

<script setup lang="ts">
  import { defineProps, defineEmits } from 'vue';
  import Card from 'primevue/card';
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
    isRow?: boolean;
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
  .dynamic-form-layout {
    width: 100%;
  }

  .layout-section {
    margin-bottom: 1.5rem;
  }

  .layout-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .row-label {
    width: 100%;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .form-field {
    display: flex;
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
