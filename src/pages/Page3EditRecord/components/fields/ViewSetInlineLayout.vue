<!-- Отображаем как таблицу -->
<!-- управление массивами объектов-->

<!-- 1. Модальное окно работает с локальными данными-->
<!-- 2. Обновление родительского массива происходит при сохранении -->
<!-- Как Page3EditRecord рендерит DynamicLayout и предоставляет контекст -->
<!-- 
  Согласно принципу разделения ответственности:
  1. Родительский компонент отвечает за загрузку данных
  2. Компонент ViewSetInlineLayout отвечает за подготовку данных из пропсов и предоставление контекста
  3. Компонент DataTable отвечает только за отображение данных
  4. Компонент DynamicLayout отвечает только за отображение формы
-->
<template>
  <div class="mb-1 p-2 border rounded-lg">
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
            :disabled="modifiedRowsSet.size === 0"
            @click="resetArrayField"
            v-tooltip="'Отменить изменения'"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-sm p-button-outlined p-button-icon"
            size="small"
            @click="deleteSelectedRow"
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
              {{ draftArray.length }} / {{ selectedItems.length }}
              <span v-if="deletedCount > 0" class="deleted-count-text">
                (удалено: {{ deletedCount }})
              </span>
            </span>
            <ColumnVisibilitySelector
              :table-columns="props.options?.TABLE_COLUMNS"
              :is-table-scrollable="isTableScrollable"
              @toggle-table-scrollable="isTableScrollable = !isTableScrollable"
            />
          </div>
        </div>
      </div>

      <DataTable
        :tableRows="draftArray"
        :tableColumns="props.options?.TABLE_COLUMNS || new Map()"
        :primaryKey="props.options?.primary_key || 'id'"
        selectionMode="multiple"
        :selectedItems="selectedItems"
        :isTableScrollable="isTableScrollable"
        :modifiedRows="modifiedRowsSet"
        locale="ru"
        @row-click="handleRowClick"
        @update:selectedItems="handleSelectedItemsChange"
      />
    </div>

    <div v-if="help_text" class="flex align-items-center justify-content-between mt-1">
      <Message size="small" severity="secondary" variant="simple" class="flex-grow-1">
        {{ help_text }}
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
        <span class="dialog-title">{{ dialogTitle }}: {{ props.options.name }}</span>
      </div>
    </template>

    <div v-if="error" class="p-4 text-center">
      <Message severity="error" :life="5000">{{ error }}</Message>
    </div>
    <div v-else class="catalog-details-container">
      <!-- Используем компонент DynamicLayout для редактирования записи -->

      <DynamicLayout
        v-if="dialogVisible && props.options?.elementsIndex"
        :key="`modal-dynamic-layout-${editingRecordId}`"
        :layout-elements="props.options.elementsIndex"
        :original-record-data="currentOriginalRecord"
        :draft-record-data="currentEditingRecord"
        :update-field="modalUpdateField"
      />
    </div>
    <template #footer>
      <div class="flex justify-content-between w-full">
        <Button
          :label="
            modifiedFieldsCount > 0 ? `Отменить изменения: ${modifiedFieldsCount}` : 'Нет изменений'
          "
          icon="pi pi-undo"
          class="p-button-secondary"
          :disabled="modifiedFieldsCount === 0"
          @click="resetModalRecord"
        />
        <div class="flex gap-2">
          <Button label="Отмена" icon="pi pi-times" class="p-button-text" @click="closeDialog" />
          <Button :label="saveButtonLabel" icon="pi pi-check" @click="handleRecordSave" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
  import { ref, computed, provide, inject, type ComputedRef } from 'vue';
  import { FRONTEND } from '../../../../services/fieldTypeService';
  import Button from 'primevue/button';
  import Message from 'primevue/message';
  import Dialog from 'primevue/dialog';
  import DataTable from '../../../Page2CatalogDetails/components/DataTable.vue';
  import ColumnVisibilitySelector from '../../../Page2CatalogDetails/components/ColumnVisibilitySelector.vue';
  import DynamicLayout from '../DynamicLayout.vue';

  // Определяем интерфейс для объекта options
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
    readonly?: boolean;
    required?: boolean;
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
    id?: number | string;
    [key: string]: any;
  }

  const props = defineProps<{
    options: FieldOptions;
    // Пропсы от DynamicLayout
    originalValue?: any;
    draftValue?: any;
    updateField?: (newValue: any) => void;
  }>();

  // Две отдельные цепочки для чистоты архитектуры

  // 1. Получаем цепочку данных от родителя
  const parentDataChain = inject<ComputedRef<Record<string, any>[]>>(
    'dataChain',
    computed(() => []),
  );

  // Просто передаем ссылку на currentEditingRecord - никакого копирования!
  const dataChain = computed(() => [currentEditingRecord.value, ...parentDataChain.value]);

  provide('dataChain', dataChain);

  // 2. Получаем цепочку метаданных от родителя
  const parentMetadataChain = inject<ComputedRef<Map<string, any>[]>>(
    'metadataChain',
    computed(() => []),
  );

  // Просто передаем ссылку на локальный elementsIndex - никакого копирования!
  const metadataChain = computed(() => [props.options.elementsIndex, ...parentMetadataChain.value]);

  provide('metadataChain', metadataChain);

  // Получаем массивы с fallback на пустой массив
  const originalArray = computed(() => props.originalValue || []);
  const draftArray = computed(() => props.draftValue || []);

  // Определяем какие строки были изменены для подсветки
  const modifiedRowsSet = computed(() => {
    const draft = draftArray.value;
    const original = originalArray.value;
    const modifiedSet = new Set<string>();

    // Создаем карту оригинальных записей по ID для быстрого поиска
    const originalMap = new Map();
    original.forEach((item: any) => {
      if (item.id) {
        originalMap.set(String(item.id), item);
      }
    });

    // Проверяем каждую строку в draft массиве
    draft.forEach((draftRow: any) => {
      const recordId = draftRow.id;
      if (!recordId) return; // Пропускаем записи без ID

      const originalRow = originalMap.get(String(recordId)); // новая запись (если записи с таким id нет в оригинальном массиве)
      if (!originalRow || JSON.stringify(draftRow) !== JSON.stringify(originalRow)) {
        modifiedSet.add(String(recordId));
      }
    });

    return modifiedSet;
  });

  // Из options
  const fieldId = computed(() => `field_${props.options.name}`);
  const fieldLabel = computed(() => props.options.label || props.options.name);
  const help_text = computed(() => props.options.help_text);

  // Используем ref для хранения выбранных элементов
  const selectedItems = ref<RelatedItem[]>([]);
  const isTableScrollable = ref(true);

  // Переменная для отслеживания количества удаленных элементов
  const deletedCount = ref(0);

  // Переменные для работы с вложенными ключами
  // const modalNameKey = ref<string | null>(null); // Ключ модального окна (если есть)
  // const activeNestedKey = ref<string | null>(null); // Активный вложенный ключ

  // // Функция для генерации вложенного ключа
  // const generateNestedKey = (context: string, fieldName: string, index: number): string => {
  //   return `${context}__${fieldName}_${index}`;
  // };

  // Состояние модального окна
  const dialogVisible = ref(false);
  const error = ref<string | null>(null);
  const dialogTitle = ref('Добавление записи');
  const saveButtonLabel = ref('Добавить');
  const editingRecordId = ref<string | number | null>(null);

  // Временное хранилище для новой записи
  const newRecordData = ref<RelatedItem>({});

  // Счётчик для генерации уникальных временных ID
  const tempIdCounter = ref(1);

  const currentOriginalRecord = computed(() => {
    if (editingRecordId.value === null) {
      // Для новой записи нет оригинала
      return {};
    }

    // Прямой поиск оригинальной записи по ID
    // Нет проблем с индексами после удаления строк
    // ID не меняются при операциях с массивом
    const originalRecord = originalArray.value.find(
      (item: RelatedItem) => item.id === editingRecordId.value,
    );

    return originalRecord || {};
  });

  const currentEditingRecord = computed(() => {
    if (editingRecordId.value === null) {
      // Для новой записи используем временное хранилище
      return newRecordData.value;
    }
    // Поиск draft записи по ID
    const draftRecord = draftArray.value.find(
      (item: RelatedItem) => item.id === editingRecordId.value,
    );
    return draftRecord || {};
  });

  // Подсчитываем количество измененных полей в текущем редактируемом объекте (Модальное окно)
  const modifiedFieldsCount = computed(() => {
    const original = currentOriginalRecord.value;
    const draft = currentEditingRecord.value;

    // Если это новая запись, считаем все непустые поля как измененные
    if (editingRecordId.value === null) {
      return Object.keys(draft).filter((key) => {
        const value = draft[key];
        return value !== null && value !== undefined && value !== '';
      }).length;
    }

    // Для существующей записи сравниваем поля
    let changedCount = 0;
    const allKeys = new Set([...Object.keys(original), ...Object.keys(draft)]);

    for (const key of allKeys) {
      const originalValue = original[key];
      const draftValue = draft[key];

      // Сравниваем значения (с учетом объектов)
      if (JSON.stringify(originalValue) !== JSON.stringify(draftValue)) {
        changedCount++;
      }
    }

    return changedCount;
  });

  // Функция обновления поля в модальном окне
  const modalUpdateField = (fieldName: string, newValue: any) => {
    if (editingRecordId.value === null) {
      // Для новой записи сохраняем данные во временное хранилище
      newRecordData.value[fieldName] = newValue;
    } else {
      // Для редактирования - максимальная оптимизация
      // Прямая мутация реактивного объекта - только 1 операция!
      const record = draftArray.value.find(
        (item: RelatedItem) => item.id === editingRecordId.value,
      );
      if (record) {
        record[fieldName] = newValue;
        // Полагаемся на Vue/Pinia реактивность
        // Если не работает - вернуть props.updateField?.([...draftArray.value]);
      }
    }
  };

  const openAddDialog = () => {
    console.log('ViewSetInlineLayout: opening add dialog');

    // Очищаем временное хранилище для новой записи
    newRecordData.value = {};

    // Устанавливаем данные для новой записи
    editingRecordId.value = null; // null означает новую запись
    dialogTitle.value = 'Добавление записи';
    saveButtonLabel.value = 'Добавить';
    error.value = null;

    dialogVisible.value = true;
  };

  const openEditDialog = async (recordData: RelatedItem) => {
    console.log('ViewSetInlineLayout: recordData is array:', Array.isArray(recordData));

    // Устанавливаем ID для редактирования
    editingRecordId.value = recordData.id || null;
    dialogTitle.value = 'Редактирование записи';
    saveButtonLabel.value = 'Сохранить';
    error.value = null;

    dialogVisible.value = true;
  };

  const closeDialog = () => {
    dialogVisible.value = false;
    editingRecordId.value = null;
  };

  const handleRecordSave = () => {
    if (editingRecordId.value === null) {
      // Для новой записи добавляем данные в массив
      const newRecord = { ...newRecordData.value };

      // Присваиваем временный ID, если у записи его нет
      if (!newRecord.id) {
        newRecord.id = `temp_${tempIdCounter.value}`;
        tempIdCounter.value++;
      }

      const updatedArray = [...draftArray.value, newRecord];
      props.updateField?.(updatedArray);
    }
    // Для редактирования - все уже сохранено в draft через modalUpdateField
    closeDialog();
  };

  // Очистка выбранных строк из таблицы
  const deleteSelectedRow = () => {
    if (selectedItems.value.length === 0) {
      console.warn('Нет выбранных элементов для удаления');
      return;
    }

    const deletingCount = selectedItems.value.length;

    const updatedArray = draftArray.value.filter(
      (item: RelatedItem) =>
        !selectedItems.value.some(
          (selected: RelatedItem) => selected.id === item.id || selected === item,
        ),
    );

    deletedCount.value += deletingCount;

    props.updateField?.(updatedArray);
    selectedItems.value = [];
  };

  const resetArrayField = () => {
    // Сбрасываем массив к оригинальному состоянию
    // Создаем глубокую копию, чтобы избежать общих ссылок между original и draft
    const resetArray = JSON.parse(JSON.stringify(originalArray.value));
    props.updateField?.(resetArray);

    deletedCount.value = 0;

    selectedItems.value = [];
  };

  // Сброс только текущего редактируемого объекта в модальном окне
  const resetModalRecord = () => {
    if (editingRecordId.value === null) {
      // Для новой записи очищаем временное хранилище и закрываем диалог
      newRecordData.value = {};
      closeDialog();
      return;
    }

    const originalRecord = originalArray.value.find(
      (item: RelatedItem) => item.id === editingRecordId.value,
    );

    if (!originalRecord) {
      // Если оригинальной записи нет, значит это новая запись - удаляем её из массива
      const updatedArray = draftArray.value.filter(
        (item: RelatedItem) => item.id !== editingRecordId.value,
      );
      props.updateField?.(updatedArray);
      closeDialog();
      return;
    }

    // Для существующих записей восстанавливаем оригинальные данные
    const updatedArray = draftArray.value.map((item: RelatedItem) =>
      item.id === editingRecordId.value ? { ...originalRecord } : item,
    );
    props.updateField?.(updatedArray);
  };

  // Дублирование выбранной записи
  const duplicateSelectedRow = () => {
    if (selectedItems.value.length !== 1) return;

    const recordToDuplicate = selectedItems.value[0];
    const duplicatedRecord = { ...recordToDuplicate };
    delete duplicatedRecord.id; // Удаляем ID для создания новой записи

    const updatedArray = [...draftArray.value, duplicatedRecord];

    // Обновляем массив через пропс
    props.updateField?.(updatedArray);
  };

  const handleRowClick = (event: any) => {
    console.log('ViewSetInlineLayout: handleRowClick called with event:', event);
    if (event && event.data) {
      // Создаем вложенный ключ на основе текущего контекста
      // const currentContext = modalNameKey.value || 'create';
      // console.log(`Текущий контекст: ${currentContext}`);

      // // Создаем вложенный ключ для редактирования выбранной записи
      // const nestedKey = generateNestedKey(currentContext, props.options.name, event.index);
      // activeNestedKey.value = nestedKey;

      // }

      // Открываем диалог для редактирования
      console.log('ViewSetInlineLayout: handleRowClick calling openEditDialog');
      openEditDialog(event.data);
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

  .deleted-count-text {
    color: #ffb74d;
    margin-left: 0.25rem;
  }
</style>
