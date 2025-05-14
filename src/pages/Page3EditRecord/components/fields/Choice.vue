<template>
  <div class="w-full">
    <FloatLabel variant="in">
      <Select
        :id="props.id"
        v-model="value"
        :options="props.options"
        optionLabel="display_name"
        optionValue="value"
        :disabled="props.disabled"
        :required="props.required"
        class="w-full"
      />
      <label :for="props.id">{{ props.label }}</label>
    </FloatLabel>

    <div v-if="props.help_text" class="flex align-items-center justify-content-between mt-1 px-2">
      <Message size="small" severity="secondary" variant="simple" class="flex-grow-1">
        {{ props.help_text }}
      </Message>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import Select from 'primevue/select';
  import FloatLabel from 'primevue/floatlabel';
  import Message from 'primevue/message';

  interface ChoiceOption {
    value: string | number;
    display_name: string;
  }

  const props = defineProps<{
    modelValue?: string | number;
    id: string;
    label: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    options: ChoiceOption[];
    help_text?: string;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number | null): void;
  }>();

  // Используем вычисляемое свойство для двустороннего связывания
  const value = computed({
    get: () => props.modelValue,
    set: (newValue: string | number | null) => {
      emit('update:modelValue', newValue);
    },
  });
</script>

<style scoped></style>
