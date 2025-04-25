<template>
  <div class="add-new-data-dialog">
    <Button
      icon="pi pi-plus"
      label="Добавить"
      class="p-button-sm"
      aria-label="Добавить запись"
      v-tooltip="'Добавить новую запись'"
      @click="visible = true"
    />

    <Dialog
      v-model:visible="visible"
      header="Добавление новой записи"
      :style="{ width: '40rem' }"
      :modal="true"
      :closable="true"
    >
      <div class="add-data-content">
        <div v-if="loading" class="loading-container">
          <ProgressSpinner />
          <p>Загрузка формы...</p>
        </div>
        <div v-else-if="error" class="error-container">
          <Message severity="error">{{ error }}</Message>
        </div>
        <div v-else class="form-container">
          <div v-for="field in formFields" :key="field.field" class="form-field">
            <label :for="field.field" class="form-label">{{ field.header }}</label>
            <InputText 
              v-if="field.type === 'text'" 
              :id="field.field" 
              v-model="formData[field.field]" 
              class="w-full"
            />
            <InputNumber 
              v-else-if="field.type === 'number'" 
              :id="field.field" 
              v-model="formData[field.field]" 
              class="w-full"
            />
            <Calendar 
              v-else-if="field.type === 'date'" 
              :id="field.field" 
              v-model="formData[field.field]" 
              dateFormat="dd.mm.yy"
              class="w-full"
            />
            <Dropdown 
              v-else-if="field.type === 'select'" 
              :id="field.field" 
              v-model="formData[field.field]" 
              :options="field.options" 
              optionLabel="label" 
              optionValue="value"
              class="w-full"
            />
            <Textarea 
              v-else-if="field.type === 'textarea'" 
              :id="field.field" 
              v-model="formData[field.field]" 
              rows="3" 
              class="w-full"
            />
            <InputText 
              v-else 
              :id="field.field" 
              v-model="formData[field.field]" 
              class="w-full"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Отмена"
          icon="pi pi-times"
          class="p-button-text"
          @click="visible = false"
        />
        <Button
          label="Сохранить"
          icon="pi pi-check"
          @click="saveData"
          :loading="saving"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useModuleStore } from '../stores/module-factory';

interface FormField {
  field: string;
  header: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: { label: string; value: any }[];
  required?: boolean;
}

const props = defineProps<{
  moduleId: string;
}>();

const emit = defineEmits<{
  (e: 'data-added', value: any): void;
}>();

// Состояние диалога
const visible = ref(false);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

// Поля формы
const formFields = ref<FormField[]>([]);
const formData = reactive<Record<string, any>>({});

// Получаем store модуля
const getModuleStore = () => {
  const moduleStore = useModuleStore(props.moduleId);
  if (!moduleStore) {
    throw new Error(`Модуль с ID ${props.moduleId} не найден`);
  }
  return moduleStore;
};

// Загрузка полей формы при открытии диалога
watch(() => visible.value, async (isVisible: boolean) => {
  if (isVisible) {
    await loadFormFields();
  }
});

// Загрузка полей формы
const loadFormFields = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Создаем демо-поля для формы, чтобы компонент всегда работал
    formFields.value = [
      { field: 'name', header: 'Название', type: 'text', required: true },
      { field: 'description', header: 'Описание', type: 'textarea' },
      { field: 'category', header: 'Категория', type: 'select', options: [
        { label: 'Категория 1', value: 'cat1' },
        { label: 'Категория 2', value: 'cat2' },
        { label: 'Категория 3', value: 'cat3' }
      ]},
      { field: 'date', header: 'Дата', type: 'date' },
      { field: 'count', header: 'Количество', type: 'number' }
    ];
    
    // Попытка получить реальные поля из хранилища модуля
    try {
      const moduleStore = getModuleStore();
      
      // Проверяем, загружены ли данные каталога
      if (moduleStore.catalogDetails?.OPTIONS?.layout) {
        console.log('Данные каталога загружены, пытаемся получить поля...');
        
        // Получаем данные о колонках из store модуля
        const storeDetails = moduleStore.catalogDetails.OPTIONS;
        
        // Используем доступные поля из данных
        let fields: string[] = [];
        
        if (storeDetails.layout.uniqueFields && Array.isArray(storeDetails.layout.uniqueFields)) {
          console.log('Используем uniqueFields');
          fields = storeDetails.layout.uniqueFields;
        } else if (storeDetails.layout.columnsState?.order) {
          console.log('Используем columnsState.order');
          fields = storeDetails.layout.columnsState.order;
        } else if (storeDetails.layout.display_list) {
          console.log('Используем display_list');
          fields = Array.isArray(storeDetails.layout.display_list) 
            ? storeDetails.layout.display_list 
            : [storeDetails.layout.display_list];
        }
        
        if (fields.length > 0) {
          const elementsMap = storeDetails.layout.elementsMap || new Map();
          
          console.log('Доступные поля:', fields);
          
          // Создаем поля формы на основе полей
          formFields.value = fields
            .filter((field: string) => field !== 'id') // Исключаем поле id
            .map((field: string) => {
              const elementInfo = elementsMap.get(field) || {};
              
              // Определяем тип поля
              let fieldType: FormField['type'] = 'text';
              
              if (elementInfo.type === 'number' || elementInfo.type === 'integer') {
                fieldType = 'number';
              } else if (elementInfo.type === 'date' || elementInfo.type === 'datetime') {
                fieldType = 'date';
              } else if (elementInfo.type === 'select' || (elementInfo.choices && elementInfo.choices.length > 0)) {
                fieldType = 'select';
              } else if (elementInfo.type === 'textarea' || field.includes('description') || field.includes('comment')) {
                fieldType = 'textarea';
              }
              
              // Создаем объект поля формы
              const formField: FormField = {
                field,
                header: elementInfo?.label || field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
                type: fieldType,
                required: !!elementInfo.required
              };
              
              // Если это поле с выбором, добавляем опции
              if (fieldType === 'select' && elementInfo.choices) {
                formField.options = elementInfo.choices.map((choice: any) => ({
                  label: choice.label || choice.value,
                  value: choice.value
                }));
              }
              
              return formField;
            });
        }
      }
    } catch (innerError) {
      console.warn('Не удалось получить реальные поля из хранилища:', innerError);
      // Продолжаем с демо-полями, которые уже установлены
    }
    
    // Инициализация formData
    formFields.value.forEach(field => {
      formData[field.field] = null;
    });
  } catch (e) {
    console.error('Ошибка загрузки полей формы:', e);
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки полей формы';
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
      .filter(field => field.required && !formData[field.field])
      .map(field => field.header);
    
    if (missingRequiredFields.length > 0) {
      error.value = `Заполните обязательные поля: ${missingRequiredFields.join(', ')}`;
      return;
    }
    
    // Здесь должна быть логика сохранения данных на сервере
    // В реальном приложении здесь может быть вызов API
    console.log('Сохранение данных:', formData);
    
    // Оповещаем родительский компонент о добавлении данных
    emit('data-added', { ...formData });
    
    // Закрываем диалог и очищаем форму
    visible.value = false;
    formFields.value.forEach(field => {
      formData[field.field] = null;
    });
  } catch (e) {
    console.error('Ошибка сохранения данных:', e);
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения данных';
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.add-new-data-dialog {
  display: inline-block;
}

.add-data-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 70vh;
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

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  max-height: 60vh;
  padding-right: 0.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
}

.w-full {
  width: 100%;
}
</style>
