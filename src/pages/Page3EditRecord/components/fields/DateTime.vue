<template>
  <FloatLabel variant="in">
    <DatePicker
      :id="id"
      v-model="value"
      :disabled="disabled"
      :required="required"
      :placeholder="placeholder"
      dateFormat="dd.mm.yy"
      showTime
      hourFormat="24"
      class="w-full"
      :class="{ 'field-modified': isModified }"
    />
    <label :for="id">{{ label }}</label>
  </FloatLabel>
  <Message
    v-if="help_text"
    size="small"
    severity="secondary"
    variant="simple"
    class="flex-grow-1 ml-2"
  >
    {{ help_text }}
  </Message>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import DatePicker from 'primevue/datepicker';
  import FloatLabel from 'primevue/floatlabel';
  import Message from 'primevue/message';

  interface FieldOptions {
    name: string;
    label?: string;
    placeholder?: string;
    readonly?: boolean;
    required?: boolean;
    help_text?: string;
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    originalValue?: Date | string;
    draftValue?: Date | string;
    options: FieldOptions;
    updateField: (newValue: any) => void;
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const placeholder = computed(() => props.options.placeholder || '');
  const disabled = computed(() => props.options.readonly || false);
  const required = computed(() => props.options.required || false);
  const help_text = computed(() => props.options.help_text);

  const isModified = computed(() => {
    // Если нет draft значения, поле не изменено
    if (props.draftValue === undefined) return false;

    return props.draftValue !== props.originalValue;
  });

  // Преобразование строки в объект Date, если необходимо
  const parseDate = (value: Date | string | undefined): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    return new Date(value);
  };

  // Используем вычисляемое свойство для двустороннего связывания
  const value = computed({
    get: () => parseDate(props.draftValue), // Всегда показываем только draftValue
    set: (newValue: Date | null) => props.updateField(newValue),
  });
</script>

<style scoped>
  .w-full {
    width: 100%;
  }
</style>
