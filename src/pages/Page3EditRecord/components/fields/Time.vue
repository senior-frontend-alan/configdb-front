<template>
  <FloatLabel variant="in">
    <Calendar 
      :id="props.id" 
      v-model="value" 
      variant="filled"
      :disabled="props.disabled"
      :required="props.required"
      :placeholder="props.placeholder"
      timeOnly
      hourFormat="24"
      class="w-full"
    />
    <label :for="props.id">{{ props.label }}</label>
  </FloatLabel>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Calendar from 'primevue/calendar';
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
const parseTime = (value: Date | string | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  // Если строка в формате HH:MM:SS, создаем сегодняшнюю дату с этим временем
  if (typeof value === 'string' && value.includes(':')) {
    const today = new Date();
    const [hours, minutes, seconds = 0] = value.split(':').map(Number);
    today.setHours(hours, minutes, seconds, 0);
    return today;
  }
  
  return new Date(value);
};

const value = ref(parseTime(props.modelValue));

// Обновляем локальное значение при изменении props.modelValue
watch(() => props.modelValue, (newValue) => {
  value.value = parseTime(newValue);
});

// Отправляем событие при изменении локального значения
watch(value, (newValue) => {
  emit('update:modelValue', newValue);
});
</script>

<style scoped>
/* При необходимости можно добавить дополнительные стили */
</style>
