<template>
  <div class="w-full">
    <InputGroup :class="{ 'field-modified': isModified }">
      <FloatLabel variant="in">
        <InputText
          :id="id"
          v-model="value"
          :disabled="disabled"
          :required="required"
          :placeholder="placeholder"
          class="w-full"
          :maxlength="max_length"
          :data-testid="`char-field-${props.options.name}`"
        />
        <label :for="id">{{ label }}</label>
      </FloatLabel>
      <InputGroupAddon v-if="isModified">
        <i
          class="pi pi-undo cursor-pointer text-color-secondary hover:text-primary transition-colors"
          @click="resetField"
          v-tooltip="'Сбросить к исходному значению'"
        />
      </InputGroupAddon>
    </InputGroup>
    <div class="flex align-items-center justify-content-end mt-1">
      <Message
        v-if="help_text"
        size="small"
        severity="secondary"
        variant="simple"
        class="flex-grow-1"
      >
        {{ help_text }}
      </Message>
      <small v-if="max_length" class="text-secondary ml-2">
        {{ value ? value.length : 0 }}/{{ max_length }}
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, useId } from 'vue';
  import InputText from 'primevue/inputtext';
  import FloatLabel from 'primevue/floatlabel';
  import Message from 'primevue/message';
  import InputGroup from 'primevue/inputgroup';
  import InputGroupAddon from 'primevue/inputgroupaddon';
  import { FRONTEND } from '../../../../services/fieldTypeService';

  // Определяем интерфейс для объекта options
  interface FieldOptions {
    FRONTEND_CLASS: typeof FRONTEND.CHAR;
    name: string;
    label?: string;
    placeholder?: string;
    readonly?: boolean;
    required?: boolean;
    help_text?: string;
    max_length?: number;
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    options: FieldOptions;
    originalValue?: any;
    draftValue?: any;
    updateField?: (newValue: any) => void;
  }>();

  // Автоматически генерируем уникальный id для каждого компонента
  const id = useId();
  const label = computed(
    () => (props.options.label || props.options.name) + (required.value ? ' *' : ''),
  );
  const placeholder = computed(() => props.options.placeholder || '');
  const disabled = computed(() => props.options.readonly || false);
  const required = computed(() => props.options.required || false);
  const help_text = computed(() => props.options.help_text);
  const max_length = computed(() => props.options.max_length);

  const originalValue = computed(() => {
    return props.originalValue;
  });

  const draftValue = computed(() => {
    return props.draftValue;
  });

  // Проверяем, изменено ли поле
  const isModified = computed(() => {
    const draft = draftValue.value;
    const original = originalValue.value;

    // Если нет draft значения, поле не изменено
    if (draft === undefined) return false;

    // Сравниваем значения (приводим к строкам для точного сравнения)
    return String(original ?? '') !== String(draft ?? '');
  });

  const resetField = () => {
    props.updateField?.(originalValue.value);
  };

  let debounceTimer: NodeJS.Timeout | null = null;

  const debouncedUpdateField = (newValue: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      props.updateField?.(newValue);
    }, 300);
  };

  const value = computed({
    get: () => {
      // Используем только draftValue (полная копия)
      const result = draftValue.value == null ? '' : String(draftValue.value);
      return result;
    },
    set: debouncedUpdateField,
  });
</script>

<style scoped>
  /* Используются общие стили из Page3EditRecord/index.vue */
</style>
