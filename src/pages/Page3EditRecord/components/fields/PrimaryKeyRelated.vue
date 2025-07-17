<!-- Отображаем как Page2CatalogDetails в модальном окне -->
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
          :modelValue="selectedRecord"
          :options="selectedRecord ? [selectedRecord] : []"
          optionLabel="name"
          :disabled="disabled"
          :required="required"
          :class="{ 'field-modified': props.isModified }"
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
              v-if="currentModuleName && currentApplName && currentCatalogName"
              icon="pi pi-external-link"
              class="p-button-rounded p-button-text"
              @click="openInNewTab"
              v-tooltip="'Открыть в новой вкладке'"
            />
          </div>
        </div>
      </template>
      <div v-if="error" class="p-4 text-center">
        <Message severity="error">{{ error }}</Message>
      </div>
      <div v-else class="catalog-details-container">
        <!-- Встраиваем компонент Page2CatalogDetails с передачей необходимых параметров 
              Он сам загружает данные при монтировании
        -->
        <Page2CatalogDetails
          v-if="currentModuleName && currentApplName && currentCatalogName"
          :moduleName="currentModuleName"
          :applName="currentApplName"
          :catalogName="currentCatalogName"
          :isModalMode="true"
          :selectionMode="undefined"
          @row-click="customRowClick"
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
          :label="$t('page3EditRecord.clear')"
          icon="pi pi-trash"
          @click="clearSelection"
          class="p-button-text"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import Page2CatalogDetails from '../../../../pages/Page2CatalogDetails/index.vue';
  import Button from 'primevue/button';
  import Select from 'primevue/select';
  import FloatLabel from 'primevue/floatlabel';
  import InputGroup from 'primevue/inputgroup';
  import InputGroupAddon from 'primevue/inputgroupaddon';
  import Dialog from 'primevue/dialog';
  import Message from 'primevue/message';
  import { FRONTEND } from '../../../../services/fieldTypeService';
  import { getOrFetchRecord } from '../../../../stores/data-loaders';

  interface RelatedItem {
    id: number | string;
    name: string;
    [key: string]: any;
  }

  // Определяем интерфейс для объекта options
  interface PrimaryKeyRelatedFieldOptions {
    FRONTEND_CLASS: typeof FRONTEND.PRIMARY_KEY_RELATED; // Класс поля на фронтенде
    class_name: string; // Класс поля на бэкенде
    element_id: string; // Уникальный идентификатор элемента

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

    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    moduleName: string;
    modelValue?: RelatedItem | number | string | null;
    options: PrimaryKeyRelatedFieldOptions;
    isModified: boolean;
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const disabled = computed(() => Boolean(props.options.read_only));
  const required = computed(() => !props.options.allow_null);
  const help_text = computed(() => props.options.help_text);

  // Используем computed для автоматического обновления при изменении props
  const currentModuleName = computed(() => props.moduleName);
  const currentApplName = computed(() => props.options.appl_name);
  const currentCatalogName = computed(() => props.options.view_name);

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number | null): void;
  }>();

  // Состояние компонента
  const dialogVisible = ref(false);
  const error = ref<string | null>(null);

  // Сохраняем полные данные о выбранной записи
  const selectedRecord = ref<RelatedItem | null>(null);

  const openInNewTab = () => {
    if (currentModuleName.value && currentApplName.value && currentCatalogName.value) {
      const url = `/${currentModuleName.value}/${currentApplName.value}/${currentCatalogName.value}`;
      window.open(url, '_blank');
    }
  };

  const customRowClick = (event: any) => {
    const rowData = event.data;

    if (rowData && typeof rowData === 'object' && 'id' in rowData && 'name' in rowData) {
      const rowItem: RelatedItem = {
        id: rowData.id,
        name: rowData.name,
      };

      selectedRecord.value = rowItem;
      emit('update:modelValue', rowItem.id);
      dialogVisible.value = false;
    }
  };

  const openDialog = async () => {
    if (disabled.value) return;

    dialogVisible.value = true;
    error.value = null;

    if (!currentModuleName.value || !currentApplName.value || !currentCatalogName.value) {
      error.value = 'Не указан URL для загрузки связанных данных';
      return;
    }

    // Не вызываем getOrfetchCatalog здесь, так как Page2CatalogDetails
    // сам загрузит данные при монтировании
  };

  const closeDialog = () => {
    dialogVisible.value = false;
  };

  // Очистка выбранного элемента и закрытие диалога
  const clearSelection = () => {
    selectedRecord.value = null;
    emit('update:modelValue', null);
    closeDialog();
  };

  const createMinimalRecord = (id: string | number): RelatedItem => ({
    id,
    name: String(id),
  });

  // Для отображения name в компоненте Select нужно загрузить полные данные записи
  // Функция для загрузки данных записи по ID т.к. modelValue приходит только ID связанной записи (число или строка),
  // а не полный объект с данными (в базе данных связи между таблицами хранятся как внешние ключи (просто ID)
  // При сохранении формы нам нужно отправить на сервер только ID связанной записи
  const loadRecordData = async (id: string | number) => {
    if (!id || !currentModuleName.value || !currentApplName.value || !currentCatalogName.value) {
      return;
    }

    const result = await getOrFetchRecord(
      currentModuleName.value,
      currentApplName.value,
      currentCatalogName.value,
      String(id),
    );

    if (result.success && result.recordData) {
      // Создаем объект RelatedItem из полученных данных
      selectedRecord.value = {
        id: result.recordData.id,
        name: result.recordData.name,
        ...result.recordData,
      };
    } else if (result.error) {
      console.error('Ошибка при загрузке данных записи:', result.error);
      // Если не удалось загрузить данные, создаем минимальный объект с ID
      selectedRecord.value = createMinimalRecord(id);
    }
  };

  // При монтировании компонента загружаем данные записи, если есть ID
  onMounted(() => {
    if (props.modelValue) {
      const id =
        typeof props.modelValue === 'object'
          ? (props.modelValue as RelatedItem).id
          : props.modelValue;
      loadRecordData(id);
    } else {
      selectedRecord.value = null;
    }
  });
</script>

<style scoped>
  .dialog-header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .dialog-title {
    font-size: 1rem;
    font-weight: 600;
  }
</style>
