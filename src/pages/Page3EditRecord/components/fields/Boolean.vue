<template>
  <div>
    <div class="flex align-items-center mb-1">
      <Checkbox
        :id="id"
        v-model="value"
        :binary="true"
        :disabled="disabled"
        :class="{ 'field-modified': props.isModified }"
      />
      <label :for="id" class="ml-2">{{ label }}</label>
    </div>
    <Message
      v-if="help_text"
      size="small"
      severity="secondary"
      variant="simple"
      class="flex-grow-1 ml-8"
    >
      {{ help_text }}
    </Message>
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
    help_text?: string;
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    moduleName: string;
    modelValue?: boolean;
    options: FieldOptions;
    isModified: boolean;
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const disabled = computed(() => props.options.readonly || false);
  const help_text = computed(() => props.options.help_text);

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
