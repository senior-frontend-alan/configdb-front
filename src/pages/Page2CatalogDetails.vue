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
            v-model:selection="selectedItems"
            :selection-mode="hasBatchPermission ? 'multiple' : undefined"
            dataKey="id"
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
            >
              <template #body="slotProps">
                <!-- Отладочный вывод для HTML-строки -->
                <div
                  v-if="
                    typeof slotProps.field === 'string' &&
                    slotProps.field === 'layout_rich_edit_field' &&
                    typeof slotProps.data[slotProps.field] === 'string'
                  "
                >
                  <pre class="text-xs bg-surface-50 p-1 rounded overflow-auto max-h-20">
                    Тип: {{ typeof slotProps.data[slotProps.field] }}
                    Длина: {{ slotProps.data[slotProps.field].length }}
                    Начало: {{ slotProps.data[slotProps.field].substring(0, 30) }}...
                  </pre>
                </div>

                <!-- В PrimeVue DataTable слот #body передает объект slotProps, содержащий данные текущей строки (data) и имя текущего поля (field)
                TypeScript не мог определить, что slotProps.field всегда является строкой, поэтому выдавал ошибку при попытке использовать это значение как индекс объекта -->
                <ObjectFieldPopover
                  v-if="typeof slotProps.field === 'string' && slotProps.data[slotProps.field as string] && typeof slotProps.data[slotProps.field as string] === 'object'"
                  :fieldData="slotProps.data[slotProps.field as string]"
                />
                <span v-else>{{
                  typeof slotProps.field === 'string'
                    ? slotProps.data[slotProps.field as string]
                    : ''
                }}</span>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { useModuleStore } from '../stores/module-factory';

  import Card from 'primevue/card';
  import Message from 'primevue/message';
  import ProgressSpinner from 'primevue/progressspinner';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import ObjectFieldPopover from '../components/ObjectFieldPopover.vue';

  // Получаем параметры маршрута
  const route = useRoute();
  const viewname = computed(() => route.params.viewname as string);

  // Состояние компонента
  const loading = ref(true);
  const error = ref<string | null>(null);
  const selectedItems = ref<any[]>([]);
  const tableData = ref<any[]>([]);
  const columns = ref<Array<{ field: string; header: string }>>([]);
  const primaryKey = ref<string>('id');
  const hasBatchPermission = ref(true);

  // Заголовок страницы
  const moduleTitle = computed(() => {
    return `Детали каталога: ${viewname.value}`;
  });

  // Получаем ID модуля из meta-данных маршрута
  const moduleId = computed(() => (route.meta.moduleId as string) || '');

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

      // Функция для обработки элементов макета
      const processLayoutElements = (elements: any[]): Record<string, any> => {
        let result: Record<string, any> = {};

        elements.forEach((elem) => {
          // Если это обычное поле с label и name
          if (elem.label && elem.name) {
            result[elem.name] = {
              field: elem.name,
              header: elem.label,
            };
          }
        });

        return result;
      };

      // Функция для создания колонок таблицы
      const createColumns = (
        options: any,
        data: any[],
      ): Array<{ field: string; header: string }> => {
        // Если нет макета или данных, возвращаем базовые колонки
        if (!options || !options.layout) {
          if (data.length > 0) {
            // Если нет макета, но есть данные, создаем колонки на основе данных
            return Object.keys(data[0]).map((key) => ({
              field: key,
              header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            }));
          }

          // Базовые колонки, если ничего нет
          return [
            { field: 'id', header: 'ID' },
            { field: 'name', header: 'Название' },
            { field: 'description', header: 'Описание' },
          ];
        }

        // Создаем карту всех полей из макета сложность O(1)
        const fieldsMap = Array.isArray(options.layout.elements)
          ? processLayoutElements(options.layout.elements)
          : {};

        let result: Array<{ field: string; header: string }> = [];

        // Если есть display_list, используем его для определения порядка колонок
        if (Array.isArray(options.layout.display_list) && options.layout.display_list.length > 0) {
          result = options.layout.display_list
            .filter((fieldName: string) => typeof fieldName === 'string')
            .map((fieldName: string) => {
              // Если поле есть в карте полей, используем его метаданные
              if (fieldsMap[fieldName]) {
                return fieldsMap[fieldName];
              }

              // Иначе создаем колонку с автоматическим заголовком
              return {
                field: fieldName,
                header: fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' '),
              };
            });
        }
        // Если нет display_list, но есть elements, используем все поля из elements
        else if (Array.isArray(options.layout.elements)) {
          console.log('Используем все поля из elements для определения колонок');
          result = Object.values(fieldsMap);
        }

        // Проверяем наличие date_created и date_updated в данных
        if (data.length > 0) {
          const columnFields = result.map((col) => col.field);

          if (data[0].date_created && !columnFields.includes('date_created')) {
            result.push({
              field: 'date_created',
              header: 'Дата создания',
            });
          }

          if (data[0].date_updated && !columnFields.includes('date_updated')) {
            result.push({
              field: 'date_updated',
              header: 'Дата обновления',
            });
          }
        }

        return result;
      };

      columns.value = createColumns(storeDetails.OPTIONS, tableData.value);

      // Функция для создания строк таблицы из отформатированных данных
      const createRows = (storeDetails: any): any[] => {
        return storeDetails.GET_FORMATTED.results;
      };

      tableData.value = createRows(storeDetails);

      // Завершаем загрузку
      loading.value = false;
    } catch (e) {
      error.value = `Ошибка получения данных: ${e}`;
      loading.value = false;
    }
  });

  // Обработка перетаскивания столбцов
  const onColumnReorder = (event: any) => {
    console.log('Порядок столбцов изменен:', event);
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
