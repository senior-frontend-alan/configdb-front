<template>
  <div class="catalog-details-page">
    <Card>
      <template #title>
        <div class="header-container">
          <h4>{{ moduleTitle }}</h4>
          <div class="refresh-button-container">
            <Button
              id="refresh-button"
              icon="pi pi-refresh"
              class="p-button-rounded p-button-text"
              :disabled="loading"
              @click="refreshData"
              :loading="loading"
              aria-label="Обновить данные"
              v-tooltip="'Обновить данные'"
            />
          </div>
        </div>
      </template>
      <template #content>
        <div v-if="loading" class="loading-container">
          <ProgressSpinner />
          <p>Загрузка данных...</p>
        </div>

        <div v-else-if="error" class="error-container">
          <Message severity="error">{{ error }}</Message>
        </div>

        <div v-else-if="!tableData.length" class="empty-container">
          <Message severity="info">Данные каталога отсутствуют</Message>
        </div>

        <div v-else class="catalog-details">
          <!-- Отображение в виде таблицы -->
          <div class="table-controls">
            <AddNewDataDialog :moduleId="moduleId" @data-added="refreshData" />
            <Button
              :icon="isTableScrollable ? 'pi pi-arrows-h' : 'pi pi-table'"
              class="p-button-rounded p-button-text"
              aria-label="Переключить режим ширины"
              v-tooltip="
                isTableScrollable
                  ? 'Отключить горизонтальную прокрутку'
                  : 'Включить горизонтальную прокрутку'
              "
              @click="isTableScrollable = !isTableScrollable"
            />
            <ColumnVisibilitySelector
              :available-fields="columnsOrder"
              v-model="visibleColumns"
              :columns-metadata="columnsMetadata"
              @update:modelValue="updateVisibleColumns"
            />
          </div>
          <div class="table-wrapper" :class="{ 'table-scrollable': isTableScrollable }">
            <DataTable
              :value="tableData"
              stripedRows
              responsiveLayout="scroll"
              reorderableColumns
              removableSort
              @column-reorder="onColumnReorder"
              class="p-datatable-sm"
              v-model:selection="selectedItems"
              :selection-mode="hasBatchPermission ? 'multiple' : undefined"
              dataKey="id"
              :scrollable="isTableScrollable"
              :resizableColumns="true"
              columnResizeMode="fit"
              :tableStyle="isTableScrollable ? 'min-width: 1000px' : 'width: 100%'"
              @row-click="onRowClick"
            >
              <!-- Колонка с чекбоксами для массового выделения, если разрешены batch операции -->
              <Column
                v-if="hasBatchPermission"
                selectionMode="multiple"
                headerStyle="width: 3rem"
              />

              <!-- Динамические колонки -->
              <Column
                v-for="col in columns"
                :key="col.field"
                :field="col.field"
                :header="col.header"
                :sortable="true"
                :style="getColumnStyle(col.field)"
                :frozen="col.field === 'id' && isTableScrollable"
              >
                <template #body="slotProps">
                  <!-- Отладочный вывод для HTML-строки -->
                  <div
                    v-if="
                      typeof slotProps.field === 'string' &&
                      slotProps.field === 'layout_rich_edit_field' &&
                      typeof slotProps.data[slotProps.field] === 'string'
                    "
                  >
                    <pre class="text-xs bg-surface-50 p-1 rounded overflow-auto max-h-20">
                    Тип: {{ typeof slotProps.data[slotProps.field] }}
                    Длина: {{ slotProps.data[slotProps.field].length }}
                    Начало: {{ slotProps.data[slotProps.field].substring(0, 30) }}...
                  </pre
                    >
                  </div>

                  <!-- В PrimeVue DataTable слот #body передает объект slotProps, содержащий данные текущей строки (data) и имя текущего поля (field)
                TypeScript не мог определить, что slotProps.field всегда является строкой, поэтому выдавал ошибку при попытке использовать это значение как индекс объекта -->
                  <RichEditPopover
                    v-if="typeof slotProps.field === 'string' && 
                        slotProps.data[slotProps.field as string] && 
                        (typeof slotProps.data[slotProps.field as string] === 'object' || 
                         (typeof slotProps.data[slotProps.field as string] === 'object' && 
                          'label' in slotProps.data[slotProps.field as string]))"
                    :fieldData="slotProps.data[slotProps.field as string]"
                  />
                  <span v-else>{{
                    typeof slotProps.field === 'string'
                      ? slotProps.data[slotProps.field as string]
                      : ''
                  }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </template>
    </Card>

    <!-- Статус-бар с информацией о количестве элементов -->
    <div class="status-bar">
      <div class="status-item">
        <span class="status-label">Всего:</span>
        <span class="status-value">{{ totalItems }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Загружено:</span>
        <span class="status-value">{{ fetchedItems }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Выбрано:</span>
        <span class="status-value">{{ selectedItems.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useModuleStore } from '../stores/module-factory';
  import { findAndLoadCatalogData } from '../router';
  import { formatByClassName, FIELD_TYPES } from '../utils/formatter';
  import ColumnVisibilitySelector from '../components/ColumnVisibilitySelector.vue';
  import AddNewDataDialog from '../components/AddNewDataDialog.vue';
  import RichEditPopover from '../components/RichEditPopover.vue';

  import Card from 'primevue/card';
  import Message from 'primevue/message';
  import ProgressSpinner from 'primevue/progressspinner';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';

  // Получаем параметры маршрута
  const route = useRoute();
  const router = useRouter();
  const viewname = computed(() => route.params.viewname as string);

  // Состояние компонента
  const loading = ref(true);
  const error = ref<string | null>(null);
  const selectedItems = ref<any[]>([]);
  const tableData = ref<Array<any>>([]);
  const columns = ref<Array<{ field: string; header: string }>>([]);
  const primaryKey = ref<string>('id');
  const hasBatchPermission = ref(true);
  const visibleColumns = ref<string[]>([]);
  const columnsMetadata = ref<Record<string, { header: string }>>({});
  const columnsOrder = ref<string[]>([]);
  const isTableScrollable = ref(false);

  // Заголовок страницы
  const moduleTitle = computed(() => {
    return `Детали каталога: ${viewname.value}`;
  });

  // Получаем ID модуля из meta-данных маршрута
  const moduleId = computed(() => (route.meta.moduleId as string) || '');

  // Получаем ссылку на хранилище модуля
  const moduleStore = computed(() => useModuleStore(moduleId.value));

  // Вычисляемые свойства для статус-бара
  const totalItems = ref(0);
  const fetchedItems = computed(() => tableData.value.length);

  // Функция для получения текущих данных из стора
  const getCurrentStoreDetails = () => {
    return moduleStore.value?.catalogDetails[viewname.value];
  };

  // Функция для обработки полученных данных
  const processData = (storeDetails: any) => {
    if (!storeDetails) {
      console.error('Ошибка: Данные не найдены');
      error.value = 'Данные не найдены';
      return;
    }

    console.log('Обработка данных для:', storeDetails.viewname);

    // Определяем первичный ключ
    if (storeDetails.OPTIONS && storeDetails.OPTIONS.layout) {
      primaryKey.value = storeDetails.OPTIONS.layout.pk || 'id';
    }

    // Проверяем разрешения для batch операций
    if (
      storeDetails.OPTIONS &&
      storeDetails.OPTIONS.permitted_actions &&
      storeDetails.OPTIONS.permitted_actions.batch
    ) {
      hasBatchPermission.value = true;
    }

    // Обновляем данные таблицы
    tableData.value = createRows(storeDetails);

    // Получаем данные о колонках из columnsState
    const columnsState = storeDetails.OPTIONS?.layout?.columnsState;
    if (columnsState) {
      // Сохраняем метаданные колонок
      columnsMetadata.value = columnsState.metadata;

      // Сохраняем порядок колонок
      columnsOrder.value = [...columnsState.order];

      // Получаем список видимых колонок
      visibleColumns.value = Array.from(columnsState.visible);

      // Создаем колонки для таблицы
      columns.value = visibleColumns.value.map((field) => ({
        field,
        header: columnsMetadata.value[field]?.header || field,
      }));
    }

    // Обновляем общее количество элементов
    totalItems.value = storeDetails.GET.count || tableData.value.length;

    // Сбрасываем выбранные элементы
    selectedItems.value = [];
  };

  // Функция для обновления данных
  const refreshData = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Определяем viewname из маршрута
      const viewname = route.params.viewname as string;

      const dataLoaded = await findAndLoadCatalogData(
        moduleId.value,
        viewname,
        (err) => {
          if (err) {
            error.value = err.message || 'Ошибка загрузки данных';
            console.error('Ошибка при загрузке данных:', err);
          }
        },
        true, // Принудительное обновление данных, игнорируя кэш
      );

      if (dataLoaded) {
        const newStoreDetails = getCurrentStoreDetails();

        if (newStoreDetails) {
          // Обрабатываем полученные данные
          processData(newStoreDetails);

          // Сбрасываем выбранные элементы
          selectedItems.value = [];
        }
      }
    } finally {
      loading.value = false;
    }
  };

  // Функция для создания строк таблицы из отформатированных данных
  const createRows = (storeDetails: any): any[] => {
    // Проверяем наличие данных
    if (!storeDetails || !storeDetails.GET || !storeDetails.GET.results) {
      console.error('Ошибка: GET не содержит results');
      return [];
    }

    // Получаем карту элементов для форматирования
    const elementsMap = storeDetails.OPTIONS?.layout?.elementsMap || {};

    // Форматируем каждую строку и каждое поле в ней
    return storeDetails.GET.results.map((row: any) => {
      const formattedRow = { ...row };

      // Форматируем каждое поле в соответствии с его типом
      Object.keys(row).forEach((fieldName) => {
        try {
          const fieldInfo = elementsMap[fieldName];

          if (fieldInfo) {
            // Форматируем по типу поля
            const fieldType = fieldInfo.class_name || FIELD_TYPES.LAYOUT_CHAR_FIELD;
            formattedRow[fieldName] = formatByClassName(fieldType, formattedRow[fieldName], {
              jsItemRepr: fieldInfo.js_item_repr,
              moduleId: storeDetails.viewname,
            });
          }
        } catch (e) {
          console.warn(`Ошибка форматирования поля ${fieldName}:`, e);
        }
      });

      return formattedRow;
    });
  };

  // Обработка перетаскивания столбцов
  const onColumnReorder = (event: any) => {
    const storeDetails = getCurrentStoreDetails();
    if (!storeDetails) return;

    // Получаем новый порядок столбцов
    const newColumns = event.columns.map((col: any) => col.props.field);

    // Обновляем пользовательские настройки
    storeDetails.userSettings.displayColumns = newColumns;

    console.log('Порядок столбцов изменен:', newColumns);
  };

  // Обновление видимости колонок
  const updateVisibleColumns = (newColumns: string[]) => {
    // Обновляем локальное состояние
    visibleColumns.value = [...newColumns];

    try {
      // Получаем ссылку на columnsState
      const storeDetails = getCurrentStoreDetails();
      if (!storeDetails || !storeDetails.OPTIONS || !storeDetails.OPTIONS.layout) return;

      const columnsState = storeDetails.OPTIONS.layout.columnsState;
      if (!columnsState) return;

      // Обновляем видимость в columnsState
      columnsState.visible.clear();
      newColumns.forEach((field) => {
        columnsState.visible.add(field);
      });

      // Обновляем колонки для таблицы
      columns.value = newColumns.map((field) => ({
        field,
        header: columnsMetadata.value[field]?.header || field,
      }));
    } catch (error) {
      console.error('Ошибка при обновлении видимости колонок:', error);
    }
  };

  const getColumnStyle = (field: string) => {
    if (isTableScrollable.value) {
      return 'min-width: 150px';
    } else {
      return '';
    }
  };

  const onRowClick = (event: any) => {
    const rowData = event.data;

    if (rowData && rowData.id) {
      const currentPath = route.path;
      const editUrl = `${currentPath}/${rowData.id}`;

      router.push(editUrl);
    } else {
      console.warn(
        'Не удалось получить идентификатор строки для перехода на страницу редактирования',
      );
    }
  };

  onMounted(async () => {
    if (!moduleStore.value) {
      error.value = `Модуль с ID ${moduleId.value} не найден`;
      loading.value = false;
      return;
    }

    // Если данные уже загружены роутером, просто используем их
    const currentStoreDetails = getCurrentStoreDetails();
    if (currentStoreDetails && currentStoreDetails.GET && currentStoreDetails.GET.results) {
      console.log('Используем данные, предварительно загруженные роутером');

      processData(currentStoreDetails);

      loading.value = false;
    } else {
      // Если данные не загружены роутером, запускаем обновление
      await refreshData();
    }
  });
</script>

<style scoped>
  .catalog-details-page {
    padding: 1rem;
    padding-bottom: 3rem;
  }

  .header-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .refresh-button-container {
    margin-left: 1rem;
    display: flex;
    align-items: center;
  }

  .table-controls {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
    gap: 0.5rem;
  }

  .table-wrapper {
    width: 100%;
  }

  .table-wrapper:not(.table-scrollable) {
    overflow-x: hidden;
  }

  .table-wrapper:not(.table-scrollable) :deep(.p-datatable) {
    width: 100%;
  }

  .table-wrapper:not(.table-scrollable) :deep(.p-datatable-wrapper) {
    overflow-x: hidden;
  }

  .table-wrapper:not(.table-scrollable) :deep(.p-datatable-table) {
    width: 100% !important;
    table-layout: fixed;
  }

  .table-wrapper:not(.table-scrollable) :deep(.p-datatable-tbody > tr > td) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .catalog-details {
    margin-top: 1rem;
  }

  .batch-actions-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: var(--surface-hover);
    border-radius: 4px;
  }

  .selected-info {
    font-weight: bold;
  }

  .batch-actions {
    display: flex;
    gap: 0.5rem;
  }

  .text-muted {
    color: var(--text-color-secondary);
    font-style: italic;
  }

  .column-header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .column-drag-handle {
    cursor: move;
    color: var(--text-color-secondary);
    margin-left: 0.5rem;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .column-drag-handle:hover {
    opacity: 1;
  }

  /* Стили для статус-бара */
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1.5rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    padding-right: 2.5rem;
    background-color: var(--p-surface-50);
    border-top: 1px solid var(--surface-border);
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    font-size: 0.875rem;
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-label {
    color: var(--text-color-secondary);
    opacity: 0.5;
  }

  .status-value {
    color: var(--text-color-secondary);
    opacity: 0.5;
  }
</style>
