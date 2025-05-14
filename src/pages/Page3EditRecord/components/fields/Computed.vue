<template>
  <div class="field-computed">
    <label :for="props.id" class="block">{{ props.label }}</label>
    <div :id="props.id" class="computed-value">{{ formattedValue }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: any;
  id: string;
  label: string;
  formatter?: (value: any) => string;
}>();

// Форматирование значения с использованием пользовательского форматтера или по умолчанию
const formattedValue = computed(() => {
  if (!props.modelValue) return '';
  
  if (props.formatter) {
    return props.formatter(props.modelValue);
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
