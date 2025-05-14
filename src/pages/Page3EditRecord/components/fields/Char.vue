<template>
  <div class="w-full">
    <FloatLabel variant="in" v-if="!hasTypeError">
      <InputText
        :id="props.id"
        v-model="value"
        :disabled="props.disabled"
        :required="props.required"
        :placeholder="props.placeholder"
        class="w-full"
        :maxlength="props.max_length"
      />
      <label :for="props.id">{{ props.label }}</label>
    </FloatLabel>

    <div class="flex align-items-center justify-content-between mt-1">
      <Message
        v-if="props.help_text"
        size="small"
        severity="secondary"
        variant="simple"
        class="flex-grow-1"
      >
        {{ props.help_text }}
      </Message>
      <small v-if="props.max_length" class="text-secondary ml-2">
        {{ value ? value.length : 0 }}/{{ props.max_length }}
      </small>
    </div>

    <div v-if="hasTypeError" class="p-error w-full">
      <small>{{ props.label }}: Неверный тип данных</small>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import InputText from 'primevue/inputtext';
  import FloatLabel from 'primevue/floatlabel';

  const props = defineProps<{
    modelValue?: any; // !!!Вообще должно быть String но Vue проверяет типы пропсов перед отрисовкой и выводит ошибку в консоль если там не String
    id: string;
    label: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    help_text?: string;
    max_length?: number;
  }>();

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
          `Ошибка типа в компоненте Char (${props.id}): ожидалась строка, получено:`,
          typeof props.modelValue,
          props.modelValue,
        );
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
  /* Используются общие стили из utility.css */
</style>
