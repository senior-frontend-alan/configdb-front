<template>
  <div class="field-boolean">
    <Checkbox
      :id="id"
      v-model="value"
      :binary="true"
      :disabled="disabled"
      :class="{ 'input-modified': props.isModified }"
    />
    <label :for="id" class="ml-2">{{ label }}</label>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import Checkbox from 'primevue/checkbox';

  // Определяем интерфейс для объекта options
  interface FieldOptions {
    name: string;
    label?: string;
    readonly?: boolean;
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    modelValue?: boolean;
    options: FieldOptions;
    isModified?: boolean;
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const disabled = computed(() => props.options.readonly || false);

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
  }>();

  // Используем вычисляемое свойство для двустороннего связывания
  const value = computed({
    get: () => props.modelValue ?? false, // Используем нулевое слияние для проверки null и undefined
    set: (newValue: boolean) => {
      emit('update:modelValue', newValue);
    },
  });
</script>

<style scoped>
  .field-boolean {
    display: flex;
    align-items: center;
  }
</style>
