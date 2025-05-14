<template>
  <FloatLabel variant="in">
    <InputNumber 
      :id="props.id" 
      v-model="value" 
      variant="filled"
      :disabled="props.disabled"
      :required="props.required"
      :placeholder="props.placeholder"
      :min="props.min"
      :max="props.max"
      :minFractionDigits="2"
      :maxFractionDigits="6"
      class="w-full"
    />
    <label :for="props.id">{{ props.label }}</label>
  </FloatLabel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import InputNumber from 'primevue/inputnumber';
import FloatLabel from 'primevue/floatlabel';

const props = defineProps<{
  modelValue?: number;
  id: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
}>();

// Используем вычисляемое свойство для двустороннего связывания
const value = computed({
  get: () => props.modelValue,
  set: (newValue: number | null) => {
    emit('update:modelValue', newValue);
  }
});
</script>

<style scoped>
/* При необходимости можно добавить дополнительные стили */
</style>
