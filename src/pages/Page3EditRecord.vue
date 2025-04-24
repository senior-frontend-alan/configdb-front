<template>
  <div class="edit-record-page">
    <div class="header-container">
      <h4>{{ pageTitle }}</h4>
      <div class="actions-container">
        <Button
          icon="pi pi-arrow-left"
          class="p-button-rounded p-button-text"
          aria-label="Вернуться к списку"
          v-tooltip="'Вернуться к списку'"
          @click="goBack"
        />
      </div>
    </div>
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <p>Загрузка данных...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <Message severity="error">{{ error }}</Message>
    </div>

    <div v-else class="edit-form-container">
      <div v-if="saving" class="saving-overlay">
        <ProgressSpinner />
        <p>Сохранение данных...</p>
      </div>

      <!-- Используем DynamicFormLayout для рекурсивного отображения элементов формы -->
      <DynamicFormLayout
        v-if="layoutElements.length > 0 || formFields.length > 0"
        :elements="layoutElements.length > 0 ? layoutElements : formFields"
        :model-value="formData"
        @update:model-value="(newValue) => (formData = newValue)"
      />

      <div class="form-actions">
        <Button label="Отмена" icon="pi pi-times" class="p-button-text" @click="goBack" />
        <Button label="Сохранить" icon="pi pi-check" @click="saveData" :loading="saving" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, reactive } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useModuleStore } from '../stores/module-factory';

  import Card from 'primevue/card';
  import Message from 'primevue/message';
  import ProgressSpinner from 'primevue/progressspinner';
  import Button from 'primevue/button';
  import DynamicFormField from '../components/DynamicFormField.vue';
  import DynamicFormLayout from '../components/DynamicFormLayout.vue';

  // Определяем типы для формы
  interface FormField {
    name: string;
    label: string;
    type: string;
    class_name?: string;
    field_class?: string;
    readonly?: boolean;
    required?: boolean;
    placeholder?: string;
    choices?: Array<{ value: string | number; display_name: string }>;
    min?: number;
    max?: number;
    related_model?: string;
    related_url?: string;
  }

  // Определяем props компонента
  const props = defineProps<{
    moduleId?: string;
    viewname?: string;
    id?: string;
  }>();

  // Получаем параметры маршрута
  const route = useRoute();
  const router = useRouter();
  const moduleId = computed(() => props.moduleId || (route.meta.moduleId as string));
  const viewname = computed(() => props.viewname || (route.params.viewname as string));
  const recordId = computed(() => props.id || (route.params.id as string));

  // Состояние компонента
  const loading = ref(true);
  const saving = ref(false);
  const error = ref<string | null>(null);

  // Заголовок страницы
  const pageTitle = computed(() => {
    return `Редактирование записи: ${viewname.value} (ID: ${recordId.value})`;
  });

  // Получаем стор модуля и проверяем его наличие
  const getModuleStore = () => {
    console.log('Получение стора для модуля:', moduleId.value);

    if (!moduleId.value) {
      throw new Error('moduleId не определен');
    }

    try {
      const store = useModuleStore(moduleId.value);

      if (!store) {
        throw new Error(`Модуль с ID ${moduleId.value} не найден`);
      }

      return store;
    } catch (error) {
      console.error('Ошибка при получении стора модуля:', error);
      throw new Error(
        `Ошибка при получении стора модуля: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  const formFields = ref<FormField[]>([]);
  const formData = ref<Record<string, any>>({});
  const layoutElements = ref<any[]>([]);

  // Функция для возврата к списку
  const goBack = () => {
    const currentPath = route.path;
    const basePath = currentPath.split('/').slice(0, -1).join('/');
    router.push(basePath);
  };

  // Загрузка данных записи
  const loadRecordData = async () => {
    loading.value = true;
    error.value = null;

    try {
      console.log('Загрузка данных записи:', moduleId.value, viewname.value, recordId.value);

      // Проверяем, загружены ли данные модуля
      const moduleStore = getModuleStore();

      // Получаем метаданные из OPTIONS
      const storeOptions = moduleStore.catalogDetails?.[viewname.value]?.OPTIONS;

      if (!storeOptions || !storeOptions.layout) {
        throw new Error(`Метаданные для представления ${viewname.value} не найдены`);
      }

      // Получаем данные записи из GET
      const recordData = moduleStore.catalogDetails?.[viewname.value]?.GET?.results?.find(
        (item: any) => item.id == recordId.value,
      );

      console.log('Найденная запись:', recordData);

      // Создаем поля формы на основе элементов из OPTIONS
      if (storeOptions.layout.elements && Array.isArray(storeOptions.layout.elements)) {
        layoutElements.value = storeOptions.layout.elements;
        formFields.value = layoutElements.value.map((element: any) => {
          // Создаем объект поля формы
          const field: FormField = {
            name: element.name,
            label: element.label || element.name,
            type: element.type || 'text',
            class_name: element.class_name,
            field_class: element.field_class,
            readonly: element.readonly || element.name === 'id',
            required: element.required || false,
            placeholder: element.placeholder || '',
          };

          // Если это поле с выбором, добавляем опции
          if (element.choices && Array.isArray(element.choices)) {
            field.choices = element.choices.map((choice: any) => ({
              value: choice.value,
              display_name: choice.display_name || choice.value,
            }));
          }

          return field;
        });

        console.log('Созданные поля формы:', formFields.value);

        // Заполняем данные формы
        if (recordData) {
          // Если запись найдена, заполняем данными из записи
          formData.value = { ...recordData };
        } else {
          // Если запись не найдена, создаем пустой объект с полями из формы
          formFields.value.forEach((field) => {
            formData.value[field.name] = null;
          });

          // ID записи всегда устанавливаем из URL
          formData.value.id = recordId.value;
        }

        console.log('Данные формы:', formData.value);
      } else {
        throw new Error('Не удалось получить элементы формы из метаданных');
      }
    } catch (e) {
      console.error('Ошибка загрузки данных записи:', e);
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки данных записи';
    } finally {
      loading.value = false;
    }
  };

  // Сохранение данных
  const saveData = async () => {
    saving.value = true;
    error.value = null;

    try {
      // Проверка обязательных полей
      const missingRequiredFields = formFields.value
        .filter((field) => field.required && !formData.value[field.name])
        .map((field) => field.label);

      if (missingRequiredFields.length > 0) {
        throw new Error(`Заполните обязательные поля: ${missingRequiredFields.join(', ')}`);
      }

      // В реальном приложении здесь должен быть запрос к API для сохранения данных
      // Например: await api.put(`/api/v1/${viewname.value}/${recordId.value}/`, formData.value);

      console.log('Сохранение данных:', formData.value);

      // Имитация задержки сохранения
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // После успешного сохранения возвращаемся к списку
      goBack();
    } catch (e) {
      console.error('Ошибка сохранения данных:', e);
      error.value = e instanceof Error ? e.message : 'Ошибка сохранения данных';
    } finally {
      saving.value = false;
    }
  };

  onMounted(async () => {
    console.log('Page3EditRecord mounted, params:', {
      moduleId: moduleId.value,
      viewname: viewname.value,
      recordId: recordId.value,
      meta: route.meta,
    });
    await loadRecordData();
  });
</script>

<style scoped>
  .edit-record-page {
    padding: 1rem;
    padding-bottom: 3rem;
  }

  .header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .actions-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 1rem;
  }

  .edit-form-container {
    position: relative;
  }

  .saving-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--surface-200);
  }

  .w-full {
    width: 100%;
  }
</style>
