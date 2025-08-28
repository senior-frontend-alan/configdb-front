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
      :step="1"
      class="w-full"
      :class="{ 'field-modified': isModified }"
      integerOnly
      :data-testid="`integer-field-${props.options.name}`"
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
  import { FRONTEND } from '../../../../services/fieldTypeService';

  // Определяем интерфейс для объекта options
  interface FieldOptions {
    FRONTEND_CLASS: typeof FRONTEND.INTEGER;
    name: string;
    label?: string;
    placeholder?: string;
    readonly?: boolean;
    required?: boolean;
    min?: number;
    max?: number;
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
