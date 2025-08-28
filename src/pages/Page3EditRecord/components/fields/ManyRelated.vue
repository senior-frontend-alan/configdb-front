<!-- Page2CatalogDetails в модальном окне -->
<template>
  <div>
    <InputGroup
      @click="!disabled && openDialog()"
      :class="{ 'field-modified': isModified, 'opacity-50': disabled }"
      :style="!disabled ? { cursor: 'pointer' } : {}"
    >
      <FloatLabel variant="in">
        <MultiSelect
          :disabled="false"
          :required="required"
          display="chip"
          :filter="false"
          option-label="name"
          :modelValue="draftValue || []"
          :options="draftValue || []"
          :class="{ 'p-invalid': props.options.errors }"
          @update:modelValue="handleModelValueChange"
          @click="!disabled && openDialog()"
          :panelStyle="{ display: 'none' }"
          :data-testid="`${FRONTEND.MANY_RELATED}-field-${props.options.name}`"
        />
        <label>{{ label }}</label>
      </FloatLabel>
      <InputGroupAddon>
        <i v-if="!isModified" class="pi pi-search" :class="{ 'text-gray-400': disabled }" />
        <i
          v-else
          class="pi pi-undo cursor-pointer text-color-secondary hover:text-primary transition-colors"
          @click.stop="resetField"
          v-tooltip="'Сбросить к исходному значению'"
        />
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
      :style="{ width: '80vw' }"
      :modal="true"
      maximizable
      :closable="true"
      @hide="closeDialog"
    >
      <template #header>
        <div class="dialog-header-container">
          <span class="dialog-title">{{ $t('page3EditRecord.select') }}: {{ label }}</span>
          <div class="dialog-buttons">
            <Button
              v-if="moduleName && props.options.appl_name && props.options.view_name"
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
        <div>{{ $t('page3EditRecord.loading') }}</div>
      </div>
      <div v-else-if="error" class="p-4 text-center">
        <Message severity="error" :life="5000">{{ error }}</Message>
      </div>
      <div v-else class="catalog-details-container">
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
          v-if="moduleName && props.options.appl_name && props.options.view_name"
          :moduleName="moduleName"
          :applName="props.options.appl_name"
          :catalogName="props.options.view_name"
          :isModalMode="true"
          selectionMode="multiple"
          @row-click="handleRowClick"
          @record-selected="onRecordSelected"
          v-model:selectedItems="tempSelectedItems"
        />
      </div>

      <template #footer>
        <Button
          :label="$t('page3EditRecord.cancel')"
          icon="pi pi-times"
          @click="closeDialog"
          class="p-button-text"
        />
        <Button
          :label="$t('page3EditRecord.select')"
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
  import { useRoute } from 'vue-router';

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
    name: string; // Имя поля
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
    view_name: string; // Имя представления
    appl_name: string; // Имя приложения
    lookup?: boolean; // Является ли поле поисковым

    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    options: ManyRelatedFieldOptions;
    // Пропсы от DynamicLayout
    originalValue?: any;
    draftValue?: any;
    updateField?: (newValue: any) => void;
  }>();

  const route = useRoute();
  // moduleName связанного каталога из параметров маршрута /:moduleName/:applName/:catalogName
  const moduleName = computed(() => {
    return route.params.moduleName as string;
  });

  // Из options
  const label = computed(() => props.options.label || props.options.name);
  const disabled = computed(() => Boolean(props.options.read_only));
  const required = computed(() => !props.options.allow_null);
  const help_text = computed(() => props.options.help_text);

  const originalValue = computed(() => {
    return props.originalValue;
  });

  const draftValue = computed(() => {
    return props.draftValue;
  });

  const isModified = computed(() => {
    const draft = draftValue.value;
    const original = originalValue.value;

    if (draft === undefined) return false;

    // Для массивов сравниваем по длине и id элементов
    const originalArray = Array.isArray(original) ? original : [];
    const draftArray = Array.isArray(draft) ? draft : [];

    if (originalArray.length !== draftArray.length) return true;

    const originalIds = originalArray.map((item) => item?.id).sort();
    const draftIds = draftArray.map((item) => item?.id).sort();

    return JSON.stringify(originalIds) !== JSON.stringify(draftIds);
  });

  // Состояние компонента
  const dialogVisible = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  // Используем ref для хранения временного состояния выбранных элементов
  const tempSelectedItems = ref<RelatedItem[]>([]);

  const isSelectionEmpty = computed(() => {
    return !tempSelectedItems.value || tempSelectedItems.value.length === 0;
  });

  const openInNewTab = () => {
    if (moduleName.value && props.options.appl_name && props.options.view_name) {
      const url = `/${moduleName.value}/${props.options.appl_name}/${props.options.view_name}`;
      window.open(url, '_blank');
    }
  };

  // Инициализируем временное состояние при открытии диалога
  const initTempSelectedItems = () => {
    const currentItems = draftValue.value || [];
    console.log('initTempSelectedItems - draftValue:', currentItems);
    tempSelectedItems.value = [...currentItems];
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

      // Изменения будут отправлены в unsavedChanges только после нажатия на кнопку "Выбрать"
    }
    console.log('Выбранные элементы:', tempSelectedItems.value);
  };

  const openDialog = () => {
    if (!moduleName.value || !props.options.appl_name || !props.options.view_name) {
      console.log('Не хватает параметров для открытия диалога');
      error.value = 'Не указан URL для загрузки связанных данных';
      return;
    }

    dialogVisible.value = true;
    error.value = null;
    initTempSelectedItems();

    // Page2CatalogDetails сам загрузит данные при монтировании
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
    const selectedItems = tempSelectedItems.value.length > 0 ? tempSelectedItems.value : null;
    // Сохраняем выбранные элементы в store
    props.updateField?.(selectedItems);
    closeDialog();
  };

  // Обработка изменения modelValue (включая удаление чипсов)
  const handleModelValueChange = (newValue: any[]) => {
    console.log('handleModelValueChange вызван!');
    console.log('Новое значение:', newValue);
    console.log('Текущее значение:', draftValue.value);

    props.updateField?.(newValue);
    console.log('Поле обновлено');

    // Обновляем временное состояние
    tempSelectedItems.value = newValue || [];
  };

  const resetTempSelectedItems = () => {
    tempSelectedItems.value = [...(draftValue.value || [])];
  };

  const resetField = () => {
    props.updateField?.(originalValue.value);
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
