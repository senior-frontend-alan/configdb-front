<!-- 
Маршрутизатор отвечает за загрузку данных при переходе на страницу
Page2CatalogDetails отвечает за получение данных из стора
CatalogDataTable отвечает только за отображение данных
-->

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
          :table-columns="currentCatalog?.OPTIONS?.layout?.TABLE_COLUMNS"
          :is-table-scrollable="isTableScrollable"
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

    <div v-else class="catalog-details">
      <!-- Используем новый компонент DataTable -->
      <CatalogDataTable
        :tableRows="currentCatalog?.GET?.results || []"
        :tableColumns="currentCatalog?.OPTIONS?.layout?.TABLE_COLUMNS"
        :primaryKey="currentCatalog?.OPTIONS?.layout?.pk || 'id'"
        :hasBatchPermission="!!currentCatalog?.OPTIONS?.permitted_actions?.batch"
        :selectedItems="tableSelection"
        :onColumnReorder="onColumnReorder"
        @update:selectedItems="tableSelection = $event"
        @row-click="handleRowClick"
        :isTableScrollable="isTableScrollable"
      />
    </div>
    <!-- Статус-бар с информацией о количестве элементов -->
    <div class="status-bar">
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
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { useModuleStore } from '../../stores/module-factory';
  import { loadCatalogByNameFromGroups } from '../../router';
  import ColumnVisibilitySelector from './components/ColumnVisibilitySelector.vue';
  import CatalogDataTable from './components/DataTable.vue';
  import Message from 'primevue/message';
  import ProgressSpinner from 'primevue/progressspinner';
  import Button from 'primevue/button';

  // Получаем параметры маршрута только для навигации
  const router = useRouter();

  // Получаем moduleName, catalogName и пользовательскую функцию onRowClick из props
  const props = defineProps<{
    moduleName: string; // Обязательный параметр
    catalogName: string; // Обязательный параметр
    onRowClick?: (event: any) => void; // Опциональная пользовательская функция для обработки клика по строке
    selectedItems?: any[]; // Опциональный массив выделенных строк
  }>();

  // Состояние компонента
  // Состояние выделенных строк в таблице
  const tableSelection = ref<any[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const isTableScrollable = ref(false);

  // Из props
  const moduleName = computed(() => props.moduleName);
  const catalogName = computed(() => props.catalogName);

  const moduleStore = computed(() => useModuleStore(moduleName.value));
  const currentCatalog = computed(() => {
    return moduleStore.value?.catalogsByName[catalogName.value];
  });

  // Проверка наличия данных и метаданных
  const checkDataValidity = () => {
    if (!currentCatalog.value) {
      error.value = 'Нет данных каталога';
      return false;
    }

    if (
      !currentCatalog.value.OPTIONS ||
      !currentCatalog.value.OPTIONS.layout ||
      !currentCatalog.value.OPTIONS.layout.TABLE_COLUMNS
    ) {
      error.value = 'Не удалось получить метаданные для отображения каталога';
      return false;
    }

    return true;
  };

  const refreshData = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (!catalogName.value) {
        throw new Error('Не удалось определить catalogName для загрузки данных');
      }

      const dataLoaded = await loadCatalogByNameFromGroups(
        moduleName.value,
        catalogName.value,
        (err) => {
          if (err) {
            error.value = err.message || 'Ошибка загрузки данных';
            console.error('Ошибка при загрузке данных:', err);
          }
        },
        true, // Принудительное обновление данных, игнорируя кэш
      );

      if (dataLoaded && currentCatalog.value) {
        // Сбрасываем выбранные элементы
        tableSelection.value = [];
      }
    } finally {
      loading.value = false;
    }
  };

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

  // Клик - переход на страницу редактирования
  const handleRowClick = (event: any) => {
    console.log('Page2CatalogDetails: получено событие row-click', event);

    // Данные строки находятся в event.data
    const rowData = event.data;
    console.log('Данные строки:', rowData);

    // Переход на страницу редактирования
    if (rowData && rowData.id) {
      // Формируем URL для перехода
      const editUrl = `/${moduleName.value}/${catalogName.value}/edit/${rowData.id}`;
      console.log('Переход по URL:', editUrl);

      router.push(editUrl);
    } else {
      console.warn(
        'Не удалось получить идентификатор строки для перехода на страницу редактирования',
      );
      console.log('Полученные данные:', event);
    }
  };

  // Переход на страницу добавления новой записи
  const goToAddRecord = () => {
    const addUrl = `/${moduleName.value}/${catalogName.value}/add`;

    router.push(addUrl);
  };

  // Создаем эмиттер для оповещения ManyRelated Field (в модельном окне) о изменении выделенных строк
  const emit = defineEmits<{
    (e: 'update:selectedItems', value: any[]): void;
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

  onMounted(() => {
    // Проверяем наличие модуля
    if (!moduleStore.value) {
      error.value = `Модуль с ID ${moduleName.value} не найден`;
      loading.value = false;
      return;
    }

    // Проверяем наличие данных и метаданных
    checkDataValidity();

    // Данные должны быть загружены роутером
    loading.value = false;
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
