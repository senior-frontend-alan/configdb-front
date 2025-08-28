<!-- Отображаем как выпадающий список с полем name -->
<!-- выпадающие списки связанных объектов -->
<template>
  <div class="w-full">
    <FloatLabel variant="in">
      <Select
        v-model="selectedValue"
        :options="formattedOptions"
        optionLabel="name"
        optionValue="id"
        :disabled="disabled"
        :required="required"
        class="w-full"
        :class="{ 'field-modified': isModified }"
        :data-testid="`${FRONTEND.RELATED}-field-${props.options.name}`"
      />
      <label>{{ label }}</label>
    </FloatLabel>

    <div v-if="help_text" class="flex align-items-center justify-content-between mt-1">
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
    FRONTEND_CLASS: typeof FRONTEND.RELATED;
    name: string;
    label?: string;
    readonly?: boolean;
    required?: boolean;
    help_text?: string;
    choices?: ChoiceOption[];
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    options: FieldOptions;
    // Пропсы от DynamicLayout
    originalValue?: any;
    draftValue?: any;
    updateField?: (newValue: any) => void;
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const label = computed(() => props.options.label || props.options.name);
  const disabled = computed(() => props.options.readonly || false);
  const required = computed(() => props.options.required || false);
  const help_text = computed(() => props.options.help_text);
  const choiceOptions = computed(() => props.options.choices || []);

  const originalValue = computed(() => {
    return props.originalValue;
  });

  const draftValue = computed(() => {
    return props.draftValue;
  });

  // Из {"id":3,"name":"Planned"} → 3
  // Из {"id":4,"name":"Testing"} → 4
  // Проверяем, изменено ли поле (сравниваем оригинал и draft)
  const isModified = computed(() => {
    const draft = draftValue.value;
    const original = originalValue.value;

    // Если нет draft значения, поле не изменено
    if (draft === undefined) return false;

    // Для объектов сравниваем по id, для примитивов - напрямую
    const getValue = (val: any) => val?.id ?? val;
    return getValue(original) !== getValue(draft);
  });

  // Преобразуем options в формат, подходящий для Dropdown
  const formattedOptions = computed(() => {
    return choiceOptions.value.map((option) => ({
      id: option.value,
      name: option.display_name,
    }));
  });

  const getCurrentId = (): number | string | null => {
    const actualValue = draftValue.value;
    if (!actualValue) return null;

    // Если массив, возвращаем null (пустое значение)
    if (Array.isArray(actualValue)) return null;

    // Если объект с id
    if (typeof actualValue === 'object' && actualValue !== null && 'id' in actualValue) {
      return actualValue.id;
    }

    // Если просто id (число или строка)
    return actualValue;
  };

  const handleFieldUpdate = (newId: number | string | null) => {
    let valueToStore: any = null;

    if (newId !== null) {
      // Находим соответствующий объект в options
      const selectedOption = formattedOptions.value.find((option) => option.id === newId);

      if (selectedOption) {
        // Сохраняем объект с id и name
        valueToStore = {
          id: newId,
          name: selectedOption.name,
        };
      } else {
        // Если объект не найден, сохраняем просто id
        valueToStore = newId;
      }
    }

    props.updateField?.(valueToStore);
  };

  const selectedValue = computed({
    get: () => getCurrentId(),
    set: handleFieldUpdate,
  });
</script>

<style scoped></style>
