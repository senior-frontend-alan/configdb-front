<template>
  <div class="field-computed">
    <label :for="id" class="block">{{ label }}</label>
    <div :id="id" class="computed-value">{{ formattedValue }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Определяем интерфейс для объекта options
interface FieldOptions {
  name: string;
  label?: string;
  formatter?: (value: any) => string;
  // Другие возможные свойства
  [key: string]: any;
}

const props = defineProps<{
  modelValue?: any;
  options: FieldOptions;
}>();

// Извлекаем свойства из объекта options для удобства использования
const id = computed(() => props.options.name);
const label = computed(() => props.options.label || props.options.name);
const formatter = computed(() => props.options.formatter);

// Форматирование значения с использованием пользовательского форматтера или по умолчанию
const formattedValue = computed(() => {
  if (!props.modelValue) return '';
  
  if (formatter.value) {
    return formatter.value(props.modelValue);
  }
  
  // Форматирование по умолчанию в зависимости от типа данных
  if (typeof props.modelValue === 'object') {
    try {
      return JSON.stringify(props.modelValue);
    } catch (e) {
      return String(props.modelValue);
    }
  }
  
  return String(props.modelValue);
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
