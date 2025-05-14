<template>
  <FloatLabel variant="in">
    <DatePicker 
      :id="props.id" 
      v-model="value" 
      :disabled="props.disabled"
      :required="props.required"
      :placeholder="props.placeholder"
      dateFormat="dd.mm.yy"
      showTime
      hourFormat="24"
      class="w-full"
    />
    <label :for="props.id">{{ props.label }}</label>
  </FloatLabel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DatePicker from 'primevue/datepicker';
import FloatLabel from 'primevue/floatlabel';

const props = defineProps<{
  modelValue?: Date | string;
  id: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Date | null): void;
}>();

// Преобразование строки в объект Date, если необходимо
const parseDate = (value: Date | string | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
};

// Используем вычисляемое свойство для двустороннего связывания
const value = computed({
  get: () => parseDate(props.modelValue),
  set: (newValue: Date | null) => {
    emit('update:modelValue', newValue);
  }
});
// Используем computed вместо watch
</script>

<style scoped>
.w-full {
  width: 100%;
}
</style>
