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
      :class="{ 'field-modified': props.isModified }"
      integerOnly
    />
    <label :for="id">{{ label }}</label>
  </FloatLabel>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import InputNumber from 'primevue/inputnumber';
  import FloatLabel from 'primevue/floatlabel';

  // Определяем интерфейс для объекта options
  interface FieldOptions {
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
    modelValue?: number;
    options: FieldOptions;
    isModified: boolean;
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const placeholder = computed(() => props.options.placeholder || '');
  const disabled = computed(() => props.options.readonly || false);
  const required = computed(() => props.options.required || false);
  const min = computed(() => props.options.min);
  const max = computed(() => props.options.max);

  const emit = defineEmits<{
    (e: 'update:modelValue', value: number | null | undefined): void;
  }>();

  // Используем вычисляемое свойство для двустороннего связывания
  const value = computed({
    get: () => props.modelValue,
    set: (newValue: number | null | undefined) => {
      emit('update:modelValue', newValue);
    },
  });
</script>

<style scoped>
  .w-full {
    width: 100%;
  }
</style>
