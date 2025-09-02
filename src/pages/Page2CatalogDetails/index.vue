<!-- 
Маршрутизатор отвечает за загрузку данных при переходе на страницу
Page2CatalogDetails отвечает за получение данных из стора
CatalogDataTable отвечает только за отображение данных

Есть важный нюанс: этот компонент используется в двух разных сценариях:

Как самостоятельная страница каталога - когда пользователь открывает страницу каталога напрямую
Как вложенный компонент - в компонентах PrimaryKeyRelated.vue и ManyRelated.vue
Во втором случае компоненты PrimaryKeyRelated и ManyRelated ожидают получить событие row-click от CatalogDetails, чтобы обработать выбор записи в модальном окне.
-->

<template>
  <div class="px-6" data-testid="table-page">
    <div class="header-container">
      <div class="title-container">
        <div>
          <h3 data-testid="table-title">
            {{ currentCatalog?.OPTIONS?.verbose_name || 'Каталог без названия' }}
            <Button
              id="refresh-button"
              icon="pi pi-refresh"
              class="p-button-rounded p-button-text"
              :disabled="loading"
              @click=""
              :loading="loading"
              aria-label="Обновить данные"
              v-tooltip="'Обновить данные'"
              data-testid="table-refresh-button"
            />
          </h3>
          <h4 v-if="filtersText" class="filters-info">{{ filtersText }}</h4>
        </div>

        <!-- Инпут для ввода ID записи и кнопка для прокрутки к ней -->
        <!--  Не удалять! -->
        <!-- <div>
          <InputText
            v-model="scrollToIdInput"
            placeholder="ID записи"
            class="p-inputtext-sm"
            style="width: 100px"
            data-testid="table-scroll-input"
          />
          <Button
            label="Перейти"
            class="p-button-sm"
            @click="scrollToRecord(scrollToIdInput)"
            :disabled="!scrollToIdInput"
            data-testid="table-scroll-button"
          />
        </div> -->
      </div>
      <div class="table-controls">
        <!-- <AddNewDataDialog :moduleName="moduleName" @data-added="refreshData" /> -->
        <Button
          icon="pi pi-plus"
          class="p-button-sm"
          aria-label="Добавить запись"
          @click="goToAddRecord"
          data-testid="table-add-button"
        />
        <ColumnVisibilitySelector
          :table-columns="currentCatalog?.OPTIONS?.layout?.TABLE_COLUMNS"
          :is-table-scrollable="isTableScrollable"
          @toggle-table-scrollable="isTableScrollable = !isTableScrollable"
        />
      </div>
    </div>

    <!-- Показываем сообщение об ошибке, если она есть -->
    <div v-if="error" class="error-container">
      <Message severity="error">{{ error }}</Message>
    </div>

    <div class="catalog-details">
      <DataTable
        ref="dataTableRef"
        :tableRows="tableRows"
        :tableColumns="currentCatalog?.OPTIONS?.layout?.TABLE_COLUMNS"
        :primaryKey="currentCatalog?.OPTIONS?.layout?.pk || 'id'"
        :selectionMode="getSelectionMode()"
        :selectedItems="tableSelection"
        :onColumnReorder="onColumnReorder"
        :loading="loading"
        :locale="userLocale"
        :modifiedRows="selectedRowsForDetailTables"
        @update:selectedItems="tableSelection = $event"
        @row-click="handleRowClick"
        @show-details-table="handleShowDetails"
        :isTableScrollable="isTableScrollable"
        :totalRecords="totalRecords"
        :showDetailsColumn="!!catalogDetailsInfo"
        :shouldShowDetailsForRow="shouldShowDetailsForRow"
        data-testid="table-datatable"
      />

      <!-- Элемент для отслеживания с помощью Intersection Observer -->
      <div ref="loadMoreTrigger" class="load-more-trigger" data-testid="table-load-more">
        <ProgressSpinner v-if="loadingMore" style="width: 30px; height: 30px" />
        <span v-else-if="!hasMoreData && totalRecords >= 20">Все данные загружены</span>
        <span v-else-if="hasMoreData">Загрузка дополнительных данных...</span>
      </div>
    </div>
    <!-- Статус-бар с информацией о количестве элементов (скрывается в модальном режиме) -->
    <div class="status-bar" v-if="!props.isModalMode" data-testid="table-status-bar">
      <div class="status-item">
        <span class="status-label">Всего:</span>
        <span class="status-value">{{ currentCatalog?.GET?.count || 0 }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Загружено:</span>
        <span class="status-value">{{ currentCatalog?.GET?.results?.length || 0 }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Выбрано:</span>
        <span class="status-value">{{ tableSelection.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
  import { useRouter } from 'vue-router';
  import { useModuleStore, type Catalog } from '../../stores/module-factory';
  import { FiltersResult } from '../../router';
  import { useSettingsStore } from '../../stores/settingsStore';
  import { getOrfetchCatalogGET, getOrFetchCatalogOPTIONS } from '../../stores/data-loaders';
  import ColumnVisibilitySelector from './components/ColumnVisibilitySelector.vue';
  import DataTable from './components/DataTable.vue';
  import Message from 'primevue/message';
  import Button from 'primevue/button';
  import ProgressSpinner from 'primevue/progressspinner';

  const router = useRouter();

  const settingsStore = useSettingsStore();
  const userLocale = computed(() => settingsStore.locale);

  const props = defineProps<{
    moduleName: string; // Обязательный параметр
    applName: string; // Обязательный параметр
    catalogName: string; // Обязательный параметр
    selectedItems?: any[]; // Опциональный массив выделенных строк
    isModalMode?: boolean; // Флаг, указывающий, что компонент отображается в модальном окне
    selectionMode?: 'single' | 'multiple' | undefined; // Режим выбора строк: одиночный или множественный, или undefined для отключения выбора
    filters?: FiltersResult; // Объект фильтров для фильтрации данных в таблице
  }>();

  // Определение режима выбора строк
  function getSelectionMode() {
    // Если компонент используется в модальном окне то selectionMode должен быть явно передан из родительского компонента
    // например в PrimaryKeyRelated.vue
    if (props.isModalMode) {
      // В модальном режиме используем значение selectionMode как есть
      return props.selectionMode;
    } else {
      // В обычном режиме страницы смотрим св-во permitted_actions.batch
      return currentCatalog.value?.OPTIONS?.permitted_actions?.batch ? 'multiple' : undefined;
    }
  }

  // Состояние компонента
  const loading = ref(true);
  const error = ref<string | null>(null);
  // Используем ref для оптимизации обновления данных при пагинации
  const tableRows = ref<any[]>([]);
  const tableSelection = ref<any[]>([]);
  const isTableScrollable = ref(false);
  const totalRecords = ref(0);

  // Локальное состояние для хранения выбранных строк для деталь-таблиц и подсветки
  const selectedRowsForDetailTables = ref<Set<string>>(new Set<string>());

  // Функция для проверки условия show_if
  const detailsShowIfFn = ref<Function | null>(null);

  // Реф для элемента триггера ленивой загрузки
  const loadMoreTrigger = ref<HTMLDivElement | null>(null);
  // Отдельный флаг для отображения загрузки дополнительных данных
  const loadingMore = ref(false);
  // Проверяем, есть ли еще данные для загрузки
  const hasMoreData = computed(() => {
    return totalRecords.value > 0 && tableRows.value.length < totalRecords.value;
  });

  // Из props
  const moduleName = computed(() => props.moduleName);
  const applName = computed(() => props.applName);
  const catalogName = computed(() => props.catalogName);

  const moduleStore = computed(() => useModuleStore(moduleName.value));
  // Устанавливаем currentCatalog из результата getOrfetchCatalogGET
  const currentCatalog = ref<Catalog | null>(null);

  // Computed свойство для получения details_info из OPTIONS
  const catalogDetailsInfo = computed(() => {
    return currentCatalog.value?.OPTIONS?.details_info || null;
  });

  // Функция для проверки условия show_if
  const shouldShowDetailsForRow = (rowData: any): boolean => {
    const detailsConfig = catalogDetailsInfo.value;
    if (!detailsConfig || !detailsConfig.show_if) {
      return !!detailsConfig; // Показываем, если есть details_info без условий
    }

    const showIf = detailsConfig.show_if;

    // Если show_if - строка с JS кодом
    if (typeof showIf === 'string') {
      try {
        if (!detailsShowIfFn.value) {
          detailsShowIfFn.value = new Function('data', showIf);
        }
        return detailsShowIfFn.value(rowData);
      } catch (error) {
        console.error('Ошибка выполнения show_if функции:', error);
        return false;
      }
    }

    // Если show_if - название поля, проверяем его значение
    if (typeof showIf === 'string' && !showIf.includes('return')) {
      return !!rowData[showIf];
    }

    return false;
  };

  // Computed свойство для отображения активных фильтров
  const filtersText = computed(() => {
    if (!props.filters || Object.keys(props.filters).length === 0) {
      return '';
    }

    const activeFilters = Object.entries(props.filters)
      .filter(([_, filterObj]) => {
        // Проверяем наличие объекта и его значения
        if (!filterObj || filterObj.value === undefined || filterObj.value === null) return false;
        if (typeof filterObj.value === 'string' && filterObj.value === '') return false;

        return true;
      })
      .map(([key, filterObj]) => {
        // Используем метку из metadata, если она есть, иначе используем ключ
        const value = filterObj.value;
        const label = filterObj.metadata?.label;
        const valueLabel = filterObj.metadata?.valueLabel;

        let displayText = `${key} = ${value}`;

        // Если есть расшифровка - добавляем
        if (label !== undefined && valueLabel !== undefined) {
          displayText += ` (${label} = ${valueLabel})`;
        } else if (label !== undefined) {
          displayText += ` (${label})`;
        }

        return displayText;
      });

    if (activeFilters.length === 0) {
      return '';
    }

    return `(фильтр: ${activeFilters.join(', ')})`;
  });

  // Обработка изменения порядка колонок
  const onColumnReorder = (event: any) => {
    const storeDetails = currentCatalog.value;
    if (!storeDetails) return;

    // Получаем новый порядок столбцов
    const newColumns = event.columns.map((col: any) => col.props.field);

    // Обновляем пользовательские настройки
    storeDetails.userSettings.displayColumns = newColumns;

    console.log('Порядок столбцов изменен:', newColumns);
  };

  // Функция для обработки клика по иконке деталей
  const handleShowDetails = (rowData: any) => {
    if (!rowData || !rowData.id) return;
    // Обновляем состояние выбранных строк
    const rowId = String(rowData.id);
    const newSet = new Set(selectedRowsForDetailTables.value);
    if (newSet.has(rowId)) {
      newSet.delete(rowId);
    } else {
      newSet.add(rowId);
    }
    // Обновляем состояние
    selectedRowsForDetailTables.value = newSet;
    // // Эмитим событие для показа деталь-таблицы в родительский компонент
    // emit('show-details-table', rowData);
  };

  const handleRowClick = (event: any) => {
    // Данные строки находятся в event.data
    // Переход на страницу редактирования только если компонент не в модальном режиме
    if (!props.isModalMode && event.data && event.data.id) {
      const editUrl = `/${moduleName.value}/${applName.value}/${catalogName.value}/edit/${event.data.id}`;

      router.push(editUrl);
    } else if (!event.data || !event.data.id) {
      console.warn(
        'Не удалось получить идентификатор строки для перехода на страницу редактирования',
      );
    }

    // В любом случае эмитим событие row-click, чтобы родительские компоненты могли его обработать
    emit('row-click', event);
  };

  // Переход на страницу добавления новой записи
  const goToAddRecord = () => {
    const addUrl = `/${moduleName.value}/${applName.value}/${catalogName.value}/add`;

    router.push(addUrl);
  };

  // Создаем эмиттер для оповещения родительских компонентов
  const emit = defineEmits<{
    (e: 'update:selectedItems', items: any[]): void;
    (e: 'virtual-scroll', event: any): void;
    (e: 'row-click', event: any): void;
    (e: 'record-selected', record: any): void;
    (e: 'show-details-table', row: any): void;
  }>();

  // Мы следим за изменениями в таблице и отправляем их родителю
  // Без первого наблюдателя выбор строк в таблице не будет отражаться в ManyRelated.vue
  watch(tableSelection, (newValue) => {
    console.log('tableSelection изменился:', newValue);
    emit('update:selectedItems', newValue);
  });

  // Мы следим за изменениями от родителя и обновляем таблицу
  // Без второго наблюдателя начальные выбранные строки из ManyRelated.vue не будут отображаться в таблице
  watch(
    () => props.selectedItems,
    (newValue) => {
      console.log('props.selectedItems изменился:', newValue);
      if (newValue && JSON.stringify(tableSelection.value) !== JSON.stringify(newValue)) {
        tableSelection.value = [...newValue];
      }
    },
    { immediate: true },
  );

  const loadCatalogData = async (offset: number) => {
    if (!moduleName.value || !catalogName.value || !applName.value) {
      console.warn('Не все необходимые параметры доступны для загрузки данных');
      return;
    }

    loading.value = true;

    // Используем фильтры напрямую из props, если они переданы
    // Преобразуем структуру фильтров для API (извлекаем только value)
    let filters: Record<string, any> | undefined = undefined;
    if (props.filters) {
      filters = {};
      Object.entries(props.filters).forEach(([key, filterObj]) => {
        filters![key] = filterObj.value;
      });
    }

    const catalogResult = await getOrfetchCatalogGET(
      moduleName.value,
      applName.value,
      catalogName.value,
      offset,
      20, // limit
      filters,
    );

    if (!catalogResult.success || !catalogResult.catalog) {
      console.error('Ошибка при загрузке каталога:', catalogResult.error?.message);
      error.value = catalogResult.error?.message || 'Ошибка при загрузке каталога';
      loading.value = false;
      return;
    }

    const { catalog, cacheKey } = catalogResult;

    // Обновляем ссылку на каталог
    currentCatalog.value = catalog;

    // Используем данные из каталога по ключу кэша
    tableRows.value = catalog && cacheKey ? catalog[cacheKey]?.results || [] : [];
    totalRecords.value =
      catalog && cacheKey ? catalog[cacheKey]?.count || tableRows.value.length : 0;

    loading.value = false;
  };

  // Функция для обработки пересечения элемента с областью видимости
  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];

    // Если элемент виден и не идет загрузка, и есть еще данные для загрузки
    if (entry.isIntersecting && !loadingMore.value && hasMoreData.value) {
      loadingMore.value = true;

      const currentLength = tableRows.value.length;

      loadCatalogData(currentLength).finally(() => {
        loadingMore.value = false;
      });
    }
  };

  // Создаем и настраиваем Intersection Observer
  let observer: IntersectionObserver | null = null;

  onMounted(async () => {
    // Проверяем наличие всех необходимых параметров перед загрузкой данных
    if (moduleName.value && applName.value && catalogName.value) {
      await loadCatalogData(0);
      await getOrFetchCatalogOPTIONS(moduleName.value, applName.value, catalogName.value);
    } else {
      console.warn('Не все параметры доступны при монтировании компонента');
      loading.value = false;
    }

    // Создаем наблюдатель, если браузер поддерживает IntersectionObserver
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(handleIntersection, {
        root: null, // используем viewport как корневой элемент
        rootMargin: '0px',
        threshold: 0.1, // срабатывает, когда 10% элемента видно
      });

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

  // Ссылка на компонент DataTable
  const dataTableRef = ref();

  // Функция для прокрутки к записи и её выделения
  const scrollToRecord = async (recordId: string) => {
    if (!recordId || !tableRows.value.length) return;

    console.log('Прокрутка к записи:', recordId);

    // Находим запись в массиве данных по ID
    const recordIndex = tableRows.value.findIndex((item) => String(item.id) === String(recordId));

    if (recordIndex === -1) {
      console.warn('Запись не найдена в текущих данных:', recordId);
      return;
    }

    // Устанавливаем выбранную запись
    tableSelection.value = [tableRows.value[recordIndex]];

    // Ждем следующего цикла рендеринга
    await nextTick();

    // Используем метод дочернего компонента для прокрутки к строке
    if (dataTableRef.value && typeof dataTableRef.value.scrollToRowByIndex === 'function') {
      dataTableRef.value.scrollToRowByIndex(recordIndex);
    } else {
      console.warn('Метод scrollToRowByIndex не найден в компоненте DataTable');
    }
  };

  // Проверяем наличие lastEditedID в хранилище после загрузки данных
  watch(
    () => tableRows.value.length,
    async () => {
      if (tableRows.value.length > 0) {
        const catalogKey = `${applName.value}_${catalogName.value.toLowerCase()}`;
        const lastEditedID = (moduleStore.value as any)[catalogKey]?.GET?.lastEditedID;

        if (lastEditedID) {
          await scrollToRecord(lastEditedID);

          // Очищаем ID после скроллинга, чтобы избежать повторной прокрутки
          // moduleStore.value.loadedCatalogsByApplName[applName][catalogName.value].GET.lastEditedID = null;
        }
      }
    },
    { immediate: true },
  );

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });
</script>

<style scoped>
  .header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .title-container {
    display: flex;
    flex-direction: column;
  }

  .filters-info {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
    margin-top: 0.25rem;
  }

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 1rem;
  }
</style>

<style scoped>
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
  /* Стили для элемента триггера ленивой загрузки */
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
