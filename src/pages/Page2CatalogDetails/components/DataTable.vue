<!-- 
Родительский компонент Page2CatalogDetails/index.vue теперь отвечает за загрузку и подготовку данных
DataTable.vue чисто презентационный и отвечает только за отображение данных
Не должен сам обращаться к стору, если следовать принципу разделения ответственности

  Компонент для отображения данных в виде таблицы.
  Принимает TABLE_COLUMNS и данные напрямую, не обращаясь к стору.
  Отображать данные и эмитить события, и не выполнять навигацию.

  Маршрутизатор
    ↓ (загружает данные при переходе на страницу)
  Page2CatalogDetails
    ↓ (получает данные из стора, подготавливает их)
  DataTable
    ↓ (только отображает данные)

DataTable отвечает только за отображение данных и отправку событий
Родительский компонент отвечает за загрузку данных из стора

если использовать встроенные возможности PrimeVue, то событие scroll будет наиболее близким аналогом.

Intersection Observer имеет преимущества:
Более эффективен (не вызывает событие при каждой прокрутке)
Работает с элементами, которые могут быть не видны изначально
Более гибкие настройки (threshold, rootMargin)
Если вы хотите использовать встроенные возможности PrimeVue, я могу помочь реализовать любой из этих подходов.

Не могу использовать в таблице lazy:
onLazyLoad вызывается при прокрутке таблицы
Родительский компонент должен загрузить данные
Данные попадают в стор
Родительский компонент получает данные из стора
Данные передаются в DataTable через props
Вот почему возникает ошибка - виртуальный скроллер ожидает, 
что данные появятся сразу после вызова onLazyLoad, но на самом деле это асинхронный процесс.
Основная проблема в вашем случае в том, что виртуальный скроллер ожидает 
немедленного обновления данных после вызова onLazyLoad, но в вашей архитектуре данные загружаются асинхронно через стор, 
что создает несоответствие между ожиданиями компонента и фактическим поведением.

Ожидание данных: После вызова onLazyLoad виртуальный скроллер ожидает, 
что данные будут добавлены в массив value таблицы. Если этого не происходит, возникают ошибки рендеринга.
-->
<template>
  <div class="catalog-data-table">
    <div class="table-container">
      <div class="table-wrapper" :class="{ 'table-scrollable': isTableScrollable }">
        <PrimeDataTable
          :value="props.tableRows"
          stripedRows
          responsiveLayout="scroll"
          reorderableColumns
          removableSort
          @column-reorder="onColumnReorder"
          class="p-datatable-sm transparent-header inner-shadow"
          v-model:selection="tableSelection"
          :selection-mode="props.selectionMode || 'multiple'"
          :dataKey="primaryKey"
          :scrollable="true"
          :resizableColumns="true"
          columnResizeMode="fit"
          @row-click="handleRowClick"
          :loading="props.loading"
          :totalRecords="props.totalRecords || 0"
          showGridlines
        >
          <!-- Колонка с чекбоксами для массового выделения, если режим выбора multiple -->
          <Column :selectionMode="props.selectionMode" headerStyle="width: 3rem" />

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

        <div
          v-if="!props.tableRows.length"
          class="empty-container flex justify-content-center align-items-center"
        >
          <Message severity="secondary" variant="simple">Данные отсутствуют</Message>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, h } from 'vue';
  import type { Component } from 'vue';
  import PrimeDataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Message from 'primevue/message';
  // Импортируем динамические компоненты полей
  import { dynamicField } from './fields';

  const resolveComponent = (component: any, value: any, metadata: any): Component => {
    // Если компонент является фабрикой, вызываем ее с переданными параметрами
    if (component && 'factory' in component && component.factory) {
      // Передаем локаль как отдельный третий параметр
      return component(value, metadata, props.locale);
    }

    // Если это обычный компонент, возвращаем его как есть
    if (component) {
      return component;
    }

    // Если компонент не найден, возвращаем простой div с текстом
    return () => h('div', {}, String(value || ''));
  };

  const props = withDefaults(
    defineProps<{
      tableRows: any[];
      tableColumns: Map<string, any>;
      locale: string; // Локаль для форматирования дат и чисел
      primaryKey: string;
      selectedItems?: any[];
      onColumnReorder?: (event: any) => void;
      loading?: boolean;
      isTableScrollable?: boolean;
      totalRecords?: number;
      selectionMode?: 'single' | 'multiple';
    }>(),
    {
      loading: false,
      totalRecords: 0,
    },
  );

  // Состояние компонента
  const tableSelection = ref<any[]>([]);
  const isTableScrollable = ref(true);

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

  // Функция для получения frontendClass поля
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
    emit('row-click', event);
  };

  const onColumnReorder = (event: any) => {
    if (typeof props.onColumnReorder === 'function') {
      props.onColumnReorder(event);
    }
  };

  // Создаем эмиттер для оповещения родителя о изменении выделенных строк, клике по строке
  const emit = defineEmits<{
    (e: 'row-click', event: any): void;
    (e: 'selection-change', selection: any[]): void;
    (e: 'update:selectedItems', value: any[]): void;
  }>();

  // Следим за изменениями в таблице и отправляем их родителю
  watch(tableSelection, (newSelection) => {
    emit('update:selectedItems', newSelection);
    emit('selection-change', newSelection);
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

  // Метод для прокрутки к строке по индексу (позиции) в массиве
  // DataTable не знает о recordId - компонент таблицы работает только с индексами строк (0, 1, 2, ...), а не с идентификаторами записей.
  // DOM-элементы строк - в DOM таблицы строки также идут по порядку (0, 1, 2, ...), что соответствует индексам в массиве данных.
  // Разделение ответственности - родительский компонент знает о структуре данных и может найти запись по ID, а дочерний компонент DataTable знает только о своей внутренней структуре и может прокрутить к строке по индексу.
  const scrollToRowByIndex = (index: number) => {
    if (index < 0) return;

    console.log('Прокрутка к строке по индексу:', index);

    // Ждем следующего цикла рендеринга для уверенности, что DOM обновился
    setTimeout(() => {
      // Находим DOM-элемент строки и прокручиваем к нему
      const tableRows = document.querySelectorAll('.p-datatable-tbody > tr');
      if (tableRows && tableRows[index]) {
        tableRows[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        console.warn('Строка не найдена в DOM по индексу:', index);
      }
    }, 0);
  };

  // Экспортируем метод для использования в родительском компоненте
  defineExpose({
    scrollToRowByIndex,
  });
</script>

<style scoped>
  .catalog-data-table {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* Делаем оверлей загрузки прозрачным */
  :deep(.p-datatable-mask.p-overlay-mask) {
    background: transparent !important;
  }

  /* Скрываем иконку загрузки по умолчанию */
  :deep(.p-datatable-loading-icon) {
    display: none;
  }

  :deep(.p-datatable-gridlines .p-datatable-thead > tr > th) {
    /* background-color: var(--p-floatlabel-color); */
    background-color: #f0f5fb;
    white-space: normal;
  }

  /* Стили для индикатора загрузки в футере */
  .loading-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    gap: 0.5rem;
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

  .load-more-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    text-align: center;
    color: #666;
    font-size: 0.9rem;
    height: 60px;
  }
</style>
