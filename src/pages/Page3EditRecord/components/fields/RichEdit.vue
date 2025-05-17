<template>
  <div class="field-rich-edit">
    <label :for="id" class="block mb-1">{{ label }}</label>
    <!-- <Editor
      :id="id"
      v-model="value"
      :disabled="disabled"
      :readonly="readonly"
      :style="{ height: '250px' }"
      class="w-full"
    /> -->
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  // import Editor from 'primevue/editor';

  // Определяем интерфейс для объекта options
  interface FieldOptions {
    name: string;
    label?: string;
    readonly?: boolean;
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    modelValue?: string;
    options: FieldOptions;
  }>();
  
  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const disabled = computed(() => props.options.readonly || false);
  const readonly = computed(() => props.options.readonly || false);

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
  }>();

  const value = ref(props.modelValue || '');

  // Обновляем локальное значение при изменении props.modelValue
  watch(
    () => props.modelValue,
    (newValue) => {
      value.value = newValue || '';
    },
  );

  // Отправляем событие при изменении локального значения
  watch(value, (newValue) => {
    emit('update:modelValue', newValue);
  });
</script>

<style scoped>
  .field-rich-edit {
    margin-bottom: 1rem;
  }
</style>
