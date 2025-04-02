<template>
  <div class="diam-application-list-page">
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

        <div
          v-else-if="diamApplicationList.length === 0"
          class="empty-container"
        >
          <Message severity="info">Список приложений пуст</Message>
        </div>

        <div v-else class="application-list">
          <DataTable
            :value="diamApplicationList"
            stripedRows
            responsiveLayout="scroll"
            reorderableColumns
            removableSort
            sortMode="multiple"
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
                  {{ slotProps.data[col.field] }}
                </template>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Отладочная информация -->
        <!-- <div v-if="showDebugInfo" class="debug-info">
          <h3>Отладочная информация:</h3>
          <pre>{{ JSON.stringify(diamApplicationList, null, 2) }}</pre>
        </div> -->
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useModuleStore } from "../stores/module-factory";

import Card from "primevue/card";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";
import DataTable from "primevue/datatable";
import Column from "primevue/column";

const route = useRoute();
const loading = ref(true);
const error = ref<string | null>(null);
const diamApplicationList = ref<any[]>([]);
const moduleTitle = ref("Список DIAM приложений");
const showDebugInfo = ref(false); // Флаг для отображения отладочной информации

// Колонки для таблицы
const columns = ref<Array<{ field: string; header: string }>>([]);

// Получаем ID модуля из meta-данных маршрута
const moduleId = computed(() => route.meta.moduleId as string || "");

// Функция для получения стора модуля
const getModuleStore = (moduleId: string) => {
  const moduleStore = useModuleStore(moduleId);
  if (!moduleStore) {
    throw new Error(`Модуль с ID ${moduleId} не найден`);
  }
  return moduleStore;
};

// Функция для загрузки данных
const loadDiamApplicationList = async () => {
  loading.value = true;
  error.value = null;

  try {
    const moduleStore = getModuleStore(moduleId.value);

    // Загружаем данные
    const data = await moduleStore.getDiamApplicationList();
    diamApplicationList.value = data;

    // Динамически создаем колонки на основе полученных данных
    if (data.length > 0) {
      const sampleItem = data[0];

      // Очищаем массив колонок перед добавлением новых
      columns.value = [];

      // Формируем список колонок на основе полученных данных
      const dynamicColumns = Object.keys(sampleItem)
        .filter((key) => key !== "__v" && key !== "_id") // Исключаем служебные поля
        .map((key) => {
          // Форматируем заголовки колонок
          let header =
            key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");

          // Русифицируем известные поля
          if (key === "id") header = "ID";
          if (key === "name") header = "Имя";
          if (key === "description") header = "Описание";
          if (key === "date_created") header = "Дата создания";
          if (key === "date_updated") header = "Дата обновления";

          return {
            field: key,
            header: header,
          };
        });

      // Сортируем колонки в логичном порядке
      const priorityFields = ["id", "name", "description"];

      // Сначала добавляем приоритетные поля в заданном порядке
      priorityFields.forEach((field) => {
        const column = dynamicColumns.find((col) => col.field === field);
        if (column) {
          columns.value.push(column);
        }
      });

      // Затем добавляем остальные поля
      dynamicColumns.forEach((column) => {
        if (!priorityFields.includes(column.field)) {
          columns.value.push(column);
        }
      });

      // Включаем отладочную информацию для проверки структуры данных
      showDebugInfo.value = true;
    }
  } catch (err) {
    error.value = `Ошибка при загрузке списка приложений: ${
      err instanceof Error ? err.message : String(err)
    }`;
  } finally {
    loading.value = false;
  }
};

// Инициализация и обработка изменений маршрута
onMounted(() => loadDiamApplicationList());

// Отслеживаем изменения маршрута
watch(() => route.path, loadDiamApplicationList);

// Обработка перетаскивания столбцов
const onColumnReorder = (event: any) => {
  console.log("Порядок столбцов изменен:", event);
  // Здесь можно сохранить порядок столбцов в localStorage или на сервере
};
</script>

<style scoped>
.diam-application-list-page {
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

.application-list {
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
