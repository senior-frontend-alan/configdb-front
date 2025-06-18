<!-- Отображаем как модальное окно с новой таблицей -->
<template>
  <div>
    <InputGroup
      @click="!disabled && openDialog()"
      :class="{ 'opacity-50': disabled }"
      :style="!disabled ? { cursor: 'pointer' } : {}"
    >
      <FloatLabel variant="in">
        <MultiSelect
          :id="id"
          :disabled="disabled"
          :required="required"
          display="chip"
          :filter="true"
          option-label="name"
          :modelValue="modelValue || []"
          :options="modelValue || []"
          :class="{ 'p-invalid': props.options.errors, 'field-modified': props.isModified }"
          @remove="handleChipRemove"
          @update:modelValue="handleModelValueChange"
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
        <!-- Добавляем отладочную информацию -->
        <!-- <div class="p-2 bg-gray-100 mb-2">
          <div><strong>Выбранные строки:</strong> {{ tempSelectedItems.length }}</div>
          <div v-if="tempSelectedItems.length > 0">
            <div v-for="(item, index) in tempSelectedItems" :key="index">
              ID: {{ item.id }}, {{ item.name || item.title || JSON.stringify(item).substring(0, 50) }}
            </div>
          </div>
        </div> -->

        <Page2CatalogDetails
          v-if="currentModuleName && currentCatalogName"
          :moduleName="currentModuleName"
          :catalogName="currentCatalogName"
          :isModalMode="true"
          selectionMode="multiple"
          @row-click="handleRowClick"
          @record-selected="onRecordSelected"
          v-model:selectedItems="tempSelectedItems"
        />
      </div>

      <template #footer>
        <Button label="Отмена" icon="pi pi-times" @click="closeDialog" class="p-button-text" />
        <Button
          label="Выбрать"
          icon="pi pi-check"
          @click="saveSelection"
          :disabled="isSelectionEmpty"
          autofocus
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { CatalogService } from '../../../../services/CatalogService';
  import { parseBackendApiUrl } from '../../../../config-loader';
  import Page2CatalogDetails from '../../../../pages/Page2CatalogDetails/index.vue';
  import Button from 'primevue/button';
  import MultiSelect from 'primevue/multiselect';
  import FloatLabel from 'primevue/floatlabel';
  import InputGroup from 'primevue/inputgroup';
  import InputGroupAddon from 'primevue/inputgroupaddon';
  import Dialog from 'primevue/dialog';
  import ProgressSpinner from 'primevue/progressspinner';
  import Message from 'primevue/message';
  import { FRONTEND } from '../../../../services/fieldTypeService';

  interface RelatedItem {
    id: number | string;
    name: string;
    [key: string]: any;
  }

  interface ManyRelatedFieldOptions {
    FRONTEND_CLASS: typeof FRONTEND.MANY_RELATED; // Класс поля на фронтенде
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
    list_url: string; // URL для получения списка значений
    view_name?: string; // Имя представления
    appl_name?: string; // Имя приложения
    lookup?: boolean; // Является ли поле поисковым

    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    modelValue?: RelatedItem[] | null;
    options: ManyRelatedFieldOptions;
    isModified: boolean;
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const disabled = computed(() => Boolean(props.options.read_only));
  const required = computed(() => !props.options.allow_null);
  const relatedTableUrl = computed(() => props.options.list_url);
  const help_text = computed(() => props.options.help_text);

  const emit = defineEmits<{
    (e: 'update:modelValue', value: RelatedItem[] | null): void;
  }>();

  // Состояние компонента
  const dialogVisible = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  // Используем ref для хранения временного состояния выбранных элементов
  const tempSelectedItems = ref<RelatedItem[]>([]);
  const isFullscreen = ref(false);

  // Вычисляемые свойства для использования в шаблоне
  const isSelectionEmpty = computed(() => {
    return !tempSelectedItems.value || tempSelectedItems.value.length === 0;
  });

  const currentModuleName = ref('');
  const currentCatalogName = ref('');

  // Состояние загрузки данных

  const openInNewTab = () => {
    if (currentModuleName.value && currentCatalogName.value) {
      const url = `/${currentModuleName.value}/${currentCatalogName.value}`;
      window.open(url, '_blank');
    }
  };

  const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value;
  };

  // Инициализируем временное состояние при открытии диалога
  const initTempSelectedItems = () => {
    console.log('initTempSelectedItems - modelValue:', props.modelValue);
    tempSelectedItems.value =
      props.modelValue && Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    console.log('initTempSelectedItems - tempSelectedItems:', tempSelectedItems.value);
  };

  const handleRowClick = (event: any) => {
    const rowData = event.data;

    if (rowData) {
      // Проверяем, есть ли уже такой элемент в списке
      const existingIndex = tempSelectedItems.value.findIndex((item) => item.id === rowData.id);

      if (existingIndex === -1) {
        // Добавляем новый элемент в список
        tempSelectedItems.value = [...tempSelectedItems.value, rowData];
      } else {
        // Удаляем элемент из списка (снимаем выделение)
        tempSelectedItems.value = tempSelectedItems.value.filter((item) => item.id !== rowData.id);
      }

      // Изменения будут отправлены в PATCH только после нажатия на кнопку "Выбрать"
    }
    console.log('Выбранные элементы:', tempSelectedItems.value);
  };

  const openDialog = async () => {
    if (disabled.value) return;

    dialogVisible.value = true;
    loading.value = true;
    error.value = null;

    // Инициализируем временное состояние при открытии диалога
    initTempSelectedItems();

    // Если есть URL для загрузки связанных данных
    if (relatedTableUrl.value) {
      try {
        // Парсим URL для получения информации о модуле и каталоге
        const urlInfo = parseBackendApiUrl(relatedTableUrl.value);
        currentModuleName.value = urlInfo.moduleName || '';
        currentCatalogName.value = urlInfo.catalogName || '';

        // Загружаем данные в соответствующий стор через CatalogService
        if (urlInfo.moduleName && urlInfo.catalogName) {
          await Promise.all([
            CatalogService.GET(urlInfo.moduleName, urlInfo.catalogName, 0),
            CatalogService.OPTIONS(urlInfo.moduleName, urlInfo.catalogName),
          ]);
        } else {
          throw new Error(
            `Не удалось определить модуль или каталог из URL: ${relatedTableUrl.value}`,
          );
        }
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

  const onRecordSelected = (record: any) => {
    console.log('Выбрана запись:', record);
    handleRowClick({ data: record });
  };

  // Закрытие диалога с отменой изменений
  const closeDialog = () => {
    dialogVisible.value = false;
  };

  const saveSelection = () => {
    // Отправляем выбранные элементы в родительский компонент
    const selectedItems = tempSelectedItems.value.length > 0 ? tempSelectedItems.value : null;
    emit('update:modelValue', selectedItems);
    closeDialog();
  };

  // Обработка удаления чипса (элемента) из MultiSelect
  const handleChipRemove = (event: any) => {
    console.log('Удален элемент:', event.value);

    // Обновляем modelValue, удаляя выбранный элемент
    const updatedValue = props.modelValue
      ? props.modelValue.filter((item: any) => item.id !== event.value.id)
      : [];

    // Отправляем обновленное значение в родительский компонент
    emit('update:modelValue', updatedValue.length > 0 ? updatedValue : null);

    // Обновляем временное состояние выбранных элементов
    tempSelectedItems.value = [...updatedValue];
  };

  // Обработка изменения modelValue в MultiSelect
  const handleModelValueChange = (newValue: any[]) => {
    console.log('Изменено значение modelValue:', newValue);

    // Если изменение произошло не через диалог, а напрямую в MultiSelect
    if (!dialogVisible.value) {
      emit('update:modelValue', newValue && newValue.length > 0 ? newValue : null);
      tempSelectedItems.value = newValue || [];
    }
  };

  const resetTempSelectedItems = () => {
    tempSelectedItems.value =
      props.modelValue && Array.isArray(props.modelValue) ? [...props.modelValue] : [];
  };

  // Инициализируем при монтировании компонента
  resetTempSelectedItems();
</script>

<style scoped>
  /* Стили для корректной работы MultiSelect с FloatLabel */
  :deep(.p-multiselect-label:has(.p-chip)) {
    padding-top: 20px;
  }

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
</style>
