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
  <div class="catalog-details-page">
    <div class="header-container">
      <div class="title-container">
        <h3>{{ currentCatalog?.OPTIONS?.verbose_name || 'Каталог без названия' }}</h3>

        <!-- Инпут для ввода ID записи и кнопка для прокрутки к ней -->
        <div class="scroll-to-id-container">
          <InputText
            v-model="scrollToIdInput"
            placeholder="ID записи"
            class="p-inputtext-sm"
            style="width: 100px"
          />
          <Button
            label="Перейти"
            class="p-button-sm"
            @click="scrollToRecord(scrollToIdInput)"
            :disabled="!scrollToIdInput"
          />
        </div>

        <Button
          id="refresh-button"
          icon="pi pi-refresh"
          class="p-button-rounded p-button-text"
          :disabled="loading"
          @click=""
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
        :selectionMode="currentCatalog?.OPTIONS?.permitted_actions?.batch ? 'multiple' : undefined"
        :selectedItems="tableSelection"
        :onColumnReorder="onColumnReorder"
        :loading="loading"
        :locale="userLocale"
        @update:selectedItems="tableSelection = $event"
        @row-click="handleRowClick"
        :isTableScrollable="isTableScrollable"
        :totalRecords="totalRecords"
      />

      <!-- Элемент для отслеживания с помощью Intersection Observer -->
      <div ref="loadMoreTrigger" class="load-more-trigger">
        <ProgressSpinner v-if="loadingMore" style="width: 30px; height: 30px" />
        <span v-else-if="!hasMoreData && totalRecords >= 20">Все данные загружены</span>
        <span v-else-if="hasMoreData">Загрузка дополнительных данных...</span>
      </div>
    </div>
    <!-- Статус-бар с информацией о количестве элементов (скрывается в модальном режиме) -->
    <div class="status-bar" v-if="!props.isModalMode">
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
  import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue';
  import { useRouter } from 'vue-router';
  import { useModuleStore } from '../../stores/module-factory';
  import { useSettingsStore } from '../../stores/settingsStore';
  import { getOrfetchCatalog } from '../../stores/data-loaders';
  import ColumnVisibilitySelector from './components/ColumnVisibilitySelector.vue';
  import DataTable from './components/DataTable.vue';
  import Message from 'primevue/message';
  import Button from 'primevue/button';
  import InputText from 'primevue/inputtext';

  const router = useRouter();

  const settingsStore = useSettingsStore();
  const userLocale = computed(() => settingsStore.locale);

  const props = defineProps<{
    moduleName: string; // Обязательный параметр
    applName: string; // Обязательный параметр
    catalogName: string; // Обязательный параметр
    selectedItems?: any[]; // Опциональный массив выделенных строк
    isModalMode?: boolean; // Флаг, указывающий, что компонент отображается в модальном окне
    selectionMode?: 'single' | 'multiple'; // Режим выбора строк: одиночный или множественный
  }>();

  // Состояние компонента
  const loading = ref(true);
  const error = ref<string | null>(null);
  // Используем ref для оптимизации обновления данных при пагинации
  const tableRows = ref<any[]>([]);
  const tableSelection = ref<any[]>([]);
  const isTableScrollable = ref(false);
  const totalRecords = ref(0);
  const scrollToIdInput = ref<string>(''); // Инпут для ввода ID записи

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
  const currentCatalog = computed(() => {
    return moduleStore.value?.loadedCatalogsByApplName[applName.value][catalogName.value];
  });

  // НЕ удалять!
  // const refreshData = async () => {
  //   loading.value = true;
  //   error.value = null;

  //   try {
  //     if (!catalogName.value) {
  //       throw new Error('Не удалось определить catalogName для загрузки данных');
  //     }

  //     const dataLoaded = await CacheService.ensureCatalogLoaded(
  //       moduleName.value,
  //       catalogName.value,
  //       (err?: any) => {
  //         if (err) {
  //           error.value = err.message || 'Ошибка загрузки данных';
  //           console.error('Ошибка при загрузке данных:', err);
  //         }
  //       },
  //       true, // Принудительное обновление данных, игнорируя кэш
  //     );

  //     if (dataLoaded && currentCatalog.value) {
  //       // Сбрасываем выбранные элементы
  //       tableSelection.value = [];
  //     }
  //   } finally {
  //     loading.value = false;
  //   }
  // };

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

  const handleRowClick = (event: any) => {
    // Данные строки находятся в event.data
    const rowData = event.data;
    console.log('Данные строки:', rowData);

    // Переход на страницу редактирования только если компонент не в модальном режиме
    if (!props.isModalMode && rowData && rowData.id) {
      // Формируем URL для перехода
      const editUrl = `/${moduleName.value}/${applName.value}/${catalogName.value}/edit/${rowData.id}`;
      console.log('Переход по URL:', editUrl);

      router.push(editUrl);
    } else if (!rowData || !rowData.id) {
      console.warn(
        'Не удалось получить идентификатор строки для перехода на страницу редактирования',
      );
      console.log('Полученные данные:', event);
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
    (e: 'update:selectedItems', value: any[]): void;
    (e: 'virtual-scroll', event: any): void;
    (e: 'row-click', event: any): void;
    (e: 'record-selected', record: any): void;
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
    if (!moduleName.value || !catalogName.value) return;

    loading.value = true;

    const catalogResult = await getOrfetchCatalog(
      moduleName.value,
      applName.value,
      catalogName.value,
      offset,
    );

    loading.value = false;

    if (!catalogResult.success) {
      console.error('Ошибка при загрузке каталога !catalogResult.success');
      return;
    }

    const { catalog, newItems } = catalogResult;

    if (!catalog) {
      console.error('Каталог не найден в результате');
      return;
    }

    console.log('Новые записи:', newItems);

    // Если это первая загрузка, заменяем все данные
    if (offset === 0) {
      tableRows.value = catalog.GET.results || [];
    } else if (newItems && newItems.length > 0) {
      // Если это дозагрузка, добавляем только новые данные к существующим
      // Используем push вместо создания нового массива, чтобы избежать перерисовки всей таблицы
      newItems.forEach((item: any) => tableRows.value.push(item));
    }

    totalRecords.value = catalog.GET.count;
    console.log('tableRows после обновления:', tableRows.value);
    console.log('totalRecords после обновления:', totalRecords.value);
  };

  // Обработчик события load-more для ленивой загрузки при скролле
  const loadMoreData = async (event: { first: number; rows: number }) => {
    console.log('loadMoreData вызван с параметрами:', event);
    const { first } = event;

    // Если загружены все данные, не загружаем больше
    if (totalRecords.value && tableRows.value.length >= totalRecords.value) {
      console.log('Все данные уже загружены');
      loadingMore.value = false;
      return;
    }

    // Используем first как offset для загрузки данных
    await loadCatalogData(first);

    loadingMore.value = false;
  };

  // Функция для обработки пересечения элемента с областью видимости
  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];

    // Если элемент виден и не идет загрузка, и есть еще данные для загрузки
    if (entry.isIntersecting && !loadingMore.value && hasMoreData.value) {
      loadingMore.value = true;

      const currentLength = tableRows.value.length;
      const rows = 20; // Количество записей для загрузки

      // Вызываем функцию загрузки данных с текущим смещением
      loadMoreData({ first: currentLength, rows });
    }
  };

  // Создаем и настраиваем Intersection Observer
  let observer: IntersectionObserver | null = null;

  onMounted(async () => {
    await loadCatalogData(0);

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

  // Проверяем наличие recordIdToScroll в хранилище после загрузки данных
  watch(
    () => tableRows.value.length,
    async () => {
      if (tableRows.value.length > 0) {
        // Проверяем наличие ID для скроллинга в хранилище
        const recordIdToScroll =
          moduleStore.value.loadedCatalogsByApplName[applName.value][catalogName.value]?.GET
            ?.recordIdToScroll;

        if (recordIdToScroll) {
          console.log(`Найден recordIdToScroll в хранилище: ${recordIdToScroll}`);
          await scrollToRecord(recordIdToScroll);

          // Очищаем ID после скроллинга, чтобы избежать повторной прокрутки
          // moduleStore.value.loadedCatalogsByApplName[applName][catalogName.value].GET.recordIdToScroll = null;
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
