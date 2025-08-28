<template>
  <FloatLabel variant="in">
    <Calendar
      :id="id"
      v-model="value"
      variant="filled"
      :disabled="disabled"
      :required="required"
      :placeholder="placeholder"
      timeOnly
      hourFormat="24"
      class="w-full"
      :class="{ 'field-modified': props.isModified }"
      :data-testid="`${FRONTEND.TIME}-field-${props.options.name}`"
    />
    <label :for="id">{{ label }}</label>
  </FloatLabel>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import Calendar from 'primevue/calendar';
  import FloatLabel from 'primevue/floatlabel';
  import { FRONTEND } from '../../../../services/fieldTypeService';

  // Определяем интерфейс для объекта options
  interface FieldOptions {
    FRONTEND_CLASS: typeof FRONTEND.TIME;
    name: string;
    label?: string;
    placeholder?: string;
    readonly?: boolean;
    required?: boolean;
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    modelValue?: Date | string;
    options: FieldOptions;
    isModified: boolean;
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const placeholder = computed(() => props.options.placeholder || '');
  const disabled = computed(() => props.options.readonly || false);
  const required = computed(() => props.options.required || false);

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
  watch(
    () => props.modelValue,
    (newValue) => {
      value.value = parseTime(newValue);
    },
  );

  // Отправляем событие при изменении локального значения
  watch(value, (newValue) => {
    emit('update:modelValue', newValue);
  });
</script>

<style scoped>
  /* При необходимости можно добавить дополнительные стили */
</style>
