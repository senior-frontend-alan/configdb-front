<template>
  <div class="catalog-details-page">
    <div class="header-container">
      <div class="title-container">
        <h3>{{ currentCatalog?.OPTIONS?.verbose_name || 'Каталог без названия' }}</h3>
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
      <div class="table-controls">
        <!-- <AddNewDataDialog :moduleName="moduleName" @data-added="refreshData" /> -->
        <Button
          icon="pi pi-plus"
          class="p-button-sm"
          aria-label="Добавить запись"
          @click="goToAddRecord"
        />
        <ColumnVisibilitySelector
          :tableColumns="currentCatalog?.OPTIONS?.layout?.TABLE_COLUMNS"
          :is-table-scrollable="isTableScrollable"
          @update-column-visibility="updateColumnVisibility"
          @toggle-table-scrollable="isTableScrollable = !isTableScrollable"
        />
      </div>
    </div>
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <p>Загрузка данных...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <Message severity="error">{{ error }}</Message>
    </div>

    <div v-else-if="!tableRows.length" class="empty-container">
      <Message severity="info">Данные каталога отсутствуют</Message>
    </div>

    <div v-else class="catalog-details">
      <!-- Отображение в виде таблицы -->

      <div class="table-wrapper" :class="{ 'table-scrollable': isTableScrollable }">
        <DataTable
          :value="tableRows"
          stripedRows
          responsiveLayout="scroll"
          reorderableColumns
          removableSort
          @column-reorder="onColumnReorder"
          class="p-datatable-sm transparent-header inner-shadow"
          v-model:selection="selectedItems"
          :selection-mode="hasBatchPermission ? 'multiple' : undefined"
          dataKey="id"
          :scrollable="isTableScrollable"
          :resizableColumns="true"
          columnResizeMode="fit"
          :tableStyle="isTableScrollable ? 'min-width: 1000px' : 'width: 100%'"
          @row-click="handleRowClick"
        >
          <!-- Колонка с чекбоксами для массового выделения, если разрешены batch операции -->
          <Column v-if="hasBatchPermission" selectionMode="multiple" headerStyle="width: 3rem" />

          <!-- Динамические колонки -->
          <Column
            v-for="col in columns"
            :key="col.field"
            :field="col.field"
            :header="col.header"
            :sortable="true"
            :style="getColumnStyle(col.field)"
          >
            <template #body="slotProps">
              <!-- Используем динамический рендеринг на основе FRONTEND_CLASS -->
              <template v-if="slotProps.field && typeof slotProps.field === 'string'">
                <!-- 
                  Динамический компонент на основе FRONTEND_CLASS поля
                  Фабрика компонентов возвращает нужный компонент в зависимости от типа поля
                  Для полей типа CHAR возвращается CharWithButton
                  Для полей типа RICH_EDIT возвращается RichEdit
                -->
                <component
                  :is="
                    resolveComponent(
                      dynamicField[getColumnFrontendClass(slotProps.field)],
                      slotProps.data[slotProps.field], // значение поля
                      getFieldMetadata(slotProps.field), // метаданные поля
                    )
                  "
                />
              </template>
              <span v-else>Компонент не определен</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
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
  import { useRouter } from 'vue-router';
  import { resolveComponent, dynamicField } from './components/fields';
  import { useModuleStore } from '../../stores/module-factory';
  import { loadCatalogByNameFromGroups } from '../../router';
  import ColumnVisibilitySelector from './components/ColumnVisibilitySelector.vue';
  // Компонент AddNewDataDialog закомментирован в шаблоне, поэтому удаляем его импорт
  import Message from 'primevue/message';
  import ProgressSpinner from 'primevue/progressspinner';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';

  // Получаем параметры маршрута только для навигации
  const router = useRouter();

  // Состояние компонента
  const selectedItems = ref<any[]>([]);
  const columns = ref<any[]>([]);
  const tableRows = ref<any[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const primaryKey = ref<string>('id');
  const hasBatchPermission = ref(true);
  const visibleColumns = ref<string[]>([]);
  const columnsOrder = ref<string[]>([]);
  const isTableScrollable = ref(false);

  // Получаем moduleName, viewname и пользовательскую функцию onRowClick из props
  const props = defineProps<{
    moduleName: string; // Обязательный параметр
    viewname: string; // Обязательный параметр
    onRowClick?: (event: any) => void; // Опциональная пользовательская функция для обработки клика по строке
  }>();

  // Используем значения из props
  const moduleName = computed(() => props.moduleName);
  const viewname = computed(() => props.viewname);

  const moduleStore = computed(() => useModuleStore(moduleName.value));

  // Создаем реактивную ссылку на текущие данные из стора
  const currentCatalog = computed(() => {
    return moduleStore.value?.catalogsByName[viewname.value];
  });

  // Вычисляемые свойства для статус-бара
  const totalItems = ref(0);
  const fetchedItems = computed(() => tableRows.value.length);

  // Функция для формирования колонок таблицы из TABLE_COLUMNS
  const generateTableColumns = (TABLE_COLUMNS: Map<string, any>) => {
    if (!TABLE_COLUMNS) return;

    // Создаем массивы для колонок таблицы и селектора
    const tableColumnsList: Array<{ field: string; header: string; frontendClass?: string }> = [];
    const allFields: string[] = [];

    // Обрабатываем TABLE_COLUMNS напрямую
    TABLE_COLUMNS.forEach((column: any, fieldName: string) => {
      // Добавляем поле в список всех полей
      allFields.push(fieldName);

      // Если поле видимое, добавляем его в список колонок таблицы
      if (column.VISIBLE) {
        tableColumnsList.push({
          field: fieldName,
          header: `${column.label || fieldName} [${column.FRONTEND_CLASS}]`,
          frontendClass: column.FRONTEND_CLASS || '',
        });
      }
    });

    // Устанавливаем значения
    columnsOrder.value = allFields;
    visibleColumns.value = tableColumnsList.map((col) => col.field);
    columns.value = tableColumnsList;
  };

  // Функция для обновления видимости колонок
  const updateColumnVisibility = (fieldName: string, isVisible: boolean) => {
    const TABLE_COLUMNS = currentCatalog.value?.OPTIONS?.layout?.TABLE_COLUMNS;
    if (!TABLE_COLUMNS) return;

    const column = TABLE_COLUMNS.get(fieldName);
    if (column) {
      column.VISIBLE = isVisible; // Используем VISIBLE вместо visible

      // Перегенерируем колонки таблицы
      generateTableColumns(TABLE_COLUMNS);
    }
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
    tableRows.value = createRows(storeDetails);

    // Формируем колонки таблицы
    generateTableColumns(storeDetails.OPTIONS?.layout?.TABLE_COLUMNS);

    // Обновляем общее количество элементов
    totalItems.value = storeDetails.GET.count || tableRows.value.length;

    // Сбрасываем выбранные элементы
    selectedItems.value = [];
  };

  // Функция для обновления данных
  const refreshData = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Используем вычисляемое свойство viewname
      if (!viewname.value) {
        throw new Error('Не удалось определить viewname для загрузки данных');
      }

      const dataLoaded = await loadCatalogByNameFromGroups(
        moduleName.value,
        viewname.value,
        (err) => {
          if (err) {
            error.value = err.message || 'Ошибка загрузки данных';
            console.error('Ошибка при загрузке данных:', err);
          }
        },
        true, // Принудительное обновление данных, игнорируя кэш
      );

      if (dataLoaded) {
        const storeDetails = currentCatalog.value;

        if (storeDetails) {
          // Обрабатываем полученные данные
          processData(storeDetails);

          // Сбрасываем выбранные элементы
          selectedItems.value = [];
        }
      }
    } finally {
      loading.value = false;
    }
  };

  function createRows(storeDetails: any): any[] {
    if (!storeDetails || !storeDetails.GET || !storeDetails.GET.results) {
      console.error('Ошибка: GET не содержит results');
      return [];
    }

    // Теперь просто возвращаем исходные данные, форматирование будет выполняться в компонентах
    return storeDetails.GET.results;
  }

  // Функция для получения FRONTEND_CLASS поля
  const getColumnFrontendClass = (fieldName: string): string => {
    const TABLE_COLUMNS = currentCatalog.value?.OPTIONS?.layout?.TABLE_COLUMNS;
    if (!TABLE_COLUMNS || !TABLE_COLUMNS.has(fieldName)) return '';
    return TABLE_COLUMNS.get(fieldName)?.FRONTEND_CLASS || '';
  };

  // Функция для получения метаданных поля
  const getFieldMetadata = (fieldName: string): any => {
    const TABLE_COLUMNS = currentCatalog.value?.OPTIONS?.layout?.TABLE_COLUMNS;
    if (!TABLE_COLUMNS || !TABLE_COLUMNS.has(fieldName)) return null;
    return TABLE_COLUMNS.get(fieldName);
  };

  // Обработка перетаскивания столбцов
  const onColumnReorder = (event: any) => {
    const storeDetails = currentCatalog.value;
    if (!storeDetails) return;

    // Получаем новый порядок столбцов
    const newColumns = event.columns.map((col: any) => col.props.field);

    // Обновляем пользовательские настройки
    storeDetails.userSettings.displayColumns = newColumns;

    console.log('Порядок столбцов изменен:', newColumns);
  };

  const getColumnStyle = (field: string) => {
    // Используем field для определения стиля колонки
    if (isTableScrollable.value) {
      // Для ID колонки можно задать меньшую ширину
      if (field === 'id') {
        return 'min-width: 100px';
      }
      return 'min-width: 150px';
    } else {
      return '';
    }
  };

  // Обработка клика по строке таблицы - переход на страницу редактирования
  // Обработчик клика по строке таблицы
  const handleRowClick = (event: any) => {
    // Если передана пользовательская функция, используем её
    if (typeof props.onRowClick === 'function') {
      props.onRowClick(event);
      return;
    }

    // Стандартное поведение - переход на страницу редактирования
    const rowData = event.data;

    if (rowData && rowData.id) {
      // Формируем URL для страницы редактирования, используя moduleName и viewname из props
      const editUrl = `/${moduleName.value}/${viewname.value}/edit/${rowData.id}`;

      router.push(editUrl);
    } else {
      console.warn(
        'Не удалось получить идентификатор строки для перехода на страницу редактирования',
      );
    }
  };

  // Переход на страницу добавления новой записи
  const goToAddRecord = () => {
    // Формируем URL для страницы добавления, используя moduleName и viewname из props
    const addUrl = `/${moduleName.value}/${viewname.value}/add`;

    router.push(addUrl);
  };

  onMounted(async () => {
    if (!moduleStore.value) {
      error.value = `Модуль с ID ${moduleName.value} не найден`;
      loading.value = false;
      return;
    }

    // Если данные уже загружены роутером, просто используем их
    const storeDetails = currentCatalog.value;
    if (storeDetails && storeDetails.GET && storeDetails.GET.results) {
      console.log('Используем данные, предварительно загруженные роутером');

      processData(storeDetails);

      loading.value = false;
    } else {
      // Если данные не загружены роутером, запускаем обновление
      await refreshData();
    }
  });
</script>

<style scoped>
  .catalog-details-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
  }

  .header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .title-container {
    display: flex;
    align-items: center;
  }

  .table-controls {
    align-items: center;
    display: flex;
    justify-content: flex-end;
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
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .table-wrapper {
    flex: 1;
    overflow: auto;
  }

  .table-scrollable {
    overflow-x: auto;
  }

  /* Стили для контейнера полей типа Char с кнопкой просмотра полного текста */
  .char-field-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
    transition: opacity 0.2s;
  }

  .column-drag-handle:hover {
    opacity: 1;
  }

  :deep(.transparent-header .p-datatable-thead > tr > th) {
    background-color: transparent;
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
