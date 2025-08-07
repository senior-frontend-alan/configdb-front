<template>
  <div class="field-computed">
    <label :for="id" class="block">{{ label }}</label>
    <div :id="id" class="computed-value">
      {{ formattedValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface FieldOptions {
    name: string;
    label?: string;
    formatter?: (value: any) => string;
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    originalValue?: any;
    draftValue?: any;
    options: FieldOptions;
    updateField: (newValue: any) => void;
  }>();

  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const formatter = computed(() => props.options.formatter);

  // Форматирование значения (только draftValue)
  const formattedValue = computed(() => {
    const value = props.draftValue;

    if (!value) return '';

    if (formatter.value) {
      return formatter.value(value);
    }

    // Форматирование по умолчанию в зависимости от типа данных
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return String(value);
      }
    }

    return String(value);
  });
</script>

<style scoped>
  .field-computed {
    margin-bottom: 1rem;
  }

  .computed-value {
    padding: 0.5rem;
    background-color: var(--surface-100);
    border-radius: 4px;
    min-height: 2.5rem;
    display: flex;
    align-items: center;
  }
</style>
