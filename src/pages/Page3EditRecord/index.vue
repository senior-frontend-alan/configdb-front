<!-- URL http://localhost:5173/catalog/characteristicSpec/edit/203:
characteristicSpec - это имя каталога
203 - это ID записи

Маршрутизатор отвечает за загрузку данных при переходе на страницу
Роутер имеет всю необходимую информацию для загрузки данных еще до того, как компонент страницы будет создан.
-->
<template>
  <div class="edit-record-page">
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

    <div v-else-if="error" class="error-container">
      <Message severity="error">{{ error }}</Message>
    </div>

    <div v-else>
      <!-- Используем DynamicLayout для рекурсивного отображения элементов формы -->
      <DynamicLayout
        v-if="storeOptions && storeOptions.layout.ELEMENTS"
        :layout-elements="storeOptions.layout.ELEMENTS"
        :record-id="recordId"
        :model-value="mergedData"
        :patch-data="getPatchData()"
        @update:model-value="debouncedHandleFieldUpdate"
      />

      <!-- Панель кнопок, которая может быть фиксированной или нет в зависимости от прокрутки -->
      <div
        ref="formActionsRef"
        :class="[
          'flex justify-content-between mt-4 p-3',
          hasUnsavedChanges && !isAtBottom ? 'sticky-form-actions' : '',
        ]"
      >
        <Button
          :label="`Отменить изменения: ${modifiedFieldsCount}`"
          icon="pi pi-undo"
          class="p-button-secondary"
          :disabled="!hasUnsavedChanges"
          @click="resetChanges"
        />
        <div class="flex gap-2">
          <Button label="Отмена" icon="pi pi-times" class="p-button-text" @click="goBack" />
          <Button
            label="Сохранить"
            icon="pi pi-check"
            class="p-button-primary"
            :loading="saving"
            :disabled="!hasUnsavedChanges"
            @click="saveData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useModuleStore } from '../../stores/module-factory';
  import { useToast } from 'primevue/usetoast';
  import api from '../../api';
  import DynamicLayout from './components/DynamicLayout.vue';
  import Button from 'primevue/button';
  import ProgressSpinner from 'primevue/progressspinner';
  import Message from 'primevue/message';

  // Определяем props компонента
  const props = defineProps<{
    moduleName?: string;
    catalogName?: string;
    id?: string;
  }>();

  // Получаем параметры маршрута
  const router = useRouter();
  const route = useRoute();
  const toast = useToast();

  // Используем props с фолбэком на параметры маршрута
  const moduleName = computed(() => props.moduleName || (route.params.moduleName as string));
  const catalogName = computed(() => props.catalogName || (route.params.catalogName as string));
  const recordId = computed(() => props.id || (route.params.id as string));

  // Состояние компонента
  const loading = ref(true);
  const saving = ref(false);
  const error = ref<string | null>(null);
  const formActionsRef = ref<HTMLElement | null>(null);
  const isAtBottom = ref(false);

  const pageTitle = computed(() => {
    return `Редактирование записи: ${catalogName.value} (ID: ${recordId.value})`;
  });

  // Метаданные формы
  const storeOptions = ref<any>(null);

  // Исходная запись из GET
  const originalRecord = computed(() => {
    const moduleStore = getModuleStore();
    return (
      moduleStore.catalogsByName?.[catalogName.value]?.GET?.RESULTS?.get(String(recordId.value)) ||
      {}
    );
  });

  // PATCH данные из стора
  const patchData = computed(() => {
    try {
      const moduleStore = getModuleStore();
      return moduleStore.catalogsByName?.[catalogName.value]?.PATCH || {};
    } catch (error) {
      console.error('Ошибка при получении PATCH данных:', error);
      return {};
    }
  });

  // Получаем объединенные данные (исходные из GET + изменения)
  const mergedData = computed(() => {
    return { ...originalRecord.value, ...patchData.value };
  });

  let debounceTimer: number | null = null;

  const debounce = (fn: Function, delay: number) => {
    return function (...args: any[]) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(() => fn(...args), delay);
    };
  };

  // Функция обработки изменений полей
  const handleFieldUpdate = (updatedData: Record<string, any>) => {
    console.log('handleFieldUpdate updatedData', updatedData);
    try {
      const moduleStore = getModuleStore();
      const currentPatch = { ...(moduleStore.catalogsByName?.[catalogName.value]?.PATCH || {}) };

      // Обрабатываем каждое поле в обновленных данных
      for (const [key, value] of Object.entries(updatedData)) {
        // Сравниваем с исходным значением
        const originalValue = originalRecord.value[key];
        const valueMatches = JSON.stringify(originalValue) === JSON.stringify(value);

        if (valueMatches) {
          // Если значение совпадает с исходным, удаляем поле из PATCH
          delete currentPatch[key];
        } else {
          // Если значение отличается, добавляем в PATCH
          currentPatch[key] = value;
        }
      }

      // Обновляем PATCH в сторе
      moduleStore.catalogsByName[catalogName.value].PATCH = currentPatch;
      console.log('Обновлены PATCH данные:', currentPatch);

      // Проверяем положение прокрутки после изменения данных
      // Используем setTimeout, чтобы проверка произошла после обновления DOM
      setTimeout(() => {
        checkIfAtBottom();
      }, 0);
    } catch (error) {
      console.error('Ошибка при обработке изменений полей:', error);
    }
  };

  const debouncedHandleFieldUpdate = debounce(handleFieldUpdate, 500);

  const resetChanges = () => {
    try {
      const moduleStore = getModuleStore();
      if (moduleStore.catalogsByName?.[catalogName.value]) {
        // Очищаем PATCH в сторе
        moduleStore.catalogsByName[catalogName.value].PATCH = {};

        // Показываем сообщение об успешной отмене изменений
        toast.add({
          severity: 'info',
          summary: 'Изменения отменены',
          detail: 'Все внесенные изменения были отменены',
          life: 3000,
        });
      }
    } catch (error) {
      console.error('Ошибка при отмене изменений:', error);
    }
  };

  // Получаем данные о патче из стора
  const getPatchData = () => {
    try {
      const moduleStore = getModuleStore();
      return moduleStore.catalogsByName?.[catalogName.value]?.PATCH || {};
    } catch {
      return {};
    }
  };

  const hasUnsavedChanges = computed(() => {
    try {
      const patchData = getPatchData();

      // Если PATCH пустой или не существует, изменений нет
      const hasChanges = Object.keys(patchData).length > 0;

      return hasChanges;
    } catch {
      return false;
    }
  });

  // Подсчитываем количество измененных полей
  const modifiedFieldsCount = computed(() => {
    try {
      const patchData = getPatchData();
      return Object.keys(patchData).length;
    } catch {
      return 0;
    }
  });

  const getModuleStore = () => {
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

  // Инициализация данных из стора (данные уже загружены в роутере)
  const initializeFromStore = () => {
    loading.value = true;
    error.value = null;

    try {
      const moduleStore = getModuleStore();

      // Проверяем, загружены ли данные каталога
      if (!moduleStore.catalogsByName?.[catalogName.value]?.GET?.RESULTS) {
        throw new Error(`Данные для каталога ${catalogName.value} не загружены. Проверьте роутер.`);
      }

      const options = moduleStore.catalogsByName?.[catalogName.value]?.OPTIONS;
      if (!options || !options.layout) {
        throw new Error(`Метаданные для представления ${catalogName.value} не найдены`);
      }

      // Сохраняем метаданные для передачи в DynamicLayout
      storeOptions.value = options;

      // Получаем данные записи из GET.RESULTS для быстрого доступа по id
      const recordData = moduleStore.catalogsByName?.[catalogName.value]?.GET?.RESULTS?.get(
        String(recordId.value),
      );

      // Проверяем, найдена ли запись
      if (!recordData) {
        throw new Error(`Запись с ID ${recordId.value} не найдена в каталоге ${catalogName.value}`);
      }

      console.log('Запись из стора:', 'найдена');
      console.log('Загруженные метаданные:', storeOptions.value);
    } catch (e) {
      console.error('Ошибка инициализации данных из стора:', e);
      error.value = e instanceof Error ? e.message : 'Ошибка инициализации данных из стора';
    } finally {
      loading.value = false;
    }
  };

  // Функция JSON.parse(JSON.stringify()) не справляется с циклическими ссылками и выбрасывает ошибку
  // Наша функция cleanObject специально обрабатывает такие случаи, пропуская проблемные свойства
  // Она также более безопасна для сложных объектов, содержащих специальные типы данных
  // Теперь при сохранении данных формы не должно возникать ошибок, связанных с циклическими ссылками. Функция cleanObject создает "плоскую" копию объекта, которая безопасно сериализуется в JSON для отправки на сервер.
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
      // Получаем стор модуля
      const moduleStore = getModuleStore();
      const catalogData = moduleStore.catalogsByName?.[catalogName.value];

      // Проверяем наличие изменений в PATCH
      if (!catalogData?.PATCH || Object.keys(catalogData.PATCH).length === 0) {
        throw new Error('Нет данных для сохранения');
      }

      // Отправляем PATCH запрос для сохранения данных
      try {
        saving.value = true;

        // Формируем URL для запроса
        const url = `/catalog/api/v1/${catalogName.value}/${recordId.value}/?mode=short`;
        console.log(`Отправка PATCH запроса на: ${url}`);

        // Создаем чистый объект данных без реактивности и циклических ссылок
        const cleanData = cleanObject(catalogData.PATCH);
        console.log('Данные для отправки:', cleanData);

        // Отправляем запрос
        const response = await api.patch(url, cleanData);
        console.log('Ответ сервера:', response.data);

        // Обновляем данные в сторе
        const moduleStore = getModuleStore();
        if (moduleStore.updateRecordInStore) {
          const updated = moduleStore.updateRecordInStore(
            catalogName.value,
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

  onMounted(() => {
    console.log('Компонент смонтирован');
    // Данные уже загружены в роутере, просто инициализируем компонент
    initializeFromStore();
    // Инициализируем слушатель прокрутки
    initScrollListener();
  });

  onUnmounted(() => {
    // Удаляем слушатель прокрутки
    removeScrollListener();
    // Очищаем таймаут, если он еще активен
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
  .input-modified {
    border-color: #ffb74d !important; /* Оранжевая граница */
  }

  /* При наведении сохраняем цвет границы */
  .input-modified:hover {
    border-color: #ff9800 !important;
  }

  /* При фокусе сохраняем цвет границы, но делаем её ярче */
  .input-modified:focus {
    border-color: #ff9800 !important;
    box-shadow: 0 0 0 1px #ff9800 !important;
  }
</style>
