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
        <Button icon="pi pi-search" :disabled="disabled" @click="openDialog" aria-label="Выбрать" />
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
      :style="{ width: '90vw' }"
      :modal="true"
      :closable="true"
      :header="label"
      @hide="closeDialog"
    >
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
          :viewname="currentCatalogName"
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
  import { ref, computed, onMounted } from 'vue';
  import { useCatalogLoader } from '../../../../composables/useCatalogLoader';
  import { parseBackendApiUrl } from '../../../../config-loader';
  import CatalogDetails from '../../../../pages/Page2CatalogDetails/index.vue';
  import InputText from 'primevue/inputtext';
  import Button from 'primevue/button';
  import FloatLabel from 'primevue/floatlabel';
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
    // Основные свойства
    class_name: string; // Класс поля на бэкенде
    element_id: string; // Уникальный идентификатор элемента
    name: string; // Имя поля
    label: string; // Отображаемая метка
    help_text?: string; // Текст подсказки
    field_class: string; // Класс поля

    // Специфичные свойства для PrimaryKeyRelated
    allow_null?: boolean; // Разрешать пустое значение
    input_type?: string; // Тип ввода
    filterable?: boolean; // Можно ли фильтровать
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
  }>();

  // Извлекаем свойства из объекта options для удобства использования
  const id = computed(() => props.options.name);
  const label = computed(() => props.options.label || props.options.name);
  const placeholder = computed(() => '');
  const disabled = computed(() => false);
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
  const displayValue = ref('');

  const currentModuleName = ref('');
  const currentCatalogName = ref('');

  // Композабл для загрузки данных каталога
  const catalogLoader = useCatalogLoader();

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

  // Закрытие диалога
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

  // При изменении modelValue обновляем отображаемое значение
  onMounted(() => {
    // updateDisplayValue();
  });
</script>

<style scoped>
  /* Используются общие стили из tailwind.css */
  /* При необходимости можно добавить дополнительные стили */
</style>
