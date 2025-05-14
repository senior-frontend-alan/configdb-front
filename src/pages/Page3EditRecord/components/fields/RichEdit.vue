<template>
  <div class="field-rich-edit">
    <label :for="props.id" class="block mb-1">{{ props.label }}</label>
    <!-- <Editor
      :id="props.id"
      v-model="value"
      :disabled="props.disabled"
      :readonly="props.readonly"
      :style="{ height: '250px' }"
      class="w-full"
    /> -->
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  // import Editor from 'primevue/editor';

  const props = defineProps<{
    modelValue?: string;
    id: string;
    label: string;
    disabled?: boolean;
    readonly?: boolean;
  }>();

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
