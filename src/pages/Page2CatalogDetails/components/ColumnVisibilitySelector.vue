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
        <Button
          :icon="isTableScrollable ? 'pi pi-arrows-h' : 'pi pi-table'"
          class="p-button-rounded p-button-text"
          aria-label="Переключить режим ширины"
          v-tooltip="
            isTableScrollable
              ? 'Отключить горизонтальную прокрутку'
              : 'Включить горизонтальную прокрутку'
          "
          @click="toggleTableScrollable"
          label="Включить горизонтальную прокрутку"
        />
        <div class="popover-header">
          <span>Настройка видимости колонок</span>
        </div>

        <div class="column-selector-content">
          <div class="column-selector-actions">
            <Button label="Выбрать все" class="p-button-sm p-button-text" @click="selectAll" />
            <Button label="Снять выбор" class="p-button-sm p-button-text" @click="deselectAll" />
          </div>

          <div class="column-selector-list">
            <div v-for="field in availableFields" :key="field" class="column-selector-item">
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
  import { ref, onMounted, computed } from 'vue';
  import Button from 'primevue/button';
  import Checkbox from 'primevue/checkbox';
  import Popover from 'primevue/popover';

  const props = defineProps<{
    tableColumns?: Map<string, any>;
    isTableScrollable?: boolean;
  }>();
  
  const TABLE_COLUMNS = computed(() => props.tableColumns);

  const emit = defineEmits<{
    (e: 'update-column-visibility', fieldName: string, isVisible: boolean): void;
    (e: 'toggle-table-scrollable'): void;
  }>();

  const popover = ref();

  // Выбранные поля
  const selectedFields = ref<string[]>([]);
  const availableFields = ref<string[]>([]);

  // Инициализируем выбранные поля и доступные поля на основе tableColumns
  onMounted(() => {
    initializeFields();
  });

  // Функция для инициализации полей из tableColumns
  function initializeFields() {
    // Если нет колонок, ничего не делаем
    if (!TABLE_COLUMNS.value || TABLE_COLUMNS.value.size === 0) {
      return;
    }

    // Инициализируем поля из TABLE_COLUMNS
    const allFields: string[] = [];
    const visibleFields: string[] = [];

    TABLE_COLUMNS.value.forEach((column: any, key: string) => {
      allFields.push(key);
      if (column.VISIBLE) {
        visibleFields.push(key);
      }
    });

    availableFields.value = allFields;
    console.log('!!!!availableFields.value', availableFields.value);
    selectedFields.value = [...visibleFields];
  };

  // Функция для открытия/закрытия popover
  const toggle = (event: Event) => {
    popover.value.toggle(event);
  };

  // Отмена изменений
  const cancel = () => {
    popover.value.hide();
  };

  // Выбрать все поля
  const selectAll = () => {
    selectedFields.value = [...availableFields.value];
  };

  // Снять выбор со всех полей, кроме ID
  const deselectAll = () => {
    selectedFields.value = availableFields.value.filter((field) => field === 'id');
  };

  // Применить изменения
  const applyChanges = () => {
    try {
      // Проверяем, что хотя бы одно поле выбрано
      if (selectedFields.value.length === 0) {
        // Если ничего не выбрано, добавляем хотя бы поле ID
        const idField = availableFields.value.find((field) => field === 'id');
        if (idField) {
          selectedFields.value = ['id'];
        }
      }

      // Проходим по всем полям и применяем изменения
    if (TABLE_COLUMNS.value) {
      TABLE_COLUMNS.value.forEach((column: any, key: string) => {
          if (column) {
            // Устанавливаем VISIBLE в зависимости от того, выбрано ли поле
            column.VISIBLE = selectedFields.value.includes(key);
          }
        });
      }

      // Обновляем видимость колонок через emit
      availableFields.value.forEach((field) => {
        emit('update-column-visibility', field, selectedFields.value.includes(field));
      });

      popover.value.hide();
    } catch (error) {
      console.error('Ошибка при применении изменений:', error);
      popover.value.hide();
    }
  };

  // Функция для переключения режима прокрутки таблицы
  const toggleTableScrollable = () => {
    emit('toggle-table-scrollable');
  };

  // Получение метки поля из метаданных колонок
  function getFieldLabel(field: string): string {
    // Получаем метку поля из метаданных колонок
    if (TABLE_COLUMNS.value && TABLE_COLUMNS.value.has(field)) {
      const column = TABLE_COLUMNS.value.get(field);
      const label = column?.label || field;
      const frontendClass = column?.FRONTEND_CLASS || '';
      return `${label} [${frontendClass}]`;
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
