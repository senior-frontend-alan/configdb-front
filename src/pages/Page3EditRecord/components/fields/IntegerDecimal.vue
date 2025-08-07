<template>
  <FloatLabel variant="in">
    <InputNumber
      :id="id"
      v-model="value"
      :disabled="disabled"
      :required="required"
      :placeholder="placeholder"
      :min="min"
      :max="max"
      :step="step"
      :minFractionDigits="minFractionDigits"
      :maxFractionDigits="maxFractionDigits"
      :integerOnly="isInteger"
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
  import InputNumber from 'primevue/inputnumber';
  import FloatLabel from 'primevue/floatlabel';
  import Message from 'primevue/message';

  interface FieldOptions {
    name: string;
    label?: string;
    placeholder?: string;
    readonly?: boolean;
    required?: boolean;
    help_text?: string;
    min?: number;
    max?: number;
    decimal_places?: number;
    field_class?: string; // Тип поля (INTEGER или DECIMAL)
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    originalValue?: number;
    draftValue?: number;
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
  const min = computed(() => props.options.min);
  const max = computed(() => props.options.max);

  // Определяем, является ли поле целочисленным
  const isInteger = computed(() => props.options.field_class === 'INTEGER');

  // Настройки для десятичных чисел
  const minFractionDigits = computed(() =>
    isInteger.value ? 0 : props.options.decimal_places || 2,
  );
  const maxFractionDigits = computed(() =>
    isInteger.value ? 0 : props.options.decimal_places || 6,
  );

  // Шаг для целых чисел - 1, для десятичных - 0.01 или меньше в зависимости от decimal_places
  const step = computed(() =>
    isInteger.value ? 1 : Math.pow(10, -(props.options.decimal_places || 2)),
  );

  const isModified = computed(() => {
    // Если нет draft значения, поле не изменено
    if (props.draftValue === undefined) return false;

    return props.draftValue !== props.originalValue;
  });

  // Используем вычисляемое свойство для двустороннего связывания
  const value = computed({
    get: () => props.draftValue, // Всегда показываем только draftValue
    set: (newValue: number | null) => props.updateField(newValue),
  });
</script>

<style scoped>
  .w-full {
    width: 100%;
  }
</style>
