<template>
  <FloatLabel variant="in">
    <Dropdown
      :id="props.id"
      v-model="value"
      variant="filled"
      :options="props.options"
      optionValue="id"
      :disabled="props.disabled"
      :required="props.required"
      :placeholder="props.placeholder || 'Выберите значение'"
      :filter="true"
      :virtualScrollerOptions="{ itemSize: 38 }"
      class="w-full"
    />
    <label :for="props.id">{{ props.label }}</label>
  </FloatLabel>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import Dropdown from 'primevue/dropdown';
  import FloatLabel from 'primevue/floatlabel';

  interface RelatedItem {
    id: number | string;
    [key: string]: any;
  }

  const props = defineProps<{
    modelValue?: number | string | null;
    id: string;
    label: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    options: RelatedItem[];
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: number | string | null): void;
  }>();

  const value = ref(props.modelValue);

  // Обновляем локальное значение при изменении props.modelValue
  watch(
    () => props.modelValue,
    (newValue) => {
      value.value = newValue;
    },
  );

  // Отправляем событие при изменении локального значения
  watch(value, (newValue) => {
    emit('update:modelValue', newValue);
  });
</script>

<style scoped>
  /* При необходимости можно добавить дополнительные стили */
</style>
