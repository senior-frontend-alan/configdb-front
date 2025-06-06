<!-- 
Родительский компонент Page2CatalogDetails/index.vue теперь отвечает за загрузку и подготовку данных
DataTable.vue чисто презентационный и отвечает только за отображение данных

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
          :value="displayedRows"
          stripedRows
          responsiveLayout="scroll"
          reorderableColumns
          removableSort
          @column-reorder="onColumnReorder"
          class="p-datatable-sm transparent-header inner-shadow"
          v-model:selection="tableSelection"
          :selection-mode="hasBatchPermission ? 'multiple' : 'single'"
          :dataKey="primaryKey"
          :scrollable="true"
          :resizableColumns="true"
          columnResizeMode="fit"
          @row-click="handleRowClick"
          :loading="props.loading"
          :totalRecords="props.totalRecords || 0"
          showGridlines
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

        <div v-if="!displayedRows.length" class="empty-container">
          <Message severity="info">Данные отсутствуют</Message>
        </div>

        <!-- Элемент для отслеживания с помощью Intersection Observer -->
        <div v-else ref="loadMoreTrigger" class="load-more-trigger">
          <ProgressSpinner v-if="props.loading" style="width: 30px; height: 30px" />
          <span v-else-if="!hasMoreData">Все данные загружены</span>
          <span v-else>Загрузка дополнительных данных...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, h, onMounted, onUnmounted } from 'vue';
  import type { Component } from 'vue';
  import PrimeDataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Message from 'primevue/message';
  import ProgressSpinner from 'primevue/progressspinner';
  // Импортируем динамические компоненты полей
  import { dynamicField } from './fields';
  // CatalogService теперь используется в родительском компоненте

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
    loading?: boolean;
    totalRecords?: number;
  }>();

  // Состояние компонента
  const tableSelection = ref<any[]>([]);
  const isTableScrollable = ref(true);

  // Настройки пагинации и отображения таблицы

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

  // Используем данные из props
  const displayedRows = computed(() => {
    return props.tableRows || [];
  });

  // Вычисляемое свойство для определения, есть ли еще данные для загрузки
  const hasMoreData = computed(() => {
    return props.totalRecords !== undefined && props.tableRows.length < props.totalRecords;
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
    console.log('Передаем в родительский компонент:', event);

    emit('row-click', event);
  };

  const onColumnReorder = (event: any) => {
    if (typeof props.onColumnReorder === 'function') {
      props.onColumnReorder(event);
    }
  };

  // Флаг для предотвращения множественных загрузок
  const isLoading = ref(false);

  // Ссылка на элемент для отслеживания
  const loadMoreTrigger = ref<HTMLElement | null>(null);

  // Обработчик для Intersection Observer
  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];

    // Если элемент виден и не идет загрузка и есть еще данные для загрузки
    if (entry.isIntersecting && !props.loading && hasMoreData.value) {
      // Предотвращаем множественные загрузки
      if (isLoading.value) return;

      isLoading.value = true;

      // Вычисляем параметры для загрузки следующей порции данных
      const currentLength = props.tableRows?.length || 0;
      const rows = 20; // Количество записей для загрузки, можно настроить через props

      console.log(`Загрузка данных, начиная с ${currentLength}, количество: ${rows}`);

      // Отправляем событие родительскому компоненту с правильным offset
      emit('load-more', { first: currentLength, rows });

      // Сбрасываем флаг загрузки через некоторое время
      setTimeout(() => {
        isLoading.value = false;
      }, 1000);
    }
  };

  // Создаем и настраиваем Intersection Observer
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    // Создаем наблюдатель только если он поддерживается браузером
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(handleIntersection, {
        root: null, // используем viewport как корневой элемент
        rootMargin: '0px',
        threshold: 0.1, // срабатывает, когда 10% элемента видно
      });

      // Начинаем наблюдение, если элемент существует
      if (loadMoreTrigger.value) {
        observer.observe(loadMoreTrigger.value);
      }
    }
  });

  // Обновляем наблюдение при изменении элемента
  watch(loadMoreTrigger, (newValue) => {
    if (observer && newValue) {
      observer.disconnect();
      observer.observe(newValue);
    }
  });

  // Очищаем наблюдатель при размонтировании компонента
  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });

  // Удалили неиспользуемую функцию onLazyLoad, так как мы теперь используем Intersection Observer

  // Создаем эмиттер для оповещения родителя о изменении выделенных строк, клике по строке и ленивой загрузке
  const emit = defineEmits<{
    (e: 'row-click', event: any): void;
    (e: 'selection-change', selection: any[]): void;
    (e: 'update:selectedItems', value: any[]): void;
    (e: 'load-more', options: { first: number; rows: number }): void;
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
