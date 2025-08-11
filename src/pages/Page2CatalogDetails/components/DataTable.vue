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
          :rowClass="getRowClass"
          reorderableColumns
          removableSort
          @column-reorder="onColumnReorder"
          class="p-datatable-sm transparent-header inner-shadow"
          v-model:selection="tableSelection"
          :dataKey="primaryKey"
          :scrollable="true"
          :resizableColumns="true"
          columnResizeMode="fit"
          @row-click="handleRowClick"
          :loading="props.loading"
          :totalRecords="props.totalRecords || 0"
          showGridlines
          rowHover
          data-testid="table-prime"
        >
          <!-- 
          Режимы выбора строк согласно документации PrimeVue:
          single - Column с selectionMode="single" отображает радиокнопки.
          
          multiple - Column с selectionMode="multiple" отображает чекбоксы.
                     Header checkbox позволяет выбрать/снять все строки.
          undefined - выбор строк отключен полностью.
          
          ВАЖНО: selectionMode устанавливается на Column, а НЕ на DataTable!
          Для чекбоксов, которые выбираются только при клике на чекбокс:
          - НЕ устанавливать selectionMode на DataTable
          - Установить selectionMode="multiple" только на Column
          - Убрать обработчик @row-click для выбора (оставить только для навигации)
          -->
          <!-- Колонка с чекбоксами для множественного выбора -->
          <Column
            v-if="props.selectionMode === 'multiple'"
            selectionMode="multiple"
            headerStyle="width: 3rem"
          />

          <!-- Колонка с радиокнопками для одиночного выбора -->
          <Column
            v-if="props.selectionMode === 'single'"
            selectionMode="single"
            headerStyle="width: 3rem"
          />

          <!-- Остальные колонки -->
          <Column
            v-if="columns && columns.length > 0"
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
      tableColumns?: Map<string, any>;
      locale: string; // Локаль для форматирования дат и чисел
      primaryKey: string;
      selectedItems?: any[];
      onColumnReorder?: (event: any) => void;
      loading?: boolean;
      isTableScrollable?: boolean;
      totalRecords?: number;
      selectionMode?: 'single' | 'multiple' | undefined;
      modifiedRows?: Set<string>; // Множество ID измененных строк
    }>(),
    {
      loading: false,
      totalRecords: 0,
      tableColumns: () => new Map<string, any>(), // Значение по умолчанию - пустая Map
    },
  );

  // Состояние компонента
  const tableSelection = ref<any[]>([]);
  const isTableScrollable = ref(true);

  // Список колонок для отображения в таблице (Обрабатываем TABLE_COLUMNS, если они существуют)
  const columns = computed(() => {
    const columnsList: any[] = [];

    if (props.tableColumns) {
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
    } else {
      console.warn('tableColumns не определены, невозможно отобразить колонки');
    }

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
      // Если tableColumns не определены, возвращаем пустой стиль
      if (!props.tableColumns) return '';

      // Если ID колонки можно задать меньшую ширину
      if (field === props.primaryKey) {
        return 'width: 100px';
      }
      // Для остальных колонок можно задать стандартную ширину
      return 'min-width: 200px';
    }
    return '';
  };

  const handleRowClick = (event: any) => {
    // Предотвращаем автоматический выбор строки при клике
    // if (event.originalEvent) {
    //   event.originalEvent.preventDefault();
    //   event.originalEvent.stopPropagation();
    // }
    emit('row-click', event);
  };

  const onColumnReorder = (event: any) => {
    if (typeof props.onColumnReorder === 'function') {
      props.onColumnReorder(event);
    }
  };

  // эмиттер для оповещения родителя о изменении выделенных строк, клике по строке
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

  // Функция для определения класса строки
  const getRowClass = (data: any) => {
    return {
      'field-modified': props.modifiedRows?.has(String(data.id)) || false,
    };
  };

  // Экспортируем метод для использования в родительском компоненте
  defineExpose({
    scrollToRowByIndex,
  });
</script>

<style scoped>
  .catalog-data-table {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  /* Стиль для курсора при наведении на строки таблицы */
  :deep(.p-datatable-tbody > tr) {
    cursor: pointer;
  }

  /* Стиль для подсветки новых записей */
  :deep(.field-modified) > td {
    background-color: rgba(255, 183, 77, 0.1) !important;
  }

  :deep(.field-modified) {
    outline: 2px solid #ffb74d !important;
    outline-offset: -1px;
  }

  :deep(.field-modified:hover) {
    outline-color: #ff9800 !important;
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
