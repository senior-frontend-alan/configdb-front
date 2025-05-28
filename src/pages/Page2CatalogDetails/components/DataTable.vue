<!-- 
  Компонент для отображения данных в виде таблицы.
  Принимает TABLE_COLUMNS и данные напрямую, не обращаясь к стору.

  Маршрутизатор
    ↓ (загружает данные при переходе на страницу)
  Page2CatalogDetails
    ↓ (получает данные из стора, подготавливает их)
  DataTable
    ↓ (только отображает данные)
-->
<template>
  <div class="catalog-data-table">
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <p>Загрузка данных...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <Message severity="error">{{ error }}</Message>
    </div>

    <div v-else class="table-container">
      <div class="table-wrapper" :class="{ 'table-scrollable': isTableScrollable }">
        <PrimeDataTable
          :value="tableRows"
          stripedRows
          responsiveLayout="scroll"
          reorderableColumns
          removableSort
          @column-reorder="onColumnReorder"
          class="p-datatable-sm transparent-header inner-shadow"
          v-model:selection="tableSelection"
          :selection-mode="hasBatchPermission ? 'multiple' : undefined"
          :dataKey="primaryKey"
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
            :style="getColumnStyle(col.field || '')"
          >
            <template #body="slotProps">
              <!-- Используем динамический рендеринг на основе FRONTEND_CLASS -->
              <!-- 
                Динамический компонент на основе FRONTEND_CLASS поля
                Фабрика компонентов возвращает нужный компонент в зависимости от типа поля
                Для полей типа CHAR возвращается CharWithButton
                Для полей типа RICH_EDIT возвращается RichEdit
              -->
              <template v-if="typeof slotProps.field === 'string'">
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
        </PrimeDataTable>

        <div v-if="!tableRows.length" class="empty-container">
          <Message severity="info">Данные отсутствуют</Message>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { h, ref, computed, watch } from 'vue';
  import type { Component } from 'vue';
  import PrimeDataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Message from 'primevue/message';
  import ProgressSpinner from 'primevue/progressspinner';
  // Импортируем динамические компоненты полей
  import { dynamicField } from './fields';

  // Функция для разрешения компонентов
  const resolveComponent = (component: any, value: any, metadata: any): Component => {
    // Если компонент является фабрикой, вызываем ее с переданными параметрами
    if (component && 'factory' in component && component.factory) {
      return component(value, metadata);
    }

    // Если это обычный компонент, возвращаем его как есть
    if (component) {
      return component;
    }

    // Если компонент не найден, возвращаем простой div с текстом
    return () => h('div', {}, String(value || ''));
  };

  const props = defineProps<{
    tableRows: any[];
    tableColumns: Map<string, any>;
    primaryKey: string;
    hasBatchPermission: boolean;
    selectedItems?: any[];
    onRowClick?: (event: any) => void;
    onColumnReorder?: (event: any) => void;
  }>();

  // Состояние компонента
  const tableSelection = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isTableScrollable = ref(false);

  // Вычисляемые свойства
  const columns = computed(() => {
    if (!props.tableColumns) return [];

    const columnsList: Array<{ field: string; header: string; frontendClass?: string }> = [];

    // Обрабатываем TABLE_COLUMNS
    props.tableColumns.forEach((column: any, fieldName: string) => {
      // Если поле видимое, добавляем его в список колонок таблицы
      if (column.VISIBLE) {
        columnsList.push({
          field: fieldName,
          header: `${column.label || fieldName} [${column.FRONTEND_CLASS}]`,
          frontendClass: column.FRONTEND_CLASS || '',
        });
      }
    });

    return columnsList;
  });

  const getColumnFrontendClass = (fieldName: string): string => {
    if (!props.tableColumns || !props.tableColumns.has(fieldName)) return '';
    return props.tableColumns.get(fieldName)?.FRONTEND_CLASS || '';
  };

  // Функция для получения метаданных поля
  const getFieldMetadata = (fieldName: string): any => {
    if (!props.tableColumns || !props.tableColumns.has(fieldName)) return null;
    return props.tableColumns.get(fieldName);
  };

  // Функция для определения стиля колонки
  const getColumnStyle = (field: string) => {
    if (isTableScrollable.value) {
      // Для ID колонки можно задать меньшую ширину
      if (field === props.primaryKey) {
        return 'width: 100px';
      }
      // Для остальных колонок можно задать стандартную ширину
      return 'min-width: 200px';
    }
    return '';
  };

  const handleRowClick = (event: any) => {
    // Если передана пользовательская функция, используем её
    if (typeof props.onRowClick === 'function') {
      props.onRowClick(event);
    }
  };

  const onColumnReorder = (event: any) => {
    if (typeof props.onColumnReorder === 'function') {
      props.onColumnReorder(event);
    }
  };

  // Создаем эмиттер для оповещения родителя о изменении выделенных строк
  const emit = defineEmits<{
    (e: 'update:selectedItems', value: any[]): void;
  }>();

  // Следим за изменениями в таблице и отправляем их родителю
  watch(tableSelection, (newValue) => {
    emit('update:selectedItems', newValue);
  });

  // Следим за изменениями от родителя и обновляем таблицу
  watch(
    () => props.selectedItems,
    (newValue) => {
      if (newValue && JSON.stringify(tableSelection.value) !== JSON.stringify(newValue)) {
        tableSelection.value = [...newValue];
      }
    },
    { immediate: true },
  );
</script>

<style scoped>
  .catalog-data-table {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .table-container {
    flex: 1;
    overflow: auto;
  }

  .table-wrapper {
    position: relative;
    margin-bottom: 1rem;
  }

  .table-scrollable {
    overflow-x: auto;
  }

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
  }

  .empty-container {
    padding: 1rem;
    text-align: center;
  }
</style>
