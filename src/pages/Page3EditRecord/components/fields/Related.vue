<!-- Отображаем как выпадающий список с полем name -->
<template>
  <div class="w-full">
    <FloatLabel variant="in">
      <Select
        :id="id"
        v-model="selectedValue"
        :options="formattedOptions"
        optionLabel="name"
        optionValue="id"
        :disabled="disabled"
        :required="required"
        class="w-full"
        :class="{ 'input-modified': props.isModified }"
      />
      <label :for="id">{{ label }}</label>
    </FloatLabel>

    <div v-if="help_text" class="flex align-items-center justify-content-between mt-1">
      <Message size="small" severity="secondary" variant="simple" class="flex-grow-1">
        {{ help_text }}
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

  // Определяем интерфейс для объекта options
  interface FieldOptions {
    name: string;
    label?: string;
    readonly?: boolean;
    required?: boolean;
    help_text?: string;
    choices?: ChoiceOption[];
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = withDefaults(
    defineProps<{
      modelValue?: RelatedItem | number | string | null;
      options: FieldOptions;
      isModified?: boolean;
    }>(),
    {
      modelValue: null,
      isModified: false,
    },
  );

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const disabled = computed(() => props.options.readonly || false);
  const required = computed(() => props.options.required || false);
  const help_text = computed(() => props.options.help_text);
  const choiceOptions = computed(() => props.options.choices || []);

  const emit = defineEmits<{
    (e: 'update:modelValue', value: RelatedItem | number | string | null): void;
  }>();

  // Преобразуем options в формат, подходящий для Dropdown
  const formattedOptions = computed(() => {
    return choiceOptions.value.map((option) => ({
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
