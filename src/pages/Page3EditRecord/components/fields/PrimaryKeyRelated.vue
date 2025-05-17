<!-- Отображаем как модальное окно с новой таблицей -->
<template>
  <div class="w-full">
    <FloatLabel variant="in">
      <div class="p-inputgroup">
        <InputText
          :id="id"
          v-model="displayValue"
          :disabled="true"
          :required="required"
          :placeholder="placeholder || 'Выберите значение'"
          class="w-full"
        />
        <Button
          icon="pi pi-search"
          :disabled="disabled"
          @click="openDialog"
          aria-label="Выбрать"
        />
      </div>
      <label :for="id">{{ label }}</label>
    </FloatLabel>

    <div v-if="help_text" class="flex align-items-center justify-content-between mt-1">
      <Message size="small" severity="secondary" variant="simple" class="flex-grow-1">
        {{ help_text }}
      </Message>
    </div>

    <!-- Модальное окно для выбора связанной записи -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="`Выберите ${label}`"
      :style="{ width: '80vw' }"
      :modal="true"
      :closable="true"
      :dismissableMask="true"
    >
      <div v-if="loading" class="flex justify-content-center">
        <ProgressSpinner />
      </div>
      <div v-else-if="error" class="p-error">
        {{ error }}
      </div>
      <div v-else-if="relatedData && relatedData.length > 0" class="card">
        <DataTable
          :value="relatedData"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          tableStyle="min-width: 50rem"
          :filters="filters"
          filterDisplay="row"
          v-model:selection="selectedItem"
          selectionMode="single"
          dataKey="id"
          @row-select="onRowSelect"
        >
          <template #header>
            <div class="flex justify-content-end">
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters.global.value" placeholder="Поиск..." />
              </span>
            </div>
          </template>

          <!-- Динамически создаем колонки на основе первого элемента данных -->
          <Column
            v-for="columnKey in columnKeys"
            :key="columnKey"
            :field="columnKey"
            :header="columnKey"
            :sortable="true"
          >
            <template #filter="{ filterModel, filterCallback }">
              <InputText
                v-model="filterModel.value"
                @input="filterCallback()"
                class="p-column-filter"
                placeholder="Поиск"
              />
            </template>
          </Column>
        </DataTable>
      </div>
      <div v-else class="p-4 text-center">Нет доступных данных для выбора</div>

      <template #footer>
        <Button label="Отмена" icon="pi pi-times" @click="closeDialog" class="p-button-text" />
        <Button
          label="Выбрать"
          icon="pi pi-check"
          @click="selectItem"
          :disabled="!selectedItem"
          autofocus
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useModuleStore } from '../../../../stores/module-factory';
  import InputText from 'primevue/inputtext';
  import Button from 'primevue/button';
  import FloatLabel from 'primevue/floatlabel';
  import Dialog from 'primevue/dialog';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import ProgressSpinner from 'primevue/progressspinner';
  import Message from 'primevue/message';
  import api from '../../../../api';

  interface RelatedItem {
    id: number | string;
    name: string;
    [key: string]: any;
  }

  // Определяем интерфейс для объекта options
  interface FieldOptions {
    name: string;
    label?: string;
    placeholder?: string;
    readonly?: boolean;
    required?: boolean;
    related_url?: string;
    help_text?: string;
    moduleName?: string;
    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    modelValue?: RelatedItem | number | string | null;
    options: FieldOptions;
  }>();
  
  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const placeholder = computed(() => props.options.placeholder || '');
  const disabled = computed(() => props.options.readonly || false);
  const required = computed(() => props.options.required || false);
  const apiEndpoint = computed(() => props.options.related_url);
  const help_text = computed(() => props.options.help_text);
  const moduleName = computed(() => props.options.moduleName);

  const emit = defineEmits<{
    (e: 'update:modelValue', value: RelatedItem | number | string | null): void;
  }>();

  // Состояние компонента
  const dialogVisible = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const relatedData = ref<RelatedItem[]>([]);
  const selectedItem = ref<RelatedItem | null>(null);
  const displayValue = ref('');

  // Фильтры для таблицы
  const filters = ref({
    global: { value: null, matchMode: 'contains' },
  });

  // Получаем текущее значение id из modelValue
  const getCurrentId = (): number | string | null => {
    if (!props.modelValue) return null;

    // Если массив, возвращаем null (пустое значение)
    if (Array.isArray(props.modelValue)) return null;

    // Если объект с id
    if (
      typeof props.modelValue === 'object' &&
      props.modelValue !== null &&
      'id' in props.modelValue
    ) {
      return props.modelValue.id;
    }

    // Если просто id (число или строка)
    if (typeof props.modelValue === 'number' || typeof props.modelValue === 'string') {
      return props.modelValue;
    }

    return null;
  };

  // Загрузка связанных данных из API
  const loadRelatedData = async () => {
    loading.value = true;
    error.value = null;
    relatedData.value = [];

    try {
      // Используем вычисляемое свойство apiEndpoint вместо props.apiEndpoint
      if (!apiEndpoint.value) {
        throw new Error('Не указан URL для загрузки связанных данных');
      }

      // Запрос к API для получения данных
      const response = await api.get(apiEndpoint.value);
      relatedData.value = response.data;
    } catch (err) {
      console.error('Ошибка при загрузке связанных данных:', err);
      error.value = текстОшибки(err);
    } finally {
      loading.value = false;
    }
  };

  // Получение текста ошибки
  const текстОшибки = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    return 'Неизвестная ошибка при загрузке данных';
  };

  // Открытие диалога и загрузка данных
  const openDialog = async () => {
    // Используем вычисляемое свойство disabled вместо props.disabled
    if (disabled.value) return;

    dialogVisible.value = true;
    await loadRelatedData();

    // Устанавливаем выбранный элемент, если есть текущее значение
    const currentId = getCurrentId();
    if (currentId && relatedData.value) {
      selectedItem.value = relatedData.value.find((item) => item.id == currentId) || null;
    }
  };

  // Закрытие диалога
  const closeDialog = () => {
    dialogVisible.value = false;
  };

  // Обработка выбора строки в таблице
  const onRowSelect = (event: any) => {
    selectedItem.value = event.data;
  };

  // Выбор элемента и закрытие диалога
  const selectItem = () => {
    if (selectedItem.value) {
      emit('update:modelValue', selectedItem.value);
      closeDialog();
    }
  };

  // Вычисляемое свойство для ключей колонок
  const columnKeys = computed(() => {
    if (!relatedData.value || relatedData.value.length === 0) return [];

    return Object.keys(relatedData.value[0] || {}).filter(
      (key) => key !== 'id' && !key.startsWith('_'),
    );
  });

  // При изменении modelValue обновляем отображаемое значение
  onMounted(() => {
    // updateDisplayValue();
  });
</script>

<style scoped>
  /* Используются общие стили из tailwind.css */
  /* При необходимости можно добавить дополнительные стили */
</style>
