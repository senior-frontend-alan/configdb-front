<template>
  <IftaLabel>
    <label :for="field.name">{{ field.label || field.name }}</label>
    <!-- Текстовые поля -->
    <InputText
      v-if="isTextField"
      :id="field.name"
      :value="modelValue"
      @input="(e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)"
      :placeholder="field.placeholder || ''"
      :disabled="field.readonly"
      :required="field.required"
      class="full-width"
    />

    <!-- Числовые поля -->
    <InputNumber
      v-else-if="isNumberField"
      :id="field.name"
      :modelValue="modelValue"
      @update:modelValue="(value) => emit('update:modelValue', value)"
      :placeholder="field.placeholder || ''"
      :disabled="field.readonly"
      :required="field.required"
      :min="field.min"
      :max="field.max"
      class="full-width"
    />

    <!-- Поля с выбором из списка -->
    <Dropdown
      v-else-if="isChoiceField"
      :id="field.name"
      :modelValue="modelValue"
      @update:modelValue="(value) => emit('update:modelValue', value)"
      :options="field.choices || []"
      optionLabel="display_name"
      optionValue="value"
      :placeholder="field.placeholder || 'Выберите значение'"
      :disabled="field.readonly"
      :required="field.required"
      class="full-width"
    />

    <!-- Поля с датой -->
    <Calendar
      v-else-if="isDateField"
      :id="field.name"
      :modelValue="modelValue"
      @update:modelValue="(value) => emit('update:modelValue', value)"
      dateFormat="dd.mm.yy"
      :placeholder="field.placeholder || ''"
      :disabled="field.readonly"
      :required="field.required"
      class="full-width"
    />

    <!-- Поля с датой и временем -->
    <Calendar
      v-else-if="isDateTimeField"
      :id="field.name"
      :modelValue="modelValue"
      @update:modelValue="(value) => emit('update:modelValue', value)"
      dateFormat="dd.mm.yy"
      showTime
      hourFormat="24"
      :placeholder="field.placeholder || ''"
      :disabled="field.readonly"
      :required="field.required"
      class="full-width"
    />

    <!-- Поля с временем -->
    <Calendar
      v-else-if="isTimeField"
      :id="field.name"
      :modelValue="modelValue"
      @update:modelValue="(value) => emit('update:modelValue', value)"
      timeOnly
      hourFormat="24"
      :placeholder="field.placeholder || ''"
      :disabled="field.readonly"
      :required="field.required"
      class="full-width"
    />

    <!-- Чекбоксы -->
    <Checkbox
      v-else-if="isBooleanField"
      :id="field.name"
      :modelValue="modelValue"
      @update:modelValue="(value) => emit('update:modelValue', value)"
      :binary="true"
      :disabled="field.readonly"
    />

    <!-- Поля с богатым редактором -->
    <Textarea
      v-else-if="isRichEditField"
      :id="field.name"
      :modelValue="modelValue"
      @update:modelValue="(value) => emit('update:modelValue', value)"
      :rows="5"
      :placeholder="field.placeholder || ''"
      :disabled="field.readonly"
      :required="field.required"
      class="full-width"
    />

    <!-- Связанные поля (выбор из другой таблицы) -->
    <Dropdown
      v-else-if="isRelatedField"
      :id="field.name"
      :modelValue="modelValue"
      @update:modelValue="(value) => emit('update:modelValue', value)"
      :options="relatedOptions"
      optionLabel="display_name"
      optionValue="value"
      :placeholder="field.placeholder || 'Выберите значение'"
      :disabled="field.readonly"
      :required="field.required"
      :loading="loadingRelatedOptions"
      @focus="loadRelatedOptions"
      class="full-width"
    />

    <!-- Файловые поля -->
    <FileUpload
      v-else-if="isFileField"
      :id="field.name"
      mode="basic"
      :name="field.name"
      :disabled="field.readonly"
      :required="field.required"
      accept="*/*"
      :maxFileSize="10000000"
      @select="onFileSelect"
      @clear="onFileClear"
    />

    <!-- Поле по умолчанию (если тип не определен) -->
    <InputText
      v-else
      :id="field.name"
      :value="modelValue"
      @input="(e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)"
      :placeholder="field.placeholder || ''"
      :disabled="field.readonly"
      :required="field.required"
      class="full-width"
    />
  </IftaLabel>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import InputText from 'primevue/inputtext';
  import InputNumber from 'primevue/inputnumber';
  import Dropdown from 'primevue/dropdown';
  import Calendar from 'primevue/calendar';
  import Checkbox from 'primevue/checkbox';
  import Textarea from 'primevue/textarea';
  import FileUpload from 'primevue/fileupload';
  import IftaLabel from 'primevue/iftalabel';
  import { FIELD_TYPES } from '../utils/formatter';

  const props = defineProps<{
    field: {
      name: string;
      type: string;
      class_name?: string;
      field_class?: string;
      readonly?: boolean;
      required?: boolean;
      placeholder?: string;
      choices?: Array<{ value: string | number; display_name: string }>;
      min?: number;
      max?: number;
      related_model?: string;
      related_url?: string;
      label?: string;
    };
    modelValue: any;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void;
  }>();

  // Определение типа поля на основе class_name или field_class
  const fieldType = computed(() => {
    const { class_name, field_class } = props.field;
    return class_name || field_class || '';
  });

  // Проверки для разных типов полей
  const isTextField = computed(() => {
    return (
      fieldType.value === FIELD_TYPES.LAYOUT_CHAR_FIELD ||
      fieldType.value === FIELD_TYPES.CHAR_FIELD ||
      props.field.type === 'text'
    );
  });

  const isNumberField = computed(() => {
    return (
      fieldType.value === FIELD_TYPES.LAYOUT_INTEGER_FIELD ||
      fieldType.value === FIELD_TYPES.INTEGER_FIELD ||
      fieldType.value === FIELD_TYPES.DECIMAL_FIELD ||
      props.field.type === 'number'
    );
  });

  const isChoiceField = computed(() => {
    return (
      fieldType.value === FIELD_TYPES.LAYOUT_CHOICE_FIELD ||
      fieldType.value === FIELD_TYPES.CHOICE_FIELD ||
      props.field.type === 'select'
    );
  });

  const isDateField = computed(() => {
    return fieldType.value === FIELD_TYPES.DATE_FIELD || props.field.type === 'date';
  });

  const isDateTimeField = computed(() => {
    return fieldType.value === FIELD_TYPES.DATE_TIME_FIELD || props.field.type === 'datetime';
  });

  const isTimeField = computed(() => {
    return fieldType.value === FIELD_TYPES.TIME_FIELD || props.field.type === 'time';
  });

  const isBooleanField = computed(() => {
    return (
      fieldType.value === 'BooleanField' ||
      fieldType.value === 'NullBooleanField' ||
      props.field.type === 'checkbox'
    );
  });

  const isRichEditField = computed(() => {
    return (
      fieldType.value === FIELD_TYPES.LAYOUT_RICH_EDIT_FIELD || props.field.type === 'textarea'
    );
  });

  const isRelatedField = computed(() => {
    return (
      fieldType.value === FIELD_TYPES.LAYOUT_RELATED_FIELD ||
      fieldType.value === FIELD_TYPES.PRIMARY_KEY_RELATED_FIELD ||
      props.field.type === 'related'
    );
  });

  const isFileField = computed(() => {
    return props.field.type === 'file';
  });

  // Для связанных полей
  const relatedOptions = ref<Array<{ value: string | number; display_name: string }>>([]);
  const loadingRelatedOptions = ref(false);

  // Загрузка опций для связанных полей
  const loadRelatedOptions = async () => {
    if (!isRelatedField.value || !props.field.related_url) return;

    try {
      loadingRelatedOptions.value = true;

      // Здесь должен быть запрос к API для получения связанных данных
      // Пример:
      // const response = await fetch(props.field.related_url);
      // const data = await response.json();
      // relatedOptions.value = data.map(item => ({
      //   value: item.id,
      //   display_name: item.name || item.title || item.id
      // }));

      // Временная заглушка
      setTimeout(() => {
        relatedOptions.value = [
          { value: 1, display_name: 'Опция 1' },
          { value: 2, display_name: 'Опция 2' },
          { value: 3, display_name: 'Опция 3' },
        ];
        loadingRelatedOptions.value = false;
      }, 500);
    } catch (error) {
      console.error('Ошибка при загрузке связанных опций:', error);
      loadingRelatedOptions.value = false;
    }
  };

  // Обработчики для файловых полей
  const onFileSelect = (event: any) => {
    const file = event.files[0];
    emit('update:modelValue', file);
  };

  const onFileClear = () => {
    emit('update:modelValue', null);
  };
</script>

<style scoped>
  .full-width {
    width: 100%;
  }
</style>
