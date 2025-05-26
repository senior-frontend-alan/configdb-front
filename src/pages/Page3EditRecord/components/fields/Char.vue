<template>
  <div class="w-full">
    <FloatLabel variant="in" v-if="!hasTypeError">
      <InputText
        :id="id"
        v-model="value"
        :class="{ 'p-invalid': hasTypeError, 'input-modified': props.isModified }"
        :disabled="disabled"
        :required="required"
        :placeholder="placeholder"
        class="w-full"
        :maxlength="max_length"
      />
      <label :for="id">{{ label }}</label>
    </FloatLabel>

    <small v-if="hasTypeError"
      >{{ label }}: Неверный тип данных (получен {{ typeof props.modelValue }}:
      {{ JSON.stringify(props.modelValue) }})</small
    >
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
  import { ref, computed } from 'vue';
  import InputText from 'primevue/inputtext';
  import FloatLabel from 'primevue/floatlabel';

  // Определяем интерфейс для объекта options
  interface FieldOptions {
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
    modelValue?: any; // !!!Вообще должно быть String но Vue проверяет типы пропсов перед отрисовкой и выводит ошибку в консоль если там не String
    options: FieldOptions;
    isModified?: boolean;
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => (props.options.label || props.options.name) + (required.value ? ' *' : ''));
  const placeholder = computed(() => props.options.placeholder || '');
  const disabled = computed(() => props.options.readonly || false);
  const required = computed(() => props.options.required || false);
  const help_text = computed(() => props.options.help_text);
  const max_length = computed(() => props.options.max_length);

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
  }>();

  // Проверка типа данных
  const hasTypeError = ref(false);

  // Используем вычисляемое свойство для двустороннего связывания
  const value = computed({
    // Геттер - получаем значение из props
    get: () => {
      // Проверяем тип данных
      if (props.modelValue === null || props.modelValue === undefined) {
        hasTypeError.value = false;
        return '';
      } else if (typeof props.modelValue === 'string') {
        hasTypeError.value = false;
        return props.modelValue;
      } else {
        // Если тип не строка, выводим ошибку в консоль
        console.error(
          `Ошибка типа в компоненте Char (${id.value}): ожидалась строка, получено:`,
          typeof props.modelValue,
          props.modelValue,
        );
        // Сохраняем информацию об ошибке для отображения в интерфейсе
        hasTypeError.value = true;
        return '';
      }
    },
    // Сеттер - отправляем событие при изменении
    set: (newValue: string) => {
      emit('update:modelValue', newValue);
    },
  });
</script>

<style scoped>
  /* Используются общие стили из Page3EditRecord/index.vue */
</style>
