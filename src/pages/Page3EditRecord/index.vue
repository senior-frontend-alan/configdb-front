<!-- URL http://localhost:5173/catalog/characteristicSpec/edit/203:
characteristicSpec - это имя каталога
203 - это ID записи

URL для создания новой записи: http://localhost:5173/catalog/characteristicSpec/create

Маршрутизатор отвечает за загрузку данных при переходе на страницу
Роутер имеет всю необходимую информацию для загрузки данных еще до того, как компонент страницы будет создан.
-->
<template>
  <div
    :class="['edit-record-page', isCreateMode ? 'create-mode' : 'edit-mode']"
    data-testid="edit-record-page"
  >
    <div class="flex justify-content-between align-items-center mb-4">
      <h1 class="text-2xl font-bold" data-testid="edit-record-title">{{ pageTitle }}</h1>
      <Button
        label="Назад"
        icon="pi pi-arrow-left"
        class="p-button-rounded p-button-text"
        aria-label="Вернуться к списку"
        v-tooltip="'Вернуться к списку'"
        @click="goBack"
        data-testid="edit-record-back-button"
      />
    </div>

    <div v-if="loading" class="flex justify-content-center">
      <ProgressSpinner />
    </div>

    <div v-else-if="error" class="error-container">
      <Message severity="error">{{ error }}</Message>
    </div>

    <div v-else>
      <!-- Используем DynamicLayout для рекурсивного отображения элементов формы -->
      <!-- DynamicLayout получает все данные как пропсы -->
      <DynamicLayout
        v-if="currentCatalog?.OPTIONS?.layout?.elementsIndex"
        :layout-elements="currentCatalog.OPTIONS.layout.elementsIndex"
        :original-record-data="originalRecordData"
        :draft-record-data="draftRecordData"
        :update-field="updateField"
      />

      <!-- Панель кнопок, которая может быть фиксированной или нет в зависимости от прокрутки -->
      <div
        ref="formActionsRef"
        :class="[
          'flex justify-content-between mt-4 p-3',
          hasUnsavedChanges ? 'sticky-form-actions' : '',
        ]"
      >
        <Button
          :label="hasUnsavedChanges ? `Отменить изменения: ${changedFieldsCount}` : 'Нет изменений'"
          icon="pi pi-undo"
          class="p-button-secondary"
          :disabled="!hasUnsavedChanges"
          @click="resetAllFields"
          data-testid="edit-record-reset-all-button"
        />
        <div class="flex gap-2">
          <Button
            label="Сохранить"
            icon="pi pi-check"
            class="p-button-primary"
            :loading="saving"
            :disabled="!hasUnsavedChanges"
            @click="saveData"
            data-testid="edit-record-save-button"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted, watch, provide } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { createRecord, saveRecord, getOrFetchRecord } from '../../stores/data-loaders';
  import { type Catalog, useModuleStore } from '../../stores/module-factory';
  import { useToast } from 'primevue/usetoast';
  import DynamicLayout from './components/DynamicLayout.vue';
  import Button from 'primevue/button';
  import ProgressSpinner from 'primevue/progressspinner';
  import Message from 'primevue/message';

  // Определяем props компонента
  const props = defineProps<{
    moduleName: string;
    applName: string;
    catalogName: string;
    id?: string;
  }>();

  // Получаем параметры маршрута
  const router = useRouter();
  const route = useRoute();
  const toast = useToast();

  // Используем props с фолбэком на параметры маршрута
  const moduleName = computed(() => props.moduleName || (route.params.moduleName as string));
  const applName = computed(() => props.applName || (route.params.applName as string));
  const catalogName = computed(() => props.catalogName || (route.params.catalogName as string));
  const recordId = computed(() => props.id || (route.params.id as string));

  // Определяем режим создания
  const isCreateMode = computed(() => recordId.value === 'add');

  // Получаем стор модуля
  const moduleStore = computed(() => useModuleStore(moduleName.value));

  // Вычисляем catalogKey однажды в родительском компоненте
  const catalogKey = computed(() => `${applName.value}_${catalogName.value.toLowerCase()}`);
  const catalogData = computed(() => {
    if (!moduleStore.value) return null;
    return (moduleStore.value as any)[catalogKey.value];
  });

  // Вычисляем ссылки на данные записи
  const originalRecordData = computed(() => {
    return catalogData.value?.[recordId.value] || {};
  });
  const draftRecordData = computed(() => {
    const draftKey = `draft_${recordId.value}`;
    return catalogData.value?.[draftKey] || {};
  });

  // Функция обновления поля
  const updateField = (fieldName: string, newValue: any) => {
    moduleStore.value?.updateRecordField(
      applName.value,
      catalogName.value,
      recordId.value,
      fieldName,
      newValue,
    );
  };

  // контекст для PrimaryKeyRelated
  // Две отдельные цепочки для чистоты архитектуры
  // 1. Цепочка данных для поиска значений полей
  const dataChain = computed(() => [draftRecordData.value]);
  provide('dataChain', dataChain);

  // 2. Цепочка метаданных - просто ссылка на глобальный elementsIndex
  const metadataChain = computed(() => {
    const layoutElements = currentCatalog.value?.OPTIONS?.layout?.elementsIndex;
    return layoutElements ? [layoutElements] : [];
  });
  provide('metadataChain', metadataChain);

  const currentCatalog = ref<Catalog | null>(null);

  const changesInfo = computed(() => {
    const original = originalRecordData.value;
    const draft = draftRecordData.value;

    // Быстрое сравнение по количеству ключей
    const originalKeys = Object.keys(original);
    const draftKeys = Object.keys(draft);

    if (originalKeys.length !== draftKeys.length) {
      return { hasChanges: true, count: Math.abs(originalKeys.length - draftKeys.length) };
    }

    // Подсчитываем измененные поля
    let count = 0;
    originalKeys.forEach((key) => {
      const originalValue = original[key];
      const draftValue = draft[key];

      // Для простых типов - прямое сравнение
      if (typeof originalValue !== 'object' || originalValue === null) {
        if (originalValue !== draftValue) count++;
      } else {
        // Для объектов и массивов - JSON сравнение
        if (JSON.stringify(originalValue) !== JSON.stringify(draftValue)) count++;
      }
    });

    return { hasChanges: count > 0, count };
  });

  const hasUnsavedChanges = computed(() => changesInfo.value.hasChanges);
  const changedFieldsCount = computed(() => changesInfo.value.count);

  // Состояние компонента
  const loading = ref(true);
  const saving = ref(false);
  const error = ref<string | null>(null);
  const formActionsRef = ref<HTMLElement | null>(null);
  const isAtBottom = ref(false);

  const pageTitle = computed(() => {
    return isCreateMode.value
      ? `Создание записи: ${catalogName.value}`
      : `Редактирование записи: ${catalogName.value} (ID: ${recordId.value})`;
  });

  const resetAllFields = () => {
    // Сбрасываем draft данные к original через стор
    const result = moduleStore.value?.resetRecord(
      applName.value,
      catalogName.value,
      recordId.value,
    );

    if (!result?.success) {
      console.error('Ошибка сброса данных:', result?.error);
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось отменить изменения',
        life: 5000,
      });
      return;
    }

    toast.add({
      severity: 'success',
      summary: 'Изменения отменены',
      detail: 'Все внесенные изменения были отменены',
      life: 3000,
    });
  };

  const goBack = () => {
    router.push({
      path: `/${moduleName.value}/${applName.value}/${catalogName.value}`,
    });
  };

  // Функция JSON.parse(JSON.stringify()) не справляется с циклическими ссылками и выбрасывает ошибку
  // Эта функция создает глубокую копию объекта, но без циклических ссылок
  // Она также более безопасна для сложных объектов, содержащих специальные типы данных
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

  // Сохранение данных (обновленная логика с {id})
  const saveData = async () => {
    saving.value = true;
    error.value = null;

    try {
      const dataToSave = draftRecordData.value;

      // Проверяем, что есть данные для сохранения
      if (!dataToSave || Object.keys(dataToSave).length === 0) {
        throw new Error('Нет данных для сохранения');
      }

      try {
        // Создаем чистый объект данных без реактивности и циклических ссылок
        const cleanData = cleanObject(dataToSave);
        console.log('Данные для отправки:', cleanData);

        let recordIdentifier: string | null = null;

        try {
          // Выполняем сохранение данных в зависимости от режима
          if (isCreateMode.value) {
            // Создание в сторе новой записи
            const result = await createRecord(
              moduleName.value,
              applName.value,
              catalogName.value,
              cleanData,
            );

            if (!result.success || !result.recordId) {
              throw result.error || new Error('Не удалось создать запись');
            }

            recordIdentifier = result.recordId;
          } else {
            // Обновление в сторе существующей записи
            const result = await saveRecord(
              moduleName.value,
              applName.value,
              catalogName.value,
              recordId.value,
              cleanData,
            );

            if (!result.success) {
              throw result.error || new Error(`Не удалось обновить запись ${recordId.value}`);
            }

            recordIdentifier = String(recordId.value);
          }
        } catch (error) {
          console.error('Ошибка при сохранении данных:', error);
          throw error;
        }

        // Показываем сообщение об успешном сохранении
        let successMessage = '';

        if (isCreateMode.value) {
          successMessage = `Запись успешно создана (ID: ${recordIdentifier})`;
        } else {
          successMessage = `Данные успешно обновлены (ID: ${recordIdentifier})`;
        }

        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: successMessage,
          life: 0, // Делает тоаст постоянным, пока пользователь не закроет
        });

        // Возвращаемся к списку после сохранения
        goBack();
      } catch (err: any) {
        console.error('Ошибка при сохранении данных:', err);

        // Показываем сообщение об ошибке
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: `Не удалось ${isCreateMode.value ? 'создать запись' : 'сохранить данные'}: ${
            err.message || 'Неизвестная ошибка'
          }`,
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

  // Функция для проверки, находится ли пользователь в конце страницы
  const checkIfAtBottom = () => {
    // Расстояние от верха страницы до текущей позиции прокрутки
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    // Высота видимой области (окна браузера)
    const windowHeight = window.innerHeight;
    // Общая высота страницы
    const documentHeight = document.documentElement.scrollHeight;
    // Высота панели с кнопками
    const formActionsHeight = formActionsRef.value ? formActionsRef.value.offsetHeight : 0;

    // Считаем, что пользователь достиг конца страницы, если до конца осталось меньше или равно высоте панели + небольшой запас
    isAtBottom.value = scrollTop + windowHeight >= documentHeight - formActionsHeight - 20;
  };

  // Простой дебаунс для обработчика прокрутки
  let scrollTimeout: number | null = null;
  const debouncedCheckIfAtBottom = () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = window.setTimeout(() => {
      checkIfAtBottom();
    }, 100);
  };

  // Функции для работы с прокруткой
  const initScrollListener = () => {
    window.addEventListener('scroll', debouncedCheckIfAtBottom);
    checkIfAtBottom();
  };

  const removeScrollListener = () => {
    window.removeEventListener('scroll', debouncedCheckIfAtBottom);
  };

  onMounted(async () => {
    // Проверяем наличие всех необходимых параметров
    if (!moduleName.value || !applName.value || !catalogName.value) {
      error.value = 'Не все необходимые параметры доступны для загрузки данных';
      loading.value = false;
      return;
    }

    loading.value = true;
    error.value = null;

    const result = await getOrFetchRecord(
      moduleName.value,
      applName.value,
      catalogName.value,
      recordId.value,
    );

    if (!result.success) {
      error.value = result.error?.message || 'Ошибка загрузки данных';
      console.error('Ошибка загрузки данных:', result.error);
      loading.value = false;
      return;
    }

    // Данные уже загружены в стор через initRecord
    // originalRecordData и draftRecordData автоматически обновятся через computed

    if (result.catalog) {
      currentCatalog.value = result.catalog;
    }

    loading.value = false;
    initScrollListener();
  });

  onUnmounted(() => {
    removeScrollListener();
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
  });
</script>

<style scoped>
  /* Стили для фиксированной панели кнопок */
  .sticky-form-actions {
    position: fixed;
    bottom: 0;
    left: 18rem; /* Отступ слева равен ширине бокового меню */
    right: 0;
    z-index: 10;
    background-color: white;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    padding: 0.75rem 1rem;
  }

  /* Корректировка отступа при скрытом меню */
  .layout-container:not(.layout-sidebar-active) .sticky-form-actions {
    left: 0;
  }

  /* Существующие стили */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-bottom: 0.5rem;
  }

  .edit-record-page {
    padding-bottom: 5rem; /* Добавляем место для панели действий */
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
</style>

<style>
  /* Стили для модифицированных полей */
  .field-modified {
    outline: 2px solid var(--field-modified-color) !important; /* Оранжевая граница */
    border-radius: 6px;
  }

  /* При наведении сохраняем цвет границы */
  .field-modified:hover {
    border-color: var(--field-modified-color-dark) !important;
  }

  /* При фокусе сохраняем цвет границы, но делаем её ярче */
  .field-modified:focus {
    border-color: var(--field-modified-color-dark) !important;
    box-shadow: 0 0 0 1px var(--field-modified-color-dark) !important;
  }
</style>
