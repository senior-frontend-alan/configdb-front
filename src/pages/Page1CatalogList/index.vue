<template>
  <div class="catalog-page">
    <div class="title-container">
      <h2>{{ moduleTitle }}</h2>
      <!-- Панель инструментов с поиском -->
      <ToolBar :initialQuery="searchQuery" />
    </div>
    <div v-if="loading">
      <ProgressSpinner />
      <p>Загрузка данных каталога...</p>
    </div>
    <div v-if="displayError" class="error-message">
      <Message severity="error" :closable="false">{{ displayError }}</Message>
    </div>
    <div v-else-if="!filteredData || filteredData.length === 0">
      <Message severity="info">Данные каталога отсутствуют</Message>
    </div>
    <div v-else class="catalog-container">
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
        >{{ JSON.stringify(catalogData, null, 2) }}</pre
      >

      <!-- Отображение в виде списка -->
      <ListViewP1
        v-if="!tabMode"
        :catalogData="filteredData"
        :moduleName="moduleName"
        :groupName="queryGroupName"
        @error="handleTabViewError"
        @card-click="handleCardClick"
      />

      <!-- Отображение в виде табов -->
      <P1_TabView
        v-else
        :catalogData="filteredData"
        :moduleName="moduleName"
        :groupName="queryGroupName"
        @error="handleTabViewError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useModuleStore } from '../../stores/module-factory';
  import { useSettingsStore } from '../../stores/settingsStore';
  import { getOrFetchModuleCatalogs } from '../../stores/data-loaders';
  import Message from 'primevue/message';
  import ProgressSpinner from 'primevue/progressspinner';
  import P1_TabView from './components/P1_TabView.vue';
  import ListViewP1 from './components/P1_ListView.vue';

  const route = useRoute();
  const router = useRouter();

  // Используем реактивные ссылки на данные из стора
  // computed кэширует результат и пересчитывает его только при изменении зависимостей
  const loading = computed(() => moduleStore.value?.loading ?? true);
  const error = computed(() => (moduleStore.value?.error ? String(moduleStore.value.error) : null));
  const catalogData = computed(() => moduleStore.value?.catalogGroups ?? []);
  const moduleTitle = computed(() => moduleStore.value?.moduleName || 'Каталог элементов');

  // Используем настройки из хранилища
  const settingsStore = useSettingsStore();
  const tabMode = computed(() => settingsStore.useTabMode); // Режим отображения из настроек
  const showDebugJson = ref(false); // Показывать ли JSON для отладки

  // Получаем moduleName из props или из параметров маршрута
  const props = defineProps<{
    moduleName?: string;
  }>();

  const moduleName = computed(() => {
    return props.moduleName || (route.params.moduleName as string) || '';
  });

  // Получаем стор модуля только если moduleName не пустой
  const moduleStore = computed(() => {
    if (moduleName.value) {
      return useModuleStore(moduleName.value);
    }
    return null;
  });

  const queryGroupName = computed(() => (route.query.group as string) || '');
  const searchQuery = computed(() => (route.query.search as string) || '');

  // Фильтрация данных каталога с учетом всех фильтров
  const filteredData = computed(() => {
    if (!catalogData.value || catalogData.value.length === 0) {
      return [];
    }

    let data = [...catalogData.value];

    // Фильтрация по группе (group)
    if (queryGroupName.value) {
      data = data.filter((group) => group.name === queryGroupName.value);
    }

    // Фильтрация по поиску (search) по всем группам, которые остались в data после предыдущей фильтрации
    if (searchQuery.value && searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim();

      data = data
        .map((group) => {
          const newGroup = { ...group };

          if (newGroup.items && newGroup.items.length > 0) {
            newGroup.items = newGroup.items.filter((item) => {
              // Ищем в названии и описании
              return (
                (item.verbose_name && item.verbose_name.toLowerCase().includes(query)) ||
                (item.description && item.description.toLowerCase().includes(query)) ||
                (item.name && item.name.toLowerCase().includes(query))
              );
            });
          }

          return newGroup;
        })
        .filter((group) => group.items && group.items.length > 0); // Оставляем только группы с элементами
    }

    return data;
  });

  // Фильтрация данных уже выполнена в filteredData

  // Проверка наличия moduleName
  const moduleNameError = computed(() => {
    if (!moduleName.value) {
      return 'Не удалось определить модуль';
    }
    return null;
  });

  // Итоговая ошибка - либо ошибка moduleName, либо ошибка из стора, либо ошибка от компонента табов
  const displayError = computed(() => moduleNameError.value || error.value || tabViewError.value);

  // Наблюдатели больше не нужны, так как мы используем вычисляемые свойства,
  // которые автоматически обновляются при изменении данных в сторе

  // Создаем отдельный ref для ошибок от компонента табов
  const tabViewError = ref<string | null>(null);

  // Обработчик ошибок от компонента табов
  const handleTabViewError = (message: string) => {
    tabViewError.value = message;
  };

  const handleCardClick = async (item: any) => {
    try {
      if (item && item.appl_name && item.viewname) {
        const moduleName = route.params.moduleName as string;

        // Формируем новый URL для перехода к деталям элемента
        const newPath = `/${moduleName}/${item.appl_name}/${item.viewname.toLowerCase()}`;

        // Загрузка данных будет инициирована роутером через хук beforeResolve
        console.log(`Переход по пути: ${newPath}`);
        router.push(newPath);
      }
    } catch (err) {
      console.error('Ошибка при обработке клика по карточке:', err);
      error.value = `Ошибка при переходе: ${err instanceof Error ? err.message : String(err)}`;
    }
  };

  onMounted(async () => {
    if (moduleName.value) {
      const result = await getOrFetchModuleCatalogs(moduleName.value);
      if (!result.success && result.error) {
        console.error(`Ошибка при загрузке каталогов: ${result.error.message}`);
      }
    }
  });
</script>

<style scoped>
  .catalog-page {
    padding: 0 1rem;
  }

  .title-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Стили для аккордеона */
  .catalog-accordion-container {
    display: flex;
    flex-direction: column;
  }

  .catalog-accordion-item {
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    overflow: hidden;
  }

  .catalog-accordion-header {
    background-color: var(--surface-section);
    padding-left: 1rem;
    cursor: pointer;
  }

  .catalog-accordion-content {
    padding-left: 1rem;
  }

  /* Стили для табов */
  .catalog-tabs-container {
    margin-top: 1rem;
  }

  /* Общие стили для элементов каталога */
  .catalog-items-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }

  .group-description {
    margin-bottom: 1rem;
    color: var(--text-color-secondary);
  }

  .catalog-item {
    width: 100%;
  }

  .catalog-card {
    cursor: pointer;
    transition: all 0.2s;
  }

  .catalog-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
</style>
