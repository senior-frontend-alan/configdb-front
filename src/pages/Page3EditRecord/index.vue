<!-- оптимальное место для работы со стором, так как:
Страница является точкой входа и отвечает за получение и подготовку данных
Страница знает о контексте использования (ID записи, модуль и т.д.)
Упрощается повторное использование дочерних компонентов -->

<template>
  <div class="p-4">
    <div class="flex justify-content-between align-items-center mb-4">
      <h1 class="text-2xl font-bold">{{ pageTitle }}</h1>
      <Button
        label="Назад"
        icon="pi pi-arrow-left"
        class="p-button-rounded p-button-text"
        aria-label="Вернуться к списку"
        v-tooltip="'Вернуться к списку'"
        @click="goBack"
      />
    </div>

    <div v-if="loading" class="flex justify-content-center">
      <ProgressSpinner />
    </div>

    <div v-else-if="error" class="p-4 bg-red-100 text-red-700 border-round mb-4">
      {{ error }}
    </div>

    <div v-else class="card">
      <!-- Используем DynamicLayout для рекурсивного отображения элементов формы -->
      <DynamicLayout
        v-if="storeOptions && storeOptions.layout.ELEMENTS"
        :layout-elements="storeOptions.layout.ELEMENTS"
        :record-id="recordId"
        v-model="formData"
      />

      <div class="form-actions flex justify-content-end mt-4 gap-2">
        <Button label="Отмена" icon="pi pi-times" class="p-button-text" @click="goBack" />
        <Button
          label="Сохранить"
          icon="pi pi-check"
          class="p-button-primary"
          :loading="saving"
          @click="saveData"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import api from '../../api';
  import { useToast } from 'primevue/usetoast';
  import { useModuleStore } from '../../stores/module-factory';

  import ProgressSpinner from 'primevue/progressspinner';
  import Button from 'primevue/button';

  import DynamicLayout from './components/DynamicLayout.vue';

  // Типы элементов макета определены в компоненте DynamicLayout

  // Определяем props компонента
  const props = defineProps<{
    moduleName?: string;
    viewname?: string;
    id?: string;
  }>();

  // Получаем параметры маршрута
  const router = useRouter();
  const route = useRoute();
  const toast = useToast();
  const moduleName = computed(() => props.moduleName || (route.meta.moduleName as string));
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

  // Данные формы
  const formData = ref<Record<string, any>>({});
  const storeOptions = ref<any>(null);

  // Функция для сбора имен полей из элементов макета
  const collectFieldNames = (elements: any[]): string[] => {
    return elements.reduce((names: string[], element: any) => {
      if (element.name && !element.class_name?.includes('Layout')) {
        names.push(element.name);
      }
      if (element.elements && Array.isArray(element.elements)) {
        names.push(...collectFieldNames(element.elements));
      }
      return names;
    }, []);
  };

  // Получаем стор модуля и проверяем его наличие
  const getModuleStore = () => {
    console.log('Получение стора для модуля:', moduleName.value);

    if (!moduleName.value) {
      throw new Error('moduleName не определен');
    }

    try {
      const store = useModuleStore(moduleName.value);

      if (!store) {
        throw new Error(`Модуль с ID ${moduleName.value} не найден`);
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

  // Функция для возврата к списку
  const goBack = () => {
    const currentPath = route.path;
    const basePath = currentPath.split('/').slice(0, -2).join('/');
    router.push(basePath);
  };

  // Загрузка данных записи
  const loadRecordData = async () => {
    loading.value = true;
    error.value = null;

    try {
      console.log('Загрузка данных записи:', moduleName.value, viewname.value, recordId.value);

      // Проверяем, загружены ли данные модуля
      const moduleStore = getModuleStore();

      // Получаем метаданные из OPTIONS
      const options = moduleStore.catalogsByName?.[viewname.value]?.OPTIONS;

      if (!options || !options.layout) {
        throw new Error(`Метаданные для представления ${viewname.value} не найдены`);
      }

      // Получаем данные записи из GET
      const recordData = moduleStore.catalogsByName?.[viewname.value]?.GET?.results?.find(
        (item: any) => item.id == recordId.value,
      );

      console.log('Найденная запись:', recordData);

      // Сохраняем метаданные и данные записи для передачи в DynamicLayout
      if (options.layout.ELEMENTS) {
        storeOptions.value = options;
        recordData.value = recordData || null;

        console.log('Загруженные метаданные:', storeOptions.value);
        console.log('Данные записи:', recordData.value);

        // Инициализируем formData данными записи или пустыми полями
        // Если есть данные записи, используем их
        formData.value = recordData ? { ...recordData } : {};

        // Если создаем новую запись (нет recordData), инициализируем пустыми полями
        if (!recordData) {
          // Используем Map для инициализации полей
          options.layout.ELEMENTS.forEach((element: any, name: string) => {
            // Инициализируем поле с учетом его типа
            let defaultValue: any = null;

            // НЕ удалять! Можно добавить логику для разных типов полей
            // if (element.FRONTEND_CLASS === 'Boolean') {
            //   defaultValue = false;
            // } else if (element.FRONTEND_CLASS === 'Number') {
            //   defaultValue = 0;
            // } else if (element.FRONTEND_CLASS === 'Array') {
            //   defaultValue = [];
            // }

            formData.value[name] = defaultValue;
          });

          // Если есть ID записи, устанавливаем его
          if (recordId.value) {
            formData.value.id = recordId.value;
          }
        }
      } else {
        throw new Error(`Метаданные ELEMENTS для представления ${viewname.value} не найдены`);
      }
    } catch (e) {
      console.error('Ошибка загрузки данных записи:', e);
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки данных записи';
    } finally {
      loading.value = false;
    }
  };
  // Функция JSON.parse(JSON.stringify()) не справляется с циклическими ссылками и выбрасывает ошибку
  // Наша функция cleanObject специально обрабатывает такие случаи, пропуская проблемные свойства
  // Она также более безопасна для сложных объектов, содержащих специальные типы данных
  // Теперь при сохранении данных формы не должно возникать ошибок, связанных с циклическими ссылками. Функция cleanObject создает "плоскую" копию объекта, которая безопасно сериализуется в JSON для отправки на сервер.
  // Функция для очистки объекта от циклических ссылок и реактивных свойств
  const cleanObject = (obj: any) => {
    // Создаем новый объект для результата
    const result: Record<string, any> = {};

    // Перебираем все ключи объекта
    for (const key in obj) {
      // Пропускаем служебные свойства Vue
      if (key.startsWith('__v_') || key === 'value' || key === 'effect' || key === 'dep') {
        continue;
      }

      // Получаем значение
      const value = obj[key];

      // Обрабатываем значение в зависимости от его типа
      if (value === null || value === undefined) {
        result[key] = value;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Если это объект, рекурсивно очищаем его
        // Проверяем, что это не функция и не DOM-элемент
        if (typeof value !== 'function' && !(value instanceof Node)) {
          result[key] = cleanObject(value);
        }
      } else if (Array.isArray(value)) {
        // Если это массив, очищаем каждый элемент
        result[key] = value.map((item) => {
          if (item === null || item === undefined || typeof item !== 'object') {
            return item;
          }
          return cleanObject(item);
        });
      } else {
        // Примитивные значения копируем как есть
        result[key] = value;
      }
    }

    return result;
  };

  // Сохранение данных
  const saveData = async () => {
    saving.value = true;
    error.value = null;

    try {
      // Проверка обязательных полей
      // Вся логика проверки обязательных полей теперь в компоненте DynamicLayout
      // Проверяем только наличие данных в formData
      if (Object.keys(formData.value).length === 0) {
        throw new Error('Форма не содержит данных для сохранения');
      }

      // Отправляем PATCH запрос для сохранения данных
      try {
        saving.value = true;

        // Формируем URL для запроса
        const url = `/catalog/api/v1/${viewname.value}/${recordId.value}/?mode=short`;
        console.log(`Отправка PATCH запроса на: ${url}`);

        // Создаем чистый объект данных без реактивности и циклических ссылок
        const cleanData = cleanObject(formData.value);
        console.log('Данные для отправки:', cleanData);

        // Отправляем запрос
        const response = await api.patch(url, cleanData);

        console.log('Ответ сервера:', response.data);

        // Обновляем данные в сторе
        const moduleStore = getModuleStore();
        if (moduleStore.updateRecordInStore) {
          const updated = moduleStore.updateRecordInStore(
            viewname.value,
            recordId.value,
            response.data,
          );
          if (updated) {
            console.log('Данные в сторе успешно обновлены');
          } else {
            console.warn('Не удалось обновить данные в сторе');
          }
        }

        // Показываем сообщение об успешном сохранении
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Данные успешно сохранены',
          life: 3000,
        });

        // Возвращаемся к списку после сохранения
        goBack();
      } catch (err: any) {
        console.error('Ошибка при сохранении данных:', err);

        // Показываем сообщение об ошибке
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: `Не удалось сохранить данные: ${err.message || 'Неизвестная ошибка'}`,
          life: 5000,
        });
      } finally {
        saving.value = false;
      }
    } catch (e) {
      console.error('Ошибка сохранения данных:', e);
      error.value = e instanceof Error ? e.message : 'Ошибка сохранения данных';
    } finally {
      saving.value = false;
    }
  };

  onMounted(async () => {
    console.log('Page3EditRecord mounted, params:', {
      moduleName: moduleName.value,
      viewname: viewname.value,
      recordId: recordId.value,
      meta: route.meta,
    });
    await loadRecordData();
  });
</script>

<style scoped>
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-bottom: 0.5rem;
  }

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
