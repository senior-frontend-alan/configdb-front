<!-- 
Имеет 2 режима работы 
Режим 1: Получение данных через props.tableRows и props.tableColumns
Режим 2: Самостоятельная загрузка данных через catalogDescriptor


Используется PrimaryKeyRelated который формирует строки и стобцы сразу
Используется в DataTableInfinite который умеет загружать данные бесконечно


Маршрутизатор
    ↓ (загружает данные при переходе на страницу)
  Page2CatalogDetails
    ↓ (получает данные из стора, подготавливает их)
  DataTable
    ↓ (только отображает данные)

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
          :value="props.catalogDescriptor ? tableRows : props.tableRows"
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
          :totalRecords="props.catalogDescriptor ? totalRecords : props.totalRecords || 0"
          showGridlines
          rowHover
          data-testid="table-prime"
          :expandedRows="expandedRows"
        >
          <!-- Слот для футера с элементом бесконечной загрузки должен быть тут чтобы срабатывать когда первая загрузка таблицы не до низа -->
          <template #footer v-if="!!props.catalogDescriptor && tableRows.length < totalRecords">
            <div
              ref="loadMoreTrigger"
              class="load-more-trigger"
              data-testid="table-load-more"
              style="
                height: 30px;
                width: 100%;
                background-color: #f8f9fa;
                text-align: center;
                padding: 5px;
              "
            >
              <div class="load-more-text">Загрузка дополнительных данных...</div>
            </div>
          </template>
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

          <!-- Колонка для расширения строк -->
          <!-- Скрываем стрелку разворачивания для строк, которые не должны её показывать через CSS чтобы не ломать механизм через слоты-->
          <Column v-if="catalogDetailsInfo" expander style="width: 3rem" />

          <!-- Остальные колонки -->
          <Column
            v-if="columns && columns.length > 0"
            v-for="col in props.catalogDescriptor ? columns : props.tableColumns"
            :key="col.field"
            :field="col.field"
            :header="col.header"
            :sortable="true"
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

          <!-- Слот для вложенной таблицы -->
          <template #expansion="slotProps">
            <div class="p-3 nested-table-container">
              <!-- Рекурсивно используем DataTable для вложенной таблицы -->
              <DataTable
                v-if="catalogDetailsInfo"
                :catalogDescriptor="{
                  // Не указываем moduleName, чтобы система искала каталог по всем модулям
                  applName: catalogDetailsInfo?.appl_name || '',
                  catalogName: catalogDetailsInfo?.view_name || '',
                  filters: catalogDetailsInfo?.primary_field
                    ? {
                        [catalogDetailsInfo.primary_field]:
                          slotProps.data[
                            currentCatalog?.value?.OPTIONS?.layout?.primary_key || 'id'
                          ],
                      }
                    : {},
                }"
                primaryKey="id"
                data-testid="nested-datatable"
              />
            </div>
          </template>
        </PrimeDataTable>

        <div
          v-if="props.catalogDescriptor ? !tableRows.length : !(props.tableRows || []).length"
          class="empty-container flex justify-content-center align-items-center"
        >
          <Message severity="secondary" variant="simple">Данные отсутствуют</Message>
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
  import Button from 'primevue/button';
  import { getOrfetchCatalogGET, getOrFetchCatalogOPTIONS } from '../../../stores/data-loaders';
  import type { Catalog } from '../../../stores/module-factory';
  // Импортируем динамические компоненты полей
  import { dynamicField } from './fields';

  const resolveComponent = (component: any, value: any, metadata: any): Component => {
    // Если компонент является фабрикой, вызываем ее с переданными параметрами
    if (component && 'factory' in component && component.factory) {
      // Передаем локаль как отдельный третий параметр
      return component(value, metadata);
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
      tableRows?: any[];
      tableColumns?: Map<string, any>;
      primaryKey: string;
      selectedItems?: any[];
      onColumnReorder?: (event: any) => void;
      isTableScrollable?: boolean;
      totalRecords?: number;
      selectionMode?: 'single' | 'multiple' | undefined;
      modifiedRows?: Set<string>; // Множество ID измененных строк
      // бесконечная загрузка автоматически включается при наличии catalogDescriptor
      catalogDescriptor?: {
        moduleName?: string; // Имя модуля для загрузки данных
        applName: string; // Имя приложения для загрузки данных
        catalogName: string; // Имя каталога для загрузки данных
        filters?: Record<string, any>;
      };
    }>(),
    {
      totalRecords: 0,
      tableColumns: () => new Map<string, any>(), // Значение по умолчанию - пустая Map
    },
  );

  // Состояние компонента
  const tableSelection = ref<any[]>([]);

  // Состояние развернутых строк для вложенных таблиц
  const expandedRows = ref<Record<string, boolean>>({});

  // Функция для проверки условия show_if
  const detailsShowIfFn = ref<Function | null>(null);

  // Объявляем currentCatalog перед использованием в computed
  const currentCatalog = ref<Catalog | null>(null);

  // Вычисляемое свойство для получения details_info из OPTIONS
  const catalogDetailsInfo = computed(() => {
    const detailsInfo = currentCatalog.value?.OPTIONS?.details_info;
    // console.log('-------->>>>> catalogDetailsInfo:', detailsInfo);
    // console.log('-------->>>>> currentCatalog.moduleName:', currentCatalog.value?.moduleName);
    return detailsInfo || null;
  });
  // Локальные переменные для данных таблицы
  // Если props.catalogDescriptor задан, эти переменные будут заполнены из загруженных данных
  // Если props.catalogDescriptor не задан, используются данные из props.tableRows и props.totalRecords
  const tableRows = ref<any[]>([]);
  const totalRecords = ref<number>(0);

  // Состояние для бесконечной загрузки
  const offset = ref(0);
  const limit = ref(20);

  // Список колонок для отображения в таблице
  const columns = computed(() => {
    // Если нет каталога, возвращаем пустой массив
    if (!props.catalogDescriptor || !currentCatalog.value?.OPTIONS?.layout?.TABLE_COLUMNS) {
      return [];
    }

    const columnsList: any[] = [];
    const tableColumns = currentCatalog.value.OPTIONS.layout.TABLE_COLUMNS;

    try {
      // Обрабатываем как Map
      if (tableColumns instanceof Map) {
        tableColumns.forEach((columnData: any, fieldName: string) => {
          // Фильтруем только видимые поля
          if (columnData.VISIBLE !== false) {
            columnsList.push({
              field: fieldName,
              header: columnData.TITLE || fieldName,
              sortable: true,
              frontendClass: columnData.FRONTEND_CLASS || 'char',
              metadata: columnData,
            });
          }
        });
      }
      // Обрабатываем как обычный объект
      else {
        Object.entries(tableColumns).forEach(([fieldName, columnData]: [string, any]) => {
          if (columnData.VISIBLE !== false) {
            columnsList.push({
              field: fieldName,
              header: columnData.TITLE || fieldName,
              sortable: true,
              frontendClass: columnData.FRONTEND_CLASS || 'char',
              metadata: columnData,
            });
          }
        });
      }
    } catch (error) {
      console.error('Ошибка при обработке TABLE_COLUMNS:', error);
    }
    return columnsList;
  });

  const getColumnFrontendClass = (fieldName: string): string => {
    // Вариант 1: Используем props.tableColumns
    if (props.tableColumns && props.tableColumns.has(fieldName)) {
      return props.tableColumns.get(fieldName)?.FRONTEND_CLASS || '';
    }

    // Вариант 2: Используем данные из OPTIONS.layout.TABLE_COLUMNS каталога
    if (props.catalogDescriptor && currentCatalog.value?.OPTIONS?.layout?.TABLE_COLUMNS) {
      const tableColumns = currentCatalog.value.OPTIONS.layout.TABLE_COLUMNS;

      // Проверяем, является ли TABLE_COLUMNS объектом Map
      if (tableColumns instanceof Map) {
        return tableColumns.get(fieldName)?.FRONTEND_CLASS || '';
      } else {
        return tableColumns[fieldName]?.FRONTEND_CLASS || '';
      }
    }

    return '';
  };

  // Функция для получения метаданных поля
  const getFieldMetadata = (fieldName: string): any => {
    // Вариант 1: Используем props.tableColumns
    if (props.tableColumns && props.tableColumns.has(fieldName)) {
      return props.tableColumns.get(fieldName);
    }

    // Вариант 2: Используем данные из OPTIONS.layout.TABLE_COLUMNS каталога
    if (props.catalogDescriptor && currentCatalog.value?.OPTIONS?.layout?.TABLE_COLUMNS) {
      const tableColumns = currentCatalog.value.OPTIONS.layout.TABLE_COLUMNS;

      // Проверяем, является ли TABLE_COLUMNS объектом Map
      if (tableColumns instanceof Map) {
        return tableColumns.get(fieldName) || null;
      } else {
        return tableColumns[fieldName] || null;
      }
    }

    return null;
  };
  // Функция для проверки условия show_if
  const shouldShowDetailsForRow = (rowData: any): boolean => {
    const detailsConfig = catalogDetailsInfo.value;
    if (!detailsConfig) {
      return false;
    }

    // Если нет условия show_if, показываем иконку для всех строк
    const showIf = detailsConfig.show_if;
    if (!showIf) {
      return true;
    }

    // Обработка строкового условия (функция JavaScript)
    try {
      // Кэшируем скомпилированную функцию
      detailsShowIfFn.value ||= new Function('data', showIf);
      const result = detailsShowIfFn.value(rowData);
      return result;
    } catch (error) {
      console.error('Ошибка выполнения show_if функции:', error);
      return false;
    }
    return true;
  };

  // // Функция для определения стиля колонки
  // const getColumnStyle = (field: string) => {
  //   if (!isTableScrollable.value) return '';

  //   // Если ID колонки, задаем меньшую ширину
  //   if (field === props.primaryKey) {
  //     return 'width: 80px; min-width: 80px';
  //   }

  //   // Если есть метаданные поля и в них указана ширина
  //   const metadata = getFieldMetadata(field);
  //   if (metadata?.WIDTH) {
  //     return `width: ${metadata.WIDTH}px; min-width: ${metadata.WIDTH}px`;
  //   }

  //   // Получаем тип поля из метаданных
  //   const frontendClass = getColumnFrontendClass(field);

  //   // По умолчанию для текстовых полей
  //   if (frontendClass === 'char' || frontendClass === 'text') {
  //     return 'width: 200px; min-width: 200px';
  //   }

  //   // Для числовых полей
  //   if (frontendClass === 'number' || frontendClass === 'integer') {
  //     return 'width: 120px; min-width: 120px';
  //   }

  //   // Для дат
  //   if (frontendClass === 'date' || frontendClass === 'datetime') {
  //     return 'width: 150px; min-width: 150px';
  //   }

  //   // Для булевых полей
  //   if (frontendClass === 'boolean') {
  //     return 'width: 100px; min-width: 100px';
  //   }

  //   // По умолчанию
  //   return 'width: 150px; min-width: 150px';
  // };

  // Функция для определения класса строки
  const getRowClass = (rowData: any) => {
    const classes = [];

    // Добавляем класс для измененных строк
    if (props.modifiedRows?.has(rowData[props.primaryKey])) {
      classes.push('field-modified');
    }

    // Добавляем класс для строк, которые не должны показывать стрелку разворачивания
    if (catalogDetailsInfo && !shouldShowDetailsForRow(rowData)) {
      classes.push('hide-expander');
    }

    return classes.join(' ');
  };

  const handleRowClick = (event: any) => {
    // При необходимости можно добавить логику обработки клика по строке
    console.log('Row clicked:', event.data);
  };

  const onColumnReorder = (event: any) => {
    if (typeof props.onColumnReorder === 'function') {
      props.onColumnReorder(event);
    }
  };

  // эмиттер для оповещения родителя о изменении выделенных строк, клике по строке
  const emit = defineEmits<{
    (e: 'row-click', rowData: any): void;
    (e: 'selection-change', items: any[]): void;
    (e: 'update:selectedItems', items: any[]): void;
    (e: 'show-details', rowData: any): void;
    (e: 'load-more'): void; // Событие для загрузки дополнительных данных
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

  // -------------ОБСЕРВЕР и логика бесконечной загрузки-------------------
  const loadMoreTrigger = ref<HTMLDivElement | null>(null);
  let observer: IntersectionObserver | null = null;

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    // Если элемент виден и есть еще данные для загрузки
    if (
      entries[0].isIntersecting &&
      tableRows.value.length < totalRecords.value &&
      props.catalogDescriptor
    ) {
      const { moduleName, applName, catalogName, filters } = props.catalogDescriptor;

      if (!moduleName || !catalogName || !applName) return;

      // Сохраняем текущее смещение для загрузки
      const currentOffset = offset.value;

      // Загружаем данные с текущим смещением
      loadCatalogData({
        moduleName,
        applName,
        catalogName,
        offset: currentOffset,
        limit: limit.value,
        filters,
      });

      // Увеличиваем смещение для следующей загрузки
      // Важно: увеличиваем offset ПОСЛЕ вызова loadCatalogData
      offset.value += limit.value;
    }
  };

  // -------------Логика ЗАГРУЗКИ данных -------------------

  const loadCatalogData = async (params: {
    moduleName?: string;
    applName: string;
    catalogName: string;
    offset?: number;
    limit?: number;
    filters?: Record<string, any>;
  }) => {
    const catalogResult = await getOrfetchCatalogGET(params);

    if (!catalogResult.success || !catalogResult.catalog) {
      // Устанавливаем totalRecords равным текущему количеству записей,
      // чтобы предотвратить дальнейшую загрузку
      totalRecords.value = tableRows.value.length;
      return;
    }

    const { catalog, cacheKey, newResults = [] } = catalogResult;
    currentCatalog.value = catalog;

    if (catalog && cacheKey && catalog[cacheKey]?.count !== undefined) {
      totalRecords.value = catalog[cacheKey].count;
    }

    const existingResults = tableRows.value || [];

    // Объединяем данные в зависимости от смещения
    tableRows.value =
      params.offset === 0 || params.offset === undefined
        ? newResults // Первая загрузка - заменяем все данные
        : [...existingResults, ...newResults]; // Подгрузка - добавляем к существующимые данные
  };

  const setupObserver = () => {
    if ('IntersectionObserver' in window && loadMoreTrigger.value) {
      // Создаем наблюдатель только если его еще нет
      if (!observer) {
        observer = new IntersectionObserver(handleIntersection, {
          root: null, // используем viewport как корневой элемент
          rootMargin: '0px',
          threshold: 0.1, // срабатывает, когда 10% элемента видно
        });
        console.log('Создан новый наблюдатель IntersectionObserver');
      }

      // IntersectionObserver автоматически игнорирует повторные вызовы observe для одного и того же элемента
      observer.observe(loadMoreTrigger.value);

      // Проверяем, виден ли элемент загрузки сразу после рендеринга
      // Это нужно, потому что IntersectionObserver не срабатывает для элементов,
      // которые уже видны при создании наблюдателя
      setTimeout(() => {
        if (loadMoreTrigger.value) {
          const rect = loadMoreTrigger.value.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

          // Если элемент уже виден и есть еще данные для загрузки, загружаем их
          if (isVisible && tableRows.value.length < totalRecords.value && props.catalogDescriptor) {
            const { moduleName, applName, catalogName, filters } = props.catalogDescriptor;
            if (applName && catalogName) {
              loadCatalogData({
                moduleName,
                applName,
                catalogName,
                offset: offset.value,
                limit: limit.value,
                filters,
              });
            }
          }
        }
      }, 100); // Небольшая задержка для уверенности, что DOM обновился
    }
  };

  onMounted(async () => {
    if (!props.catalogDescriptor) return;
    const { moduleName, applName, catalogName, filters } = props.catalogDescriptor;

    if (!catalogName || !applName) {
      console.warn('Не все необходимые параметры доступны для загрузки данных');
      return;
    }

    console.log('------------Загрузка данных для каталога:', moduleName, applName, catalogName);
    // Сначала загружаем метаданные каталога (OPTIONS)
    const optionsResult = await getOrFetchCatalogOPTIONS({
      moduleName,
      applName,
      catalogName,
    });

    // Если не удалось загрузить метаданные, прерываем загрузку
    if (!optionsResult.success) {
      return;
    }

    await loadCatalogData({
      moduleName,
      applName,
      catalogName,
      offset: 0,
      limit: 20,
      filters,
    });

    setupObserver();
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  const refreshData = async () => {
    if (!props.catalogDescriptor) return;
    const { moduleName, applName, catalogName, filters } = props.catalogDescriptor;

    if (!moduleName || !catalogName || !applName) {
      console.warn('Не все необходимые параметры доступны для обновления данных');
      return;
    }

    // Сбрасываем смещение и загружаем данные с начала
    offset.value = 0;
    await loadCatalogData({
      moduleName,
      applName,
      catalogName,
      offset: 0,
      limit: 20,
      filters,
    });
    await getOrFetchCatalogOPTIONS({
      moduleName,
      applName,
      catalogName,
    });
  };

  // Экспортируем методы для использования в родительском компоненте
  defineExpose({
    scrollToRowByIndex,
    refreshData,
  });
</script>

<style scoped>
  .catalog-data-table {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  /* Скрытие кнопки разворачивания для строк, которые не должны её показывать */
  :deep(.hide-expander .p-datatable-row-toggle-button) {
    display: none !important;
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

  :deep(.p-datatable-gridlines .p-datatable-thead > tr > th) {
    /* background-color: var(--p-floatlabel-color); */
    background-color: #f0f5fb;
    white-space: normal;
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
