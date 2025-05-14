<template>
  <div class="field-boolean">
    <Checkbox 
      :id="props.id" 
      v-model="value" 
      :binary="true"
      :disabled="props.disabled"
    />
    <label :for="props.id" class="ml-2">{{ props.label }}</label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Checkbox from 'primevue/checkbox';

const props = defineProps<{
  modelValue?: boolean;
  id: string;
  label: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

// Используем вычисляемое свойство для двустороннего связывания
const value = computed({
  get: () => props.modelValue ?? false, // Используем нулевое слияние для проверки null и undefined
  set: (newValue: boolean) => {
    emit('update:modelValue', newValue);
  }
});
</script>

<style scoped>
.field-boolean {
  display: flex;
  align-items: center;
}
</style>
