<template>
  <div class="edit-record-page">
    <Card>
      <template #title>
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
      </template>
      <template #content>
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

          <div class="form-grid">
            <div v-for="field in formFields" :key="field.field" class="form-field">
              <label :for="field.field" class="form-label">{{ field.header }}</label>

              <!-- Текстовое поле -->
              <InputText
                v-if="field.type === 'text'"
                :id="field.field"
                v-model="formData[field.field]"
                class="w-full"
                :disabled="field.field === 'id'"
              />

              <!-- Числовое поле -->
              <InputNumber
                v-else-if="field.type === 'number'"
                :id="field.field"
                v-model="formData[field.field]"
                class="w-full"
              />

              <!-- Поле даты -->
              <Calendar
                v-else-if="field.type === 'date'"
                :id="field.field"
                v-model="formData[field.field]"
                dateFormat="dd.mm.yy"
                class="w-full"
              />

              <!-- Выпадающий список -->
              <Dropdown
                v-else-if="field.type === 'select'"
                :id="field.field"
                v-model="formData[field.field]"
                :options="field.options"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />

              <!-- Текстовая область -->
              <Textarea
                v-else-if="field.type === 'textarea'"
                :id="field.field"
                v-model="formData[field.field]"
                rows="3"
                class="w-full"
              />

              <!-- Для всех остальных типов - текстовое поле -->
              <InputText v-else :id="field.field" v-model="formData[field.field]" class="w-full" />
            </div>
          </div>

          <div class="form-actions">
            <Button label="Отмена" icon="pi pi-times" class="p-button-text" @click="goBack" />
            <Button label="Сохранить" icon="pi pi-check" @click="saveData" :loading="saving" />
          </div>
        </div>
      </template>
    </Card>
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
  import InputText from 'primevue/inputtext';
  import InputNumber from 'primevue/inputnumber';
  import Calendar from 'primevue/calendar';
  import Dropdown from 'primevue/dropdown';
  import Textarea from 'primevue/textarea';

  // Определяем props компонента
  const props = defineProps<{
    moduleId?: string;
    viewname?: string;
    id?: string;
  }>();

  interface FormField {
    field: string;
    header: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    options?: { label: string; value: any }[];
    required?: boolean;
  }

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
  const formFields = ref<FormField[]>([]);
  const formData = reactive<Record<string, any>>({});

  // Заголовок страницы
  const pageTitle = computed(() => {
    return `Редактирование записи: ${viewname.value} (ID: ${recordId.value})`;
  });

  // Получаем стор модуля
  const moduleStore = computed(() => {
    console.log('Получение стора для модуля:', moduleId.value);
    try {
      if (!moduleId.value) {
        console.error('moduleId не определен');
        return null;
      }

      const store = useModuleStore(moduleId.value);
      console.log('Получен стор:', store);
      return store;
    } catch (error) {
      console.error('Ошибка при получении стора модуля:', error);
      return null;
    }
  });

  // Загрузка данных записи
  const loadRecordData = async () => {
    loading.value = true;
    error.value = null;

    try {
      console.log('Загрузка данных записи:', moduleId.value, viewname.value, recordId.value);

      // Проверяем, загружены ли данные каталога
      if (!moduleStore.value) {
        throw new Error(`Модуль с ID ${moduleId.value} не найден`);
      }

      // Проверяем, загружены ли данные каталога
      if (!moduleStore.value.catalogDetails?.OPTIONS) {
        console.log('Данные каталога не загружены, пытаемся загрузить...');

        // Создаем демо-поля для формы
        formFields.value = [
          { field: 'id', header: 'ID', type: 'text', required: true },
          { field: 'name', header: 'Название', type: 'text', required: true },
          { field: 'description', header: 'Описание', type: 'textarea' },
          {
            field: 'category',
            header: 'Категория',
            type: 'select',
            options: [
              { label: 'Категория 1', value: 'cat1' },
              { label: 'Категория 2', value: 'cat2' },
              { label: 'Категория 3', value: 'cat3' },
            ],
          },
          { field: 'date', header: 'Дата', type: 'date' },
          { field: 'count', header: 'Количество', type: 'number' },
        ];

        // Заполняем данные формы демо-данными
        formData.id = recordId.value;
        formData.name = 'Тестовая запись';
        formData.description = 'Описание тестовой записи';
        formData.category = 'cat1';
        formData.date = new Date();
        formData.count = 1;

        return;
      }

      // В реальном приложении здесь должен быть запрос к API для получения данных конкретной записи
      // Например: const response = await api.get(`/api/v1/${viewname.value}/${recordId.value}/`);

      // Для демонстрации используем данные из таблицы
      const recordData = moduleStore.value.catalogDetails?.GET?.find(
        (item: any) => item.id == recordId.value,
      );

      console.log('Найденная запись:', recordData);

      if (!recordData) {
        console.warn(`Запись с ID ${recordId.value} не найдена, создаем демо-данные`);

        // Создаем демо-данные, если запись не найдена
        formFields.value = [
          { field: 'id', header: 'ID', type: 'text', required: true },
          { field: 'name', header: 'Название', type: 'text', required: true },
          { field: 'description', header: 'Описание', type: 'textarea' },
        ];

        formData.id = recordId.value;
        formData.name = 'Запись не найдена';
        formData.description = 'Данные записи не найдены в хранилище';

        return;
      }

      // Получаем метаданные полей из OPTIONS
      const storeDetails = moduleStore.value.catalogDetails?.OPTIONS;

      // Используем доступные поля из данных
      let fields: string[] = [];

      if (storeDetails.layout.uniqueFields && Array.isArray(storeDetails.layout.uniqueFields)) {
        fields = storeDetails.layout.uniqueFields;
      } else if (storeDetails.layout.columnsState?.order) {
        fields = storeDetails.layout.columnsState.order;
      } else if (storeDetails.layout.display_list) {
        fields = Array.isArray(storeDetails.layout.display_list)
          ? storeDetails.layout.display_list
          : [storeDetails.layout.display_list];
      }

      const elementsMap = storeDetails.layout.elementsMap || {};

      console.log('Доступные поля:', fields);

      // Создаем поля формы на основе полей
      formFields.value = fields.map((field: string) => {
        const elementInfo = elementsMap[field] || {};

        // Определяем тип поля
        let fieldType: FormField['type'] = 'text';

        if (elementInfo.type === 'number' || elementInfo.type === 'integer') {
          fieldType = 'number';
        } else if (elementInfo.type === 'date' || elementInfo.type === 'datetime') {
          fieldType = 'date';
        } else if (
          elementInfo.type === 'select' ||
          (elementInfo.choices && elementInfo.choices.length > 0)
        ) {
          fieldType = 'select';
        } else if (
          elementInfo.type === 'textarea' ||
          field.includes('description') ||
          field.includes('comment')
        ) {
          fieldType = 'textarea';
        }

        // Создаем объект поля формы
        const formField: FormField = {
          field,
          header:
            elementInfo?.label || field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
          type: fieldType,
          required: !!elementInfo.required,
        };

        // Если это поле с выбором, добавляем опции
        if (fieldType === 'select' && elementInfo.choices) {
          formField.options = elementInfo.choices.map((choice: any) => ({
            label: choice.label || choice.value,
            value: choice.value,
          }));
        }

        return formField;
      });

      console.log('Созданные поля формы:', formFields.value);

      // Заполняем данные формы
      for (const field of formFields.value) {
        formData[field.field] = recordData[field.field] || null;
      }

      console.log('Данные формы:', formData);
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
        .filter((field) => field.required && !formData[field.field])
        .map((field) => field.header);

      if (missingRequiredFields.length > 0) {
        throw new Error(`Заполните обязательные поля: ${missingRequiredFields.join(', ')}`);
      }

      // В реальном приложении здесь должен быть запрос к API для сохранения данных
      // Например: await api.put(`/api/v1/${viewname.value}/${recordId.value}/`, formData);

      console.log('Сохранение данных:', formData);

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

  const goBack = () => {
    const currentPath = route.path;
    const basePath = currentPath.split('/').slice(0, -1).join('/');

    router.push(basePath);
  };

  // Загрузка данных при монтировании компонента
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

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-weight: 500;
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
