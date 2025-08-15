<!-- Отображаем как Page2CatalogDetails в модальном окне -->
<!-- модальный выбор связанных записей -->
<template>
  <div>
    <InputGroup
      @click="!disabled && openDialog()"
      :class="{ 'opacity-50': disabled, 'field-modified': isModified }"
      :style="!disabled ? { cursor: 'pointer' } : {}"
    >
      <!-- Иконка замочка для заблокированных полей -->
      <InputGroupAddon
        v-if="relatedFieldsStatus.isBlocked"
        style="background-color: var(--p-surface-200)"
      >
        <i class="pi pi-lock" />
      </InputGroupAddon>
      <FloatLabel variant="in">
        <Select
          :modelValue="draftValue"
          :options="draftValue ? [draftValue] : []"
          optionLabel="name"
          :disabled="disabled"
          :required="required"
        />
        <label>{{ label }} </label>
      </FloatLabel>
      <InputGroupAddon
        v-if="relatedFieldsStatus.isBlocked"
        style="background-color: var(--p-surface-200)"
      >
        <i
          v-if="isModified"
          class="pi pi-undo cursor-pointer text-color-secondary hover:text-primary transition-colors"
          @click.stop="resetField"
          v-tooltip="'Сбросить к исходному значению'"
        />
        <i v-else class="pi pi-search" :class="{ 'text-gray-400': disabled }" />
      </InputGroupAddon>
    </InputGroup>

    <div
      v-if="help_text || relatedFieldsStatus.isBlocked"
      class="flex align-items-center justify-content-between mt-1"
    >
      <Message size="small" severity="secondary" variant="simple" class="flex-grow-1">
        {{ help_text }}
      </Message>
    </div>
    <div v-if="relatedFieldsStatus.isBlocked" :style="{ color: 'var(--field-modified-color)' }">
      <div>Сначала заполните:</div>
      <div v-for="field in missingFieldsList" :key="field">
        {{ field }}
      </div>
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
          :relatedFields="relatedFields"
          :isModalMode="true"
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
  import { computed, ref, inject, onMounted, onUnmounted, type ComputedRef } from 'vue';
  import { useRoute } from 'vue-router';
  import { useToast } from 'primevue/usetoast';

  import { FRONTEND } from '../../../../services/fieldTypeService';
  import Button from 'primevue/button';
  import Dialog from 'primevue/dialog';
  import Select from 'primevue/select';
  import FloatLabel from 'primevue/floatlabel';
  import InputGroup from 'primevue/inputgroup';
  import InputGroupAddon from 'primevue/inputgroupaddon';
  import Message from 'primevue/message';
  import Page2CatalogDetails from '../../../Page2CatalogDetails/index.vue';

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

    related_fk?: string[] | Record<string, any>; // Фильтры для связанных полей
    // ВАЖНО! Если есть related_fk, то мы не имеем право редактировать текущий компонент, пока связанное поле в форме не заполнено
    // related_fk = "Related Foreign Key" - это механизм для фильтрации связанных данных на основе внешних ключей.

    // При загрузке данных нужно учитывать связь через поле
    // Загружать только записи, где char_spec = 3.
    // related_fk: {
    //   "char_spec": 3 - если число зафиксировали констранту (не зависит от выбора на поле формы)
    //   "char_spec": "3" - если строка это имя поля на форме по которому мы должны обращаться (ремаппинг)
    // }
    // related_fk: [
    //   "char_spec" - если строка, то это имя поля на форме ("Можно заполнять ТОЛЬКО если заполнено поле char_spec")
    // ]

    // То char_spec_value должен искать char_spec сначала в своем контексте (characteristics), а потом в глобальном контексте.

    // Другие возможные свойства
    [key: string]: any;
  }

  const props = defineProps<{
    options: PrimaryKeyRelatedFieldOptions;
    // Пропсы от DynamicLayout
    originalValue?: any;
    draftValue?: any;
    updateField?: (newValue: any) => void;
  }>();

  // Эмиты для передачи данных о связанных полях наверх
  // Emit работает только "снизу вверх" по иерархии компонентов.
  // Если нужно передать данные компонентам на том же уровне (siblings) или в другие ветки дерева компонентов, то emit не подходит.
  // Получаем две отдельные цепочки - все необходимые данные уже в них!
  // [
  //   {
  //     // ← Прямая ссылка на currentEditingRecord.value (данные текущего контекста)
  //     char_spec: "Цвет",
  //     char_value: "Красный",
  //     char_unit: "шт"
  //   },
  //   {
  //     // ← Прямая ссылка на draftRecordData.value (данные контекста выше)
  //     id: 1,
  //     name: "iPhone 15",
  //     price: 999.99,
  //     category: { id: 2, name: "Смартфоны" }
  //   }
  //]
  const dataChain = inject<ComputedRef<Record<string, any>[]>>(
    'dataChain',
    computed(() => []),
  );

  // Lifecycle логирование для диагностики
  onMounted(() => {
    console.log('🚀 ViewSetInlineLayout mounted');
    console.log('🔍 Принудительно вызываем computed свойства:');

    // Принудительно вызываем computed свойства для логирования
    dataChain.value; // Принудительно вызываем для логирования
    metadataChain.value; // Принудительно вызываем для логирования

    console.log('---------------------------------------------------');
    console.log(
      `🔗 ViewSetInlineLayout dataChain (длина: ${dataChain.value.length}):`,
      dataChain.value,
    );
    console.log(
      `🔗 ViewSetInlineLayout metadataChain (длина: ${metadataChain.value.length}):`,
      metadataChain.value,
    );

    console.log('---------------------------------------------------');
    console.log(`relatedFields`, relatedFields.value);
  });

  onUnmounted(() => {
    console.log('💀 ViewSetInlineLayout unmounted');
  });

  // metadataChain:
  //[
  //  Map {
  //    // ← Прямая ссылка на props.options.elementsIndex (локальный ViewSetInlineLayout)
  //    "char_spec" => { name: "char_spec", label: "Тип характеристики", type: "CharField" },
  //    "char_value" => { name: "char_value", label: "Значение", type: "CharField" },
  //    "char_unit" => { name: "char_unit", label: "Единица измерения", type: "CharField" }
  //  },
  //  Map {
  //    // ← Прямая ссылка на currentCatalog.OPTIONS.layout.elementsIndex (глобальный)
  //    "name" => { name: "name", label: "Название товара", type: "CharField" },
  //    "price" => { name: "price", label: "Цена", type: "DecimalField" },
  //    "category" => { name: "category", label: "Категория", type: "ForeignKey" }
  //  }
  //]
  const metadataChain = inject<ComputedRef<Map<string, any>[]>>(
    'metadataChain',
    computed(() => []),
  );

  // Функция для поиска метаданных поля в цепочке metadataChain
  const findFieldMetadata = (fieldName: string): any => {
    for (let i = 0; i < metadataChain.value.length; i++) {
      const elementsMap = metadataChain.value[i];
      if (elementsMap && elementsMap.has(fieldName)) {
        return elementsMap.get(fieldName);
      }
    }
    return null;
  };

  // Функция для поиска данных поля в цепочке dataChain
  const findFieldData = (fieldName: string): any => {
    for (let i = 0; i < dataChain.value.length; i++) {
      const context = dataChain.value[i];
      if (context && typeof context === 'object' && context[fieldName] !== undefined) {
        return context[fieldName];
      }
    }
    return undefined;
  };

  // Создаем структуру связанных полей для удобства работы
  // [{ name, data, metadata, isEmpty }, ...]
  const relatedFields = computed(() => {
    const relatedFk = props.options.related_fk;
    if (!relatedFk) return [];

    const fields: Array<{
      name: string;
      data: any;
      metadata: any;
      isEmpty: boolean;
    }> = [];

    // Извлекаем имена полей из разных форматов related_fk
    let fieldNames: string[] = [];

    if (Array.isArray(relatedFk)) {
      fieldNames = relatedFk;
    } else if (typeof relatedFk === 'object') {
      fieldNames = Object.entries(relatedFk)
        .filter(([, value]) => typeof value === 'string' && isNaN(Number(value)))
        .map(([, value]) => value as string);
    }

    // Создаем объекты для каждого связанного поля
    fieldNames.forEach((fieldName) => {
      const metadata = findFieldMetadata(fieldName);
      const data = findFieldData(fieldName);
      const isEmpty = !data || (typeof data === 'object' && !data.id);

      fields.push({
        name: fieldName,
        data,
        metadata,
        isEmpty,
      });
    });

    return fields;
  });

  // Проверяем заполненность связанных полей из related_fk
  const relatedFieldsStatus = computed(() => {
    const fields = relatedFields.value;

    if (fields.length === 0) {
      return { isBlocked: false, missingFields: [] };
    }

    const missingFields = fields
      .filter((field) => field.isEmpty)
      .map((field) => field.metadata?.label || field.name);

    return {
      isBlocked: missingFields.length > 0,
      missingFields,
    };
  });

  const disabled = computed(() => {
    return Boolean(props.options.read_only) || relatedFieldsStatus.value.isBlocked;
  });

  // Список недостающих полей для отображения
  const missingFieldsList = computed(() => {
    if (relatedFieldsStatus.value.isBlocked) {
      return relatedFields.value
        .filter((field) => field.isEmpty)
        .map((field) => {
          const fieldLabel = field.metadata?.label || field.name;

          // Определяем контекст поиска
          let contextDescription = 'в текущем модальном окне';
          if (dataChain.value.length > 0) {
            const localContext = dataChain.value[0];
            if (localContext && localContext.hasOwnProperty(field.name)) {
              contextDescription = 'в текущем модальном окне';
            } else if (dataChain.value.length > 1) {
              contextDescription = 'в родительском модальном окне';
            }
          }

          return `${fieldLabel} (${contextDescription})`;
        });
    }
    return [];
  });

  const label = computed(() => props.options.label || props.options.name);
  const required = computed(() => !props.options.allow_null);
  const help_text = computed(() => props.options.help_text);

  // Получаем контекст для специфичных операций PrimaryKeyRelated
  const route = useRoute();
  const toast = useToast();
  // moduleName связанного каталога из параметров маршрута /:moduleName/:applName/:catalogName
  const currentModuleName = computed(() => {
    return route.params.moduleName as string;
  });
  // applName и view_name связанного каталога из метаописания поля
  const currentApplName = computed(() => props.options.appl_name);
  const currentCatalogName = computed(() => props.options.view_name);

  const originalValue = computed(() => {
    return props.originalValue;
  });

  const draftValue = computed(() => {
    return props.draftValue;
  });

  const isModified = computed(() => {
    const draft = draftValue.value;
    const original = originalValue.value;

    // Если нет draft значения, поле не изменено
    if (draft === undefined) return false;

    // Для объектов сравниваем по id, для примитивов - напрямую
    const getValue = (val: any) => val?.id ?? val;
    return getValue(original) !== getValue(draft);
  });

  // Состояние компонента
  const dialogVisible = ref(false);
  const error = ref<string | null>(null);

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

      updateField(rowItem); // Сохраняем полный объект {id, name}
      dialogVisible.value = false;
    } else {
      const hasId = rowData && 'id' in rowData;
      const hasName = rowData && 'name' in rowData;

      console.log('PrimaryKeyRelated: rowData не подходит для выбора', {
        rowData,
        'has id': hasId,
        'has name': hasName,
        'available fields': Object.keys(rowData || {}),
        '__str__ field': rowData?.__str__,
      });

      // Показываем toast с информацией о проблеме
      if (hasId && !hasName) {
        toast.add({
          severity: 'warn',
          summary: 'Ошибка выбора записи',
          detail: `Не хватает поля 'name' для выбора. Доступные поля: ${Object.keys(
            rowData || {},
          ).join(', ')}`,
          life: 5000,
        });
      } else if (!hasId) {
        toast.add({
          severity: 'error',
          summary: 'Ошибка выбора записи',
          detail: 'Отсутствует обязательное поле id',
          life: 3000,
        });
      }
    }
  };

  // Обновление поля через пропс
  const updateField = (newValue: RelatedItem | null) => {
    props.updateField?.(newValue);
  };

  const openDialog = async () => {
    dialogVisible.value = true;
    error.value = null;

    // Проверяем наличие всех необходимых параметров для загрузки каталога
    if (!currentApplName.value || !currentCatalogName.value) {
      error.value = 'Не указаны параметры связанного каталога (appl_name или view_name)';
      console.error('PrimaryKeyRelated: отсутствуют параметры каталога:', {
        appl_name: currentApplName.value,
        view_name: currentCatalogName.value,
        options: props.options,
      });
      return;
    }
    // Page2CatalogDetails сам загрузит данные при монтировании
  };

  const closeDialog = () => {
    dialogVisible.value = false;
    error.value = null;
  };

  // Очистка выбранного элемента и закрытие диалога
  const clearSelection = () => {
    updateField(null);
    dialogVisible.value = false;
  };

  // Сброс к исходному значению (может быть null)
  const resetField = () => {
    updateField(originalValue.value);
  };
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
