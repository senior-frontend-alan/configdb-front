<!-- Отображаем как модальное окно с новой таблицей -->
<template>
  <div>
    <InputGroup
      @click="!disabled && openDialog()"
      :class="{ 'opacity-50': disabled }"
      :style="!disabled ? { cursor: 'pointer' } : {}"
    >
      <FloatLabel variant="in">
        <Select
          :id="id"
          v-model="selectedItem"
          :options="[selectedItem].filter(Boolean)"
          optionLabel="name"
          :disabled="disabled"
          :required="required"
          :class="{ 'input-modified': props.isModified }"
        />
        <label :for="id">{{ label }}</label>
      </FloatLabel>
      <InputGroupAddon>
        <i class="pi pi-search" :class="{ 'text-gray-400': disabled }"></i>
      </InputGroupAddon>
    </InputGroup>

    <div v-if="help_text" class="flex align-items-center justify-content-between mt-1">
      <Message size="small" severity="secondary" variant="simple" class="flex-grow-1">
        {{ help_text }}
      </Message>
    </div>

    <!-- Модальное окно для выбора связанной записи -->
    <Dialog
      v-model:visible="dialogVisible"
      :style="
        isFullscreen
          ? { width: '100vw', height: '100vh', maxWidth: '100vw', margin: '0' }
          : { width: '90vw' }
      "
      :modal="true"
      :closable="true"
      @hide="closeDialog"
    >
      <template #header>
        <div class="dialog-header-container">
          <span class="dialog-title">{{ label }}</span>
          <div class="dialog-buttons">
            <Button
              :icon="isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
              class="p-button-rounded p-button-text mr-2"
              @click="toggleFullscreen"
              v-tooltip="isFullscreen ? 'Свернуть' : 'Развернуть на весь экран'"
            />
            <Button
              v-if="currentModuleName && currentCatalogName"
              icon="pi pi-external-link"
              class="p-button-rounded p-button-text"
              @click="openInNewTab"
              v-tooltip="'Открыть в новой вкладке'"
            />
          </div>
        </div>
      </template>
      <div v-if="loading" class="p-4 text-center">
        <ProgressSpinner style="width: 50px; height: 50px" />
        <div>Загрузка данных...</div>
      </div>
      <div v-else-if="error" class="p-4 text-center">
        <Message severity="error" :life="5000">{{ error }}</Message>
      </div>
      <div v-else class="catalog-details-container">
        <!-- Встраиваем компонент CatalogDetails с передачей необходимых параметров -->
        <CatalogDetails
          v-if="currentModuleName && currentCatalogName"
          :moduleName="currentModuleName"
          :catalogName="currentCatalogName"
          :onRowClick="customRowClick"
          @record-selected="onRecordSelected"
        />
      </div>

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
  import { ref, computed } from 'vue';
  import { useCatalogLoader } from '../../../../composables/useCatalogLoader';
  import { parseBackendApiUrl } from '../../../../config-loader';
  import CatalogDetails from '../../../../pages/Page2CatalogDetails/index.vue';
  import Button from 'primevue/button';
  import Select from 'primevue/select';
  import FloatLabel from 'primevue/floatlabel';
  import InputGroup from 'primevue/inputgroup';
  import InputGroupAddon from 'primevue/inputgroupaddon';
  import Dialog from 'primevue/dialog';
  import ProgressSpinner from 'primevue/progressspinner';
  import Message from 'primevue/message';

  interface RelatedItem {
    id: number | string;
    name: string;
    [key: string]: any;
  }

  // Определяем интерфейс для объекта options
  interface FieldOptions {
    // Основные свойства из LayoutElement
    class_name: string; // Класс поля на бэкенде
    element_id: string; // Уникальный идентификатор элемента

    // Свойства из LayoutFieldBase
    field_class: string; // Класс поля
    label: string; // Отображаемая метка
    minimize?: boolean; // Минимизировать поле
    js_item_repr?: string; // Представление элемента в JS
    multiple?: boolean; // Множественный выбор
    list_view_items?: number; // Количество элементов для отображения

    // Свойства из LayoutField
    required?: boolean; // Обязательное ли поле
    allow_null?: boolean; // Разрешать пустое значение
    default?: any; // Значение по умолчанию
    read_only?: boolean; // Только для чтения
    input_type?: string; // Тип ввода
    pattern?: string; // Шаблон для валидации
    filterable?: boolean; // Можно ли фильтровать
    sortable?: boolean; // Можно ли сортировать
    hidden?: boolean; // Скрыто ли поле
    help_text?: string; // Текст подсказки

    // Специфичные свойства для LayoutRelatedField
    list_url?: string; // URL для получения списка значений
    view_name?: string; // Имя представления
    appl_name?: string; // Имя приложения
    lookup?: boolean; // Является ли поле поисковым
    FRONTEND_CLASS?: string; // Класс поля на фронтенде

    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    modelValue?: RelatedItem | number | string | null;
    options: FieldOptions;
    isModified?: boolean;
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const disabled = computed(() => Boolean(props.options.read_only));
  const required = computed(() => !props.options.allow_null);
  const relatedTableUrl = computed(() => props.options.list_url);
  const help_text = computed(() => props.options.help_text);

  const emit = defineEmits<{
    (e: 'update:modelValue', value: RelatedItem | number | string | null): void;
  }>();

  // Состояние компонента
  const dialogVisible = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedItem = ref<RelatedItem | null>(null);
  const isFullscreen = ref(false);

  const currentModuleName = ref('');
  const currentCatalogName = ref('');

  // Композабл для загрузки данных каталога
  const catalogLoader = useCatalogLoader();

  const openInNewTab = () => {
    if (currentModuleName.value && currentCatalogName.value) {
      const url = `/${currentModuleName.value}/${currentCatalogName.value}`;
      window.open(url, '_blank');
    }
  };

  const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value;
  };

  const customRowClick = (event: any) => {
    const rowData = event.data;

    // Выбираем запись и вызываем onRecordSelected
    if (rowData) {
      onRecordSelected(rowData);
    }
  };

  // Открытие диалога и загрузка данных
  const openDialog = async () => {
    if (disabled.value) return;

    loading.value = true;
    error.value = null;

    // Если есть URL для загрузки связанных данных
    if (relatedTableUrl.value) {
      try {
        console.log('Загрузка данных каталога:', relatedTableUrl.value);

        // Парсим URL для получения информации о модуле и каталоге
        const urlInfo = parseBackendApiUrl(relatedTableUrl.value);
        currentModuleName.value = urlInfo.moduleName;
        currentCatalogName.value = urlInfo.catalogName;

        console.log('Получены параметры:', {
          модуль: currentModuleName.value,
          каталог: currentCatalogName.value,
        });

        // Загружаем данные в соответствующий стор
        await catalogLoader.loadCatalogByUrl(relatedTableUrl.value);
        console.log('Данные каталога загружены успешно');

        // Открываем диалог после успешной загрузки данных
        dialogVisible.value = true;
      } catch (err) {
        console.error('Ошибка при загрузке данных каталога:', err);
        error.value = err instanceof Error ? err.message : 'Неизвестная ошибка';
      } finally {
        loading.value = false;
      }
    } else {
      error.value = 'Не указан URL для загрузки связанных данных';
      loading.value = false;
    }
  };

  // Обработка выбора записи из компонента CatalogDetails
  const onRecordSelected = (record: any) => {
    console.log('Выбрана запись:', record);
    selectedItem.value = record;
  };

  const closeDialog = () => {
    dialogVisible.value = false;
  };

  // Выбор элемента и закрытие диалога
  const selectItem = () => {
    if (selectedItem.value) {
      emit('update:modelValue', selectedItem.value);
      closeDialog();
    }
  };

  // Инициализация selectedItem на основе modelValue
  if (props.modelValue) {
    if (typeof props.modelValue === 'object' && props.modelValue !== null) {
      // Если передан объект, используем его как есть
      selectedItem.value = props.modelValue as RelatedItem;
    } else {
      // Если передан ID, создаем объект с этим ID
      selectedItem.value = {
        id: props.modelValue,
        name: String(props.modelValue),
      };
    }
  }

  // Наблюдение за изменениями modelValue происходит автоматически через v-model
</script>

<style scoped>
  .dialog-header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .dialog-title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  /* Используются общие стили из tailwind.css */
  /* При необходимости можно добавить дополнительные стили */
</style>
