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

        <div v-else-if="!tableData.length" class="empty-container">
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
            <!-- Колонка с чекбоксами для массового выделения, если разрешены batch операции -->
            <Column v-if="hasBatchPermission" selectionMode="multiple" headerStyle="width: 3rem">
              <template #body="{ data }">
                <Checkbox 
                  v-model="selectedItems" 
                  :value="data[primaryKey]" 
                  :binary="false"
                  @change="onSelectionChange"
                />
              </template>
              <template #header>
                <Checkbox 
                  v-model="selectAll" 
                  :binary="true" 
                  @change="onSelectAllChange"
                />
              </template>
            </Column>
            
            <!-- Динамические колонки -->
            <Column 
              v-for="col in columns" 
              :key="col.field" 
              :field="col.field" 
              :header="col.header"
              sortable
            >
              <template #header>
                <div class="column-header-container">
                  <span class="column-header-text">{{ col.header }}</span>
                  <i class="pi pi-bars column-drag-handle" aria-hidden="true"></i>
                </div>
              </template>
              <template #body="{ data }">
                <span v-if="!data[col.field]" class="text-muted">-</span>
                <span v-else>{{ formatValue(data[col.field]) }}</span>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useModuleStore } from "../stores/module-factory";
import { useNGCore } from "../backend/ngcore";
import { LayoutClasses } from "../backend/layout";

import Card from "primevue/card";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";

// Получаем параметры маршрута
const route = useRoute();
const viewname = computed(() => route.params.viewname as string);

// Состояние компонента
const loading = ref(true);
const error = ref<string | null>(null);
const selectedItems = ref<any[]>([]);
const selectAll = ref(false);
const tableData = ref<any[]>([]);
const columns = ref<Array<{ field: string; header: string }>>([]);
const primaryKey = ref('id');
const hasBatchPermission = ref(false);

// Заголовок страницы
const moduleTitle = computed(() => {
  return `Детали каталога: ${viewname.value}`;
});

// Получаем ID модуля из meta-данных маршрута
const moduleId = computed(() => (route.meta.moduleId as string) || "");

// Загрузка данных при монтировании компонента
onMounted(async () => {
  try {
    // Получаем модуль
    const moduleStore = useModuleStore(moduleId.value);
    if (!moduleStore) {
      throw new Error(`Модуль с ID ${moduleId.value} не найден`);
    }
    
    // Получаем детали каталога
    const storeDetails = moduleStore.catalogDetails[viewname.value];
    if (!storeDetails || !storeDetails.GET || !storeDetails.GET.results) {
      loading.value = false;
      return;
    }
    
    // Устанавливаем данные для таблицы
    tableData.value = storeDetails.GET.results;
    
    // Определяем первичный ключ
    if (storeDetails.OPTIONS && storeDetails.OPTIONS.layout) {
      primaryKey.value = storeDetails.OPTIONS.layout.primary_key || 'id';
    }
    
    // Проверяем разрешения на пакетные операции
    if (
      storeDetails.OPTIONS && 
      storeDetails.OPTIONS.permitted_actions && 
      storeDetails.OPTIONS.permitted_actions.batch
    ) {
      hasBatchPermission.value = true;
    }
    
    // Определяем колонки
    if (
      storeDetails.OPTIONS && 
      storeDetails.OPTIONS.layout && 
      Array.isArray(storeDetails.OPTIONS.layout.elements)
    ) {
      // Функция для рекурсивного обхода элементов макета
      const processLayoutElements = (elements: any[]): any[] => {
        let result: any[] = [];
        
        elements.forEach(elem => {
          // Если это обычное поле с label и name
          if (elem.label && elem.name) {
            result.push({
              field: elem.name,
              header: elem.label
            });
          }
          
          // Если это секция или строка с вложенными элементами
          if (elem.elements && Array.isArray(elem.elements)) {
            result = [...result, ...processLayoutElements(elem.elements)];
          }
        });
        
        return result;
      };
      
      // Получаем все колонки из макета
      columns.value = processLayoutElements(storeDetails.OPTIONS.layout.elements);
      
      // Проверяем наличие date_created и date_updated в данных
      if (tableData.value.length > 0) {
        const columnFields = columns.value.map(col => col.field);
        
        if (
          tableData.value[0].date_created &&
          !columnFields.includes("date_created")
        ) {
          columns.value.push({
            field: "date_created",
            header: "Дата создания"
          });
        }
        
        if (
          tableData.value[0].date_updated &&
          !columnFields.includes("date_updated")
        ) {
          columns.value.push({
            field: "date_updated",
            header: "Дата обновления"
          });
        }
      }
    } else if (tableData.value.length > 0) {
      // Если нет макета, но есть данные, создаем колонки на основе данных
      columns.value = Object.keys(tableData.value[0]).map((key) => ({
        field: key,
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
      }));
    } else {
      // Базовые колонки, если ничего нет
      columns.value = [
        { field: "id", header: "ID" },
        { field: "name", header: "Название" },
        { field: "description", header: "Описание" }
      ];
    }
    
    // Логируем информацию о загруженных данных
    console.log(`Загружено ${tableData.value.length} записей, колонок: ${columns.value.length}`);
    
    // Завершаем загрузку
    loading.value = false;
  } catch (e) {
    error.value = `Ошибка получения данных: ${e}`;
    loading.value = false;
  }
});

// Обработка перетаскивания столбцов
const onColumnReorder = (event: any) => {
  console.log("Порядок столбцов изменен:", event);
};

// Обработка изменения выделения строк
const onSelectionChange = () => {
  console.log("Выбранные элементы:", selectedItems.value);
};

// Обработчик кнопки "выделить все"
const onSelectAllChange = () => {
  if (selectAll.value) {
    // Выделяем все строки
    selectedItems.value = tableData.value.map((row: any) => row[primaryKey.value]);
  } else {
    // Снимаем выделение со всех строк
    selectedItems.value = [];
  }
};

// Функция для форматирования значений
const formatValue = (value: any) => {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.length > 0 ? `${value.length} элементов` : "-";
    }
    if (value.name) {
      return value.name;
    }
    if (value.__str__) {
      return value.__str__;
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    // Простая проверка на дату в формате ISO
    return new Date(value).toLocaleString();
  }
  return value;
};
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

.batch-actions-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: var(--surface-hover);
  border-radius: 4px;
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
  opacity: 0.5;
  transition: opacity 0.2s;
}

.column-drag-handle:hover {
  opacity: 1;
}
</style>
