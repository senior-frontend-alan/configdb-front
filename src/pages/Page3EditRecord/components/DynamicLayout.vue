<!-- 
DynamicLayout: чисто презентационный компонент
Задача - отображении элементов формы и передаче событий изменения данных родительскому компоненту.
Получать данные через пропсы от родителя и отправлять события обновления обратно родителю
НЕ работать напрямую со стором 

Родительская форма определяет isModified
Централизованное управление - вся логика изменений находится в одном месте
Единообразие - все поля используют одинаковую логику определения изменений
Оптимизация - можно оптимизировать хранение данных об изменениях (например, хранить только разницу)
Простота глобальных действий - легко реализовать действия для всех измененных полей (сброс, подсветка и т.д.)
Контроль транзакций - проще реализовать отмену/повтор действий на уровне всей формы
-->

<template>
  <template v-if="elementsArray.length > 0">
    <!-- Отображение в виде JSON для отладки -->
    <pre
      v-if="showDebugJson"
      style="
        background-color: #f5f5f5;
        padding: 10px;
        border-radius: 5px;
        overflow: auto;
        max-height: 300px;
      "
      >{{ JSON.stringify(elementsArray, null, 2) }}</pre
    >
    <template v-for="(fieldMeta, index) in elementsArray" :key="fieldMeta.name || index">
      <!-- Если это секция (LayoutSection) -->
      <!-- {{ fieldMeta.class_name }} -->
      <div v-if="fieldMeta.class_name === BACKEND.class_name.LAYOUT_SECTION" class="layout-section">
        <h3 v-if="fieldMeta.label" class="section-title-wrapper">
          <span class="section-title">{{ fieldMeta.label }}</span>
        </h3>
        <!-- Рекурсивно обрабатываем вложенные элементы -->
        <DynamicLayout
          v-if="fieldMeta.elements && fieldMeta.elements.length > 0"
          :layout-elements="fieldMeta.elementsIndex"
          :original-record-data="props.originalRecordData"
          :draft-record-data="props.draftRecordData"
          :update-field="props.updateField"
        />
      </div>

      <!-- Если это строка (LayoutRow) -->
      <div v-else-if="fieldMeta.class_name === BACKEND.class_name.LAYOUT_ROW" class="layout-row">
        <!-- Рекурсивно обрабатываем вложенные элементы строки -->
        <DynamicLayout
          v-if="fieldMeta.elements && fieldMeta.elements.length > 0"
          :layout-elements="fieldMeta.elementsIndex"
          :original-record-data="props.originalRecordData"
          :draft-record-data="props.draftRecordData"
          :update-field="props.updateField"
        />
      </div>

      <!-- Если это обычное поле -->
      <div v-else :class="{ 'form-field': true }">
        <div v-if="debugField(fieldMeta)" class="debug-info">
          Поле: {{ fieldMeta.name }} (отладка отключена)
        </div>
        <!-- {{ fieldMeta.FRONTEND_CLASS }} -->
        <!-- Компоненты полей получают стандартные пропсы -->
        <!-- PrimaryKeyRelated получает глобальные данные через inject -->
        <component
          :is="getComponent(fieldMeta.FRONTEND_CLASS || FRONTEND.CHAR)"
          :options="fieldMeta"
          :original-value="props.originalRecordData?.[fieldMeta.name]"
          :draft-value="props.draftRecordData?.[fieldMeta.name]"
          :update-field="(newValue: any) => props.updateField?.(fieldMeta.name, newValue)"
        />
      </div>
    </template>
  </template>
  <div v-else class="no-fields-message">
    <Message severity="info">Нет полей для отображения</Message>
  </div>
</template>

<script lang="ts">
  /**
   * Интерфейс для элементов формы
   */
  export interface FormElement {
    name: string;
    label?: string;
    class_name?: string;
    field_class?: string;
    type?: string;
    readonly?: boolean;
    required?: boolean;
    placeholder?: string;
    choices?: Array<{ value: string | number; display_name: string }>;
    min?: number;
    max?: number;
    related_model?: string;
    related_url?: string;
    elements?: FormElement[];
    [key: string]: any;
  }

  // Интерфейс FormElement определяет структуру элементов макета формы
</script>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { getComponent } from './fields';
  import { FRONTEND, BACKEND } from '../../../services/fieldTypeService';
  import Message from 'primevue/message';

  // Используем интерфейс FormElement из верхнего скрипта
  const showDebugJson = ref(false); // Показывать ли JSON для отладки

  const props = defineProps<{
    layoutElements: Map<string, FormElement>;
    originalRecordData?: Record<string, any>;
    draftRecordData?: Record<string, any>;
    updateField?: (fieldName: string, newValue: any) => void;
  }>();

  // В шаблоне Vue директива v-for работает с массивами
  const elementsArray = computed(() => {
    const elements = Array.from(props.layoutElements.values());
    return elements;
  });

  // DynamicLayout теперь чисто презентационный компонент
  const layoutId = Math.random().toString(36).substr(2, 9);
  console.log(`DynamicLayout created with ID: ${layoutId}`);

  // Функция для отладки полей формы (отключена)
  const debugField = (_element: FormElement) => {
    // console.log(`Поле ${_element.name}:`, {
    //   значение: props.modelValue[_element.name],
    //   метаданные: _element,
    // });
    return false; // Отключаем отображение отладочной информации в UI
  };
</script>

<style scoped>
  .section-title-wrapper {
    display: flex;
    margin: 0;
    position: relative;
    top: -1.1rem;
    margin-bottom: 0.5rem;
  }

  .section-title {
    color: var(--text-color-secondary);
    background-color: #f8fafc;
    padding: 0 1rem;
    font-weight: 500;
  }

  .layout-section {
    margin-top: 2rem;
    margin-bottom: 1.5rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    padding-left: 1rem;
    padding-right: 1rem;
    border-radius: 4px;
    border: 1px solid var(--p-surface-300);
    background-color: var(rgb(99, 99, 99));
  }

  .dynamic-form-layout {
    width: 100%;
  }

  .layout-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    width: 100%;
  }

  .row-label {
    width: 100%;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .form-field {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    margin-bottom: 1rem;
    min-width: 0; /* Предотвращает переполнение контента */
  }

  .form-field.p-col {
    flex: 1 1 300px;
    margin-bottom: 0.5rem;
  }

  .form-label {
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
</style>
