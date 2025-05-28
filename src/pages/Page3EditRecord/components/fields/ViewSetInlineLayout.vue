<!-- Отображаем как таблицу -->
<!-- 
  Согласно принципу разделения ответственности:
  1. Родительский компонент отвечает за загрузку данных
  2. Компонент ViewSetInlineLayout отвечает за подготовку данных из пропсов
  3. Компонент DataTable отвечает только за отображение данных
-->
<template>
  <div>
    <label :for="fieldId">{{ fieldLabel }}</label>
    <div v-if="!props.modelValue || !props.options?.TABLE_COLUMNS" class="empty-container">
      <Message severity="info">Нет данных для отображения</Message>
    </div>

    <div v-else>
      <CatalogDataTable
        :tableRows="props.modelValue || []"
        :tableColumns="props.options?.TABLE_COLUMNS || new Map()"
        :primaryKey="props.options?.primary_key || 'id'"
        :hasBatchPermission="false"
        :selectedItems="selectedItems"
        :onRowClick="handleRowClick"
        @update:selectedItems="handleSelectedItemsChange"
      />
    </div>

    <div v-if="props.help_text" class="flex align-items-center justify-content-between mt-1">
      <Message size="small" severity="secondary" variant="simple" class="flex-grow-1">
        {{ props.help_text }}
      </Message>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { FRONTEND } from '../../../../services/fieldTypeService';
  import CatalogDataTable from '../../../../pages/Page2CatalogDetails/components/DataTable.vue';
  import Message from 'primevue/message';

  interface FieldOptions {
    FRONTEND_CLASS: typeof FRONTEND.VIEW_SET_INLINE_LAYOUT;
    ELEMENTS?: Record<string, any>;
    TABLE_COLUMNS?: Map<string, any>;
    elements: Array<any>;
    class_name: string;
    field_class: string;
    element_id: string;
    name: string;
    label?: string;
    help_text?: string;
    allow_empty?: boolean;
    list_view_items?: number;
    view_name: string;
    display_list: string[];
    natural_key: string[];
    primary_key: string;
    keyset: string[];
    js_validators?: string[];
    js_item_repr?: string;
    js_default_order?: string[];
  }

  // Определяем тип для связанных элементов
  interface RelatedItem {
    id: string | number;
    [key: string]: any;
  }

  const props = defineProps<{
    id?: string;
    name?: string;
    label?: string;
    help_text?: string;
    options: FieldOptions;
    modelValue?: any[];
    isModified: boolean;
  }>();

  // Создаем id на основе имени поля, если он не передан
  const fieldId = computed(() => props.id || `field_${props.options.name}`);
  const fieldName = computed(() => props.name || props.options.name);
  const fieldLabel = computed(() => props.label || props.options.label || props.options.name);

  const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void;
    (e: 'update:isModified', value: boolean): void;
  }>();

  // Используем ref для хранения выбранных элементов
  const selectedItems = ref<RelatedItem[]>([]);

  // Обработчик клика по строке
  const handleRowClick = (event: any) => {
    console.log('Клик по строке:', event);
  };

  // Обработчик изменения выбранных элементов
  const handleSelectedItemsChange = (items: RelatedItem[]) => {
    selectedItems.value = items;
    emit('update:modelValue', items);
    emit('update:isModified', true);
  };

  // Инициализируем выбранные элементы на основе modelValue
  if (props.modelValue && Array.isArray(props.modelValue)) {
    selectedItems.value = [...props.modelValue];
  }
</script>

<style scoped>
  .empty-container {
    padding: 1rem;
    margin-bottom: 1rem;
  }
</style>
