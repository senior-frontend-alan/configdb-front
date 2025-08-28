<template>
  <div class="w-full">
    <FloatLabel variant="in">
      <Select
        :id="id"
        v-model="value"
        :options="choiceOptions"
        optionLabel="display_name"
        optionValue="value"
        :disabled="disabled"
        :required="required"
        class="w-full"
        :class="{ 'field-modified': isModified }"
        :data-testid="`${FRONTEND.CHOICE}-field-${props.options.name}`"
      />
      <label :for="id">{{ label }}</label>
    </FloatLabel>

    <div v-if="help_text" class="flex align-items-center justify-content-between mt-1 px-2">
      <Message size="small" severity="secondary" variant="simple" class="flex-grow-1">
        {{ help_text }}
      </Message>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import Select from 'primevue/select';
  import FloatLabel from 'primevue/floatlabel';
  import Message from 'primevue/message';
  import { FRONTEND } from '../../../../services/fieldTypeService';

  interface ChoiceOption {
    value: string | number;
    display_name: string;
  }

  // Определяем интерфейс для объекта options
  interface FieldOptions {
    FRONTEND_CLASS: typeof FRONTEND.CHOICE;
    name: string;
    label?: string;
    placeholder?: string;
    readonly?: boolean;
    required?: boolean;
    help_text?: string;
    choices?: ChoiceOption[];
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    originalValue?: string | number;
    draftValue?: string | number;
    options: FieldOptions;
    updateField: (newValue: any) => void;
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const disabled = computed(() => props.options.readonly || false);
  const required = computed(() => props.options.required || false);
  const help_text = computed(() => props.options.help_text);
  const choiceOptions = computed(() => props.options.choices || []);

  const isModified = computed(() => {
    // Если нет draft значения, поле не изменено
    if (props.draftValue === undefined) return false;

    return props.draftValue !== props.originalValue;
  });

  // Используем вычисляемое свойство для двустороннего связывания
  const value = computed({
    get: () => props.draftValue, // Всегда показываем только draftValue
    set: (newValue: string | number | null) => props.updateField(newValue),
  });
</script>

<style scoped></style>
