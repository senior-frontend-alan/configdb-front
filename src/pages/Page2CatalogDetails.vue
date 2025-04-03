<template>
  <div class="catalog-details-page">
    <Card>
      <template #title>
        <h4>{{ moduleTitle }}</h4>
      </template>
      <template #content>
        <div v-if="loading" class="loading-container">
          <ProgressSpinner />
          <p>Загрузка данных...</p>
        </div>

        <div v-else-if="error" class="error-container">
          <Message severity="error">{{ error }}</Message>
        </div>

        <div v-else-if="!catalogDetails" class="empty-container">
          <Message severity="info">Данные каталога отсутствуют</Message>
        </div>

        <div v-else class="catalog-details">
          <!-- Отображение в виде таблицы -->
          <DataTable
            :value="tableData"
            stripedRows
            responsiveLayout="scroll"
            reorderableColumns
            removableSort
            @column-reorder="onColumnReorder"
            class="p-datatable-sm"
          >
            <Column
              v-for="col in columns"
              :key="col.field"
              :field="col.field"
              sortable
            >
              <template #header>
                <div class="column-header-container">
                  <span class="column-header-text">{{ col.header }}</span>
                  <i
                    class="pi pi-bars column-drag-handle"
                    aria-hidden="true"
                  ></i>
                </div>
              </template>
              <template #body="slotProps">
                <!-- Форматирование даты и времени -->
                <template
                  v-if="
                    typeof col.field === 'string' &&
                    col.field.includes('date_') &&
                    slotProps.data[col.field]
                  "
                >
                  {{
                    new Date(slotProps.data[col.field]).toLocaleString("ru-RU")
                  }}
                </template>
                <!-- Обработка null-значений -->
                <template v-else-if="slotProps.data[col.field] === null">
                  <span class="text-muted">-</span>
                </template>
                <!-- Обычные значения -->
                <template v-else>
                  {{ formatValue(slotProps.data[col.field]) }}
                </template>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Отладочная информация -->
        <div v-if="showDebugInfo" class="debug-info">
          <h3>Отладочная информация:</h3>
          <h4>Данные для таблицы:</h4>
          <pre>{{ JSON.stringify(tableData, null, 2) }}</pre>
          <h4>Полные данные из стора:</h4>
          <pre>{{ JSON.stringify(catalogDetails, null, 2) }}</pre>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { useModuleStore } from "../stores/module-factory";

import Card from "primevue/card";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";
import DataTable from "primevue/datatable";
import Column from "primevue/column";

// Получаем параметры маршрута
const route = useRoute();
const viewname = computed(() => route.params.viewname as string);

// Состояние компонента
const loading = ref(true); // Начальное состояние - загрузка
const error = ref<string | null>(null);
const catalogDetails = ref<any>(null);
const showDebugInfo = ref(true); // Флаг для отображения отладочной информации

// Заголовок страницы
const moduleTitle = computed(() => {
  return `Детали каталога: ${viewname.value}`;
});

// Получаем ID модуля из meta-данных маршрута
const moduleId = computed(() => (route.meta.moduleId as string) || "");

// Функция для получения стора модуля
const getModuleStore = (moduleId: string) => {
  const moduleStore = useModuleStore(moduleId);
  if (!moduleStore) {
    throw new Error(`Модуль с ID ${moduleId} не найден`);
  }
  return moduleStore;
};

// Данные для таблицы
const tableData = computed(() => {
  try {
    const moduleStore = getModuleStore(moduleId.value);
    const details = moduleStore.catalogDetails[viewname.value];

    // Сбрасываем загрузку при любом доступе к данным
    loading.value = false;
    catalogDetails.value = details;

    if (!details) return [];

    // Если есть поле results и оно массив, возвращаем его
    return Array.isArray(details.results) ? details.results : [details];
  } catch (err) {
    console.error("Ошибка при получении данных:", err);
    error.value = `Ошибка: ${err instanceof Error ? err.message : String(err)}`;
    loading.value = false;
    return [];
  }
});

// Динамические колонки для таблицы
const columns = computed<Array<{ field: string; header: string }>>(() => {
  // Если есть данные, используем их для определения колонок
  if (tableData.value.length > 0) {
    const sampleItem = tableData.value[0];
    if (sampleItem) {
      return Object.keys(sampleItem).map((key) => ({
        field: key,
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
      }));
    }
  }
  
  // Если данных нет, но есть catalogDetails, используем схему из него
  if (catalogDetails.value && catalogDetails.value.schema) {
    return Object.keys(catalogDetails.value.schema).map((key) => ({
      field: key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
    }));
  }
  
  // Если ничего нет, возвращаем базовые колонки
  return [
    { field: "id", header: "ID" },
    { field: "name", header: "Имя" },
    { field: "description", header: "Описание" }
  ];
});

// Обработка перетаскивания столбцов
const onColumnReorder = (event: any) => {
  console.log("Порядок столбцов изменен:", event);
  // Здесь можно сохранить порядок столбцов в localStorage или на сервере
};

// Функция для форматирования значений
const formatValue = (value: any) => {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return value;
};

// Дебаг информация для отслеживания данных
watchEffect(() => {
  // Показываем отладочную информацию, если есть данные
  const data = tableData.value;
  if (data.length > 0) {
    showDebugInfo.value = true;
    console.log(
      `Загружено ${data.length} записей, колонок: ${columns.value.length}`
    );
  }
});
</script>

<style scoped>
.catalog-details-page {
  padding: 1rem;
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

.text-muted {
  color: var(--text-color-secondary);
  font-style: italic;
}

.debug-info {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: auto;
}

.debug-info pre {
  white-space: pre-wrap;
  word-break: break-all;
}

/* Стили для заголовков столбцов */
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

/* Стили для сортировки */
:deep(.p-datatable .p-sortable-column:focus) {
  box-shadow: none;
  outline: none;
}

:deep(.p-datatable .p-sortable-column.p-highlight) {
  background-color: var(--surface-hover);
}
</style>
