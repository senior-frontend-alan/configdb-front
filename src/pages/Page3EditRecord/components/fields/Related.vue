<!-- Отображаем как выпадающий список с полем name -->
<template>
  <div class="w-full">
    <FloatLabel variant="in">
      <Select
        :id="props.id"
        v-model="selectedValue"
        :options="formattedOptions"
        optionLabel="name"
        optionValue="id"
        :disabled="props.disabled"
        :required="props.required"
        class="w-full"
      />
      <label :for="props.id">{{ props.label }}</label>
    </FloatLabel>

    <div v-if="props.help_text" class="flex align-items-center justify-content-between mt-1">
      <Message size="small" severity="secondary" variant="simple" class="flex-grow-1">
        {{ props.help_text }}
      </Message>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, withDefaults } from 'vue';
  import Select from 'primevue/select';
  import FloatLabel from 'primevue/floatlabel';
  import Message from 'primevue/message';

  interface RelatedItem {
    id: number | string;
    name: string;
  }

  interface ChoiceOption {
    value: string | number;
    display_name: string;
  }

  const props = withDefaults(
    defineProps<{
      modelValue?: RelatedItem | number | string | null;
      id: string;
      label: string;
      disabled?: boolean;
      required?: boolean;
      options?: ChoiceOption[];
      help_text?: string;
    }>(),
    {
      options: () => [],
    },
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', value: RelatedItem | number | string | null): void;
  }>();

  // Преобразуем options в формат, подходящий для Dropdown
  const formattedOptions = computed(() => {
    return props.options.map((option) => ({
      id: option.value,
      name: option.display_name,
    }));
  });

  // Получаем текущее значение id из modelValue
  const getCurrentId = (): number | string | null => {
    if (!props.modelValue) return null;

    // Если массив, возвращаем null (пустое значение)
    if (Array.isArray(props.modelValue)) return null;

    // Если объект с id
    if (
      typeof props.modelValue === 'object' &&
      props.modelValue !== null &&
      'id' in props.modelValue
    ) {
      return props.modelValue.id;
    }

    // Если просто id (число или строка)
    return props.modelValue;
  };

  // Используем вычисляемое свойство для двустороннего связывания
  const selectedValue = computed({
    get: () => getCurrentId(),
    set: (newId: number | string | null) => {
      if (newId === null) {
        emit('update:modelValue', null);
        return;
      }

      // Находим соответствующий объект в options
      const selectedOption = formattedOptions.value.find((option) => option.id === newId);

      if (selectedOption) {
        // Возвращаем объект с id и name
        emit('update:modelValue', {
          id: newId,
          name: selectedOption.name,
        });
      } else {
        // Если объект не найден, возвращаем просто id
        emit('update:modelValue', newId);
      }
    },
  });
</script>

<style scoped></style>
