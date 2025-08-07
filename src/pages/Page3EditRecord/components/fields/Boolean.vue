<template>
  <div>
    <div class="flex align-items-center mb-1">
      <Checkbox
        :class="{ 'field-modified': isModified }"
        :id="id"
        v-model="value"
        :binary="true"
        :disabled="disabled"
        :required="required"
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

  interface FieldOptions {
    name: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    help_text?: string;
  }

  const props = defineProps<{
    options: FieldOptions;
    originalValue?: boolean;
    draftValue?: boolean;
    updateField?: (newValue: boolean) => void;
  }>();

  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const disabled = computed(() => props.options.disabled || false);
  const required = computed(() => props.options.required || false);
  const help_text = computed(() => props.options.help_text);

  // Проверяем, изменено ли поле (сравниваем draft и original)
  const isModified = computed(() => {
    // Нормализуем значения - undefined трактуем как false для boolean полей
    // При создании новой записи у нас поля undefined и мы не должны их подсвечивать как измененные
    const normalizedDraft = props.draftValue ?? false;
    const normalizedOriginal = props.originalValue ?? false;

    // Сравниваем нормализованные значения
    return normalizedDraft !== normalizedOriginal;
  });

  // Используем вычисляемое свойство для двустороннего связывания
  const value = computed({
    get: () => {
      // Используем только draftValue (полная копия)
      return props.draftValue ?? false;
    },
    set: (newValue: boolean) => {
      props.updateField?.(newValue);
    },
  });
</script>

<style scoped>
  .field-boolean {
    display: flex;
    align-items: center;
  }
</style>
