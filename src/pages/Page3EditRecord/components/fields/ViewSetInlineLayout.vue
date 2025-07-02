<!-- Отображаем как таблицу -->
<!-- 
  Согласно принципу разделения ответственности:
  1. Родительский компонент отвечает за загрузку данных
  2. Компонент ViewSetInlineLayout отвечает за подготовку данных из пропсов
  3. Компонент DataTable отвечает только за отображение данных

  DynamicLayout отвечает только за отображение формы
ViewSetInlineLayout управляет состоянием и данными
-->
<template>
  <div class="mb-1 p-2 border rounded-lg" :class="{ 'field-modified': props.isModified }">
    <div v-if="!props.options?.TABLE_COLUMNS" class="empty-container">
      <Message severity="info">Нет колонок для отображения</Message>
    </div>

    <div v-else>
      <div class="flex align-items-center justify-content-between mb-2">
        <div class="flex align-items-center gap-2">
          <label :for="fieldId" :style="{ color: 'var(--p-floatlabel-color)' }">
            {{ fieldLabel }}
          </label>
          <Button
            icon="pi pi-plus"
            class="p-button-sm p-button-outlined p-button-icon"
            @click="openAddDialog"
            v-tooltip="'Добавить запись'"
          />
          <Button
            icon="pi pi-undo"
            class="p-button-sm p-button-outlined p-button-icon"
            :disabled="!props.isModified"
            @click="resetField"
            v-tooltip="'Отменить изменения'"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-sm p-button-outlined p-button-icon"
            size="small"
            @click="clearField"
            v-tooltip="'Удалить запись'"
          />
          <Button
            icon="pi pi-copy"
            class="p-button-sm p-button-outlined p-button-icon"
            size="small"
            :disabled="selectedItems.length !== 1"
            @click="duplicateSelectedRow"
            v-tooltip="'Дублировать запись'"
          />
        </div>

        <div>
          <div class="flex align-items-center gap-2">
            <span class="text-secondary">
              {{ rowCountDisplay }}
            </span>
            <ColumnVisibilitySelector
              :table-columns="props.options?.TABLE_COLUMNS"
              :is-table-scrollable="isTableScrollable"
              @toggle-table-scrollable="isTableScrollable = !isTableScrollable"
            />
          </div>
        </div>
      </div>

      <CatalogDataTable
        :tableRows="props.modelValue || []"
        :tableColumns="props.options?.TABLE_COLUMNS || new Map()"
        :primaryKey="props.options?.primary_key || 'id'"
        selectionMode="multiple"
        :selectedItems="selectedItems"
        :isTableScrollable="isTableScrollable"
        @row-click="handleRowClick"
        @update:selectedItems="handleSelectedItemsChange"
      />
    </div>

    <div v-if="props.help_text" class="flex align-items-center justify-content-between mt-1">
      <Message size="small" severity="secondary" variant="simple" class="flex-grow-1">
        {{ props.help_text }}
      </Message>
    </div>
  </div>

  <!-- Модальное окно для добавления записи -->
  <Dialog
    v-model:visible="dialogVisible"
    :style="{ width: '80vw' }"
    :modal="true"
    maximizable
    :closable="true"
    @hide="closeDialog"
  >
    <template #header>
      <div class="dialog-header-container">
        <span class="dialog-title">{{ dialogTitle }}</span>
      </div>
    </template>

    <div v-if="error" class="p-4 text-center">
      <Message severity="error" :life="5000">{{ error }}</Message>
    </div>
    <div v-else class="catalog-details-container">
      <!-- Используем компонент DynamicLayout для редактирования записи -->
      <DynamicLayout
        v-if="props.options?.elementsIndex"
        :layout-elements="props.options.elementsIndex"
        :model-value="newRecord"
        :patch-data="{}"
        @update:model-value="handleFieldUpdate"
      />
    </div>
    <template #footer>
      <Button label="Отмена" icon="pi pi-times" class="p-button-text" @click="closeDialog" />
      <Button :label="saveButtonLabel" icon="pi pi-check" @click="handleRecordSave" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { FRONTEND } from '../../../../services/fieldTypeService';
  import CatalogDataTable from '../../../../pages/Page2CatalogDetails/components/DataTable.vue';
  import Message from 'primevue/message';
  import Button from 'primevue/button';
  import Dialog from 'primevue/dialog';
  import DynamicLayout from '../../components/DynamicLayout.vue';
  import ColumnVisibilitySelector from '../../../../pages/Page2CatalogDetails/components/ColumnVisibilitySelector.vue';

  interface FieldOptions {
    FRONTEND_CLASS: typeof FRONTEND.VIEW_SET_INLINE_LAYOUT;
    elementsIndex: Map<string, any>;
    TABLE_COLUMNS: Map<string, any>;
    elements: Array<any>;
    class_name: string;
    field_class: string;
    element_id: string;
    name: string;
    label?: string;
    help_text?: string;
    allow_empty?: boolean;
    list_view_items?: number;
    view_name: string;
    display_list: string[];
    natural_key: string[];
    primary_key: string;
    keyset: string[];
    js_validators?: string[];
    js_item_repr?: string;
    js_default_order?: string[];
  }

  // Определяем тип для связанных элементов
  interface RelatedItem {
    id: string | number;
    [key: string]: any;
  }

  const props = defineProps<{
    id?: string;
    name?: string;
    label?: string;
    help_text?: string;
    options: FieldOptions;
    modelValue?: any[];
    isModified: boolean;
  }>();

  // Создаем id на основе имени поля, если он не передан
  const fieldId = computed(() => props.id || `field_${props.options.name}`);
  const fieldName = computed(() => props.name || props.options.name);
  const fieldLabel = computed(() => props.label || props.options.label || props.options.name);
  const rowCountDisplay = computed(() => {
    const total = props.modelValue?.length || 0;
    const selected = selectedItems.value.length || 0;
    return `${total} / ${selected}`;
  });

  const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void;
    (e: 'update:isModified', value: boolean): void;
    (e: 'reset-field', fieldName: string): void;
  }>();

  // Используем ref для хранения выбранных элементов
  const selectedItems = ref<RelatedItem[]>([]);
  const isTableScrollable = ref(true);

  // Состояние модального окна
  const dialogVisible = ref(false);
  const error = ref<string | null>(null);
  const dialogTitle = ref('Добавление записи');
  const saveButtonLabel = ref('Добавить');
  const editingRecordIndex = ref<number | null>(null);

  // Данные для новой/редактируемой записи
  const newRecord = ref<Record<string, any>>({});

  // Открытие модального окна для добавления записи
  const openAddDialog = () => {
    // Сбрасываем данные новой записи
    newRecord.value = {};
    editingRecordIndex.value = null;
    dialogTitle.value = 'Добавление записи';
    saveButtonLabel.value = 'Добавить';
    dialogVisible.value = true;
    error.value = null;
  };

  // Открытие модального окна для редактирования записи
  const openEditDialog = (recordData: RelatedItem, index: number) => {
    // Копируем данные записи для редактирования
    newRecord.value = { ...recordData };
    editingRecordIndex.value = index;
    dialogTitle.value = 'Редактирование записи';
    saveButtonLabel.value = 'Сохранить';
    dialogVisible.value = true;
    error.value = null;
  };

  const closeDialog = () => {
    dialogVisible.value = false;
    editingRecordIndex.value = null;
  };

  const handleFieldUpdate = (updatedData: Record<string, any>) => {
    newRecord.value = { ...newRecord.value, ...updatedData };
  };

  // Обработка сохранения записи из формы
  const handleRecordSave = () => {
    if (editingRecordIndex.value !== null) {
      // Редактирование существующей записи
      const updatedValue = [...(props.modelValue || [])];
      updatedValue[editingRecordIndex.value] = newRecord.value;
      emit('update:modelValue', updatedValue);
    } else {
      // Добавление новой записи
      const newValue = [...(props.modelValue || []), newRecord.value];
      emit('update:modelValue', newValue);
    }

    closeDialog();
  };

  // Очистка выбранных строк из таблицы
  const clearField = () => {
    if (!props.modelValue || !selectedItems.value.length) return;
    // Получаем первичный ключ для сравнения элементов
    const primaryKey = props.options?.primary_key || 'id';

    // Создаем множество ID выбранных элементов для быстрого поиска
    const selectedIds = new Set(selectedItems.value.map((item) => String(item[primaryKey])));

    // Фильтруем текущие данные, исключая выбранные элементы
    const filteredData = props.modelValue.filter(
      (item) => !selectedIds.has(String(item[primaryKey])),
    );

    emit('update:modelValue', filteredData);
    selectedItems.value = [];
  };

  const resetField = () => {
    selectedItems.value = [];
    emit('reset-field', fieldName.value);
  };

  // Дублирование выбранной записи
  const duplicateSelectedRow = () => {
    if (selectedItems.value.length !== 1) return;
    const selectedRecord = selectedItems.value[0];

    // Создаем новый объект с теми же свойствами, но без id
    const duplicatedRecord = { ...selectedRecord };
    // Создаем новый объект без id, чтобы не было конфликта с существующей записью
    const { id, ...recordWithoutId } = duplicatedRecord;
    const newValue = [...(props.modelValue || []), recordWithoutId];
    emit('update:modelValue', newValue);
  };

  const handleRowClick = (event: any) => {
    console.log('Клик по строке:', event);
    if (event && event.data) {
      openEditDialog(event.data, event.index);
    }
  };

  const handleSelectedItemsChange = (items: RelatedItem[]) => {
    selectedItems.value = items;
  };
</script>

<style scoped>
  .empty-container {
    padding: 1rem;
  }
</style>
