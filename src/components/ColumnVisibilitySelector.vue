<template>
  <div class="column-visibility-selector">
    <Button
      icon="pi pi-cog"
      class="p-button-rounded p-button-text"
      aria-label="Настройка колонок"
      v-tooltip="'Настройка видимости колонок'"
      @click="toggle"
    />

    <Popover ref="popover">
      <div class="popover-content">
        <div class="popover-header">
          <span>Настройка видимости колонок</span>
        </div>

        <div class="column-selector-content">
          <div class="column-selector-actions">
            <Button label="Выбрать все" class="p-button-sm p-button-text" @click="selectAll" />
            <Button label="Снять выбор" class="p-button-sm p-button-text" @click="deselectAll" />
          </div>

          <div class="column-selector-list">
            <div 
              v-for="field in props.availableFields" 
              :key="field" 
              class="column-selector-item"
            >
              <Checkbox
                v-model="selectedFields"
                :value="field"
                :binary="false"
                :disabled="field === 'id'"
              />
              <label class="column-selector-label">{{ getFieldLabel(field) }}</label>
            </div>
          </div>
        </div>

        <div class="popover-footer">
          <Button
            label="Отмена"
            icon="pi pi-times"
            class="p-button-text p-button-sm"
            @click="cancel"
          />
          <Button label="Применить" icon="pi pi-check" class="p-button-sm" @click="applyChanges" />
        </div>
      </div>
    </Popover>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import Button from 'primevue/button';
  import Checkbox from 'primevue/checkbox';
  import Popover from 'primevue/popover';

  const props = defineProps<{
    availableFields: string[];
    modelValue: string[];
    columnsMetadata?: Record<string, { header: string }>;
  }>();

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void;
  }>();

  const popover = ref();

  // Выбранные поля
  const selectedFields = ref<string[]>([...props.modelValue]);
  const originalSelection = ref<string[]>([]);

  // Обновляем выбранные поля при изменении входных данных
  watch(
    () => props.modelValue,
    (newValue) => {
      selectedFields.value = [...newValue];
    },
  );

  // Функция для открытия/закрытия popover
  const toggle = (event: Event) => {
    // Сохраняем оригинальный выбор для возможности отмены
    originalSelection.value = [...selectedFields.value];
    popover.value.toggle(event);
  };

  // Отмена изменений
  const cancel = () => {
    selectedFields.value = [...originalSelection.value];
    popover.value.hide();
  };

  // Выбрать все поля
  const selectAll = () => {
    selectedFields.value = [...props.availableFields];
  };

  // Снять выбор со всех полей, кроме ID
  const deselectAll = () => {
    selectedFields.value = props.availableFields
      .filter((field) => field === 'id');
  };

  // Применить изменения
  const applyChanges = () => {
    try {
      // Проверяем, что хотя бы одно поле выбрано
      if (selectedFields.value.length === 0) {
        // Если ничего не выбрано, добавляем хотя бы поле ID
        const idField = props.availableFields.find((field) => field === 'id');
        if (idField) {
          selectedFields.value = ['id'];
        }
      }

      // Отправляем обновленный список полей (создаем новый массив)
      emit('update:modelValue', [...selectedFields.value]);
      popover.value.hide();
    } catch (error) {
      console.error('Ошибка при применении изменений:', error);
      popover.value.hide();
    }
  };

  // Получение метки поля из метаданных колонок
  const getFieldLabel = (field: string): string => {
    // Если переданы метаданные колонок, используем заголовок из них
    if (props.columnsMetadata && props.columnsMetadata[field]?.header) {
      return props.columnsMetadata[field].header;
    }
    
    // Используем имя поля как метку, если не удалось получить из метаданных
    return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
  };
</script>

<style scoped>
  .column-visibility-selector {
    display: inline-block;
  }

  .popover-content {
    display: flex;
    flex-direction: column;
    width: 300px;
  }

  .popover-header {
    font-weight: bold;
    padding: 0.5rem;
  }

  .popover-footer {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .column-selector-content {
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
  }

  .column-selector-actions {
    display: flex;
  }

  .column-selector-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
    max-height: 300px;
    padding-right: 0.5rem;
  }

  .column-selector-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .column-selector-item:hover {
    background-color: #f8f9fa;
  }

  .column-selector-label {
    cursor: pointer;
    flex: 1;
  }
</style>
