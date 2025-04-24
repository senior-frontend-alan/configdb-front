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
    <div v-else-if="error">
      <Message severity="error">{{ error }}</Message>
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
        :moduleId="moduleId"
        :groupName="queryGroupName"
        @error="handleTabViewError"
        @card-click="handleCardClick"
      />

      <!-- Отображение в виде табов -->
      <TabViewP1
        v-else
        :catalogData="filteredData"
        :moduleId="moduleId"
        :groupName="queryGroupName"
        @error="handleTabViewError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useModuleStore } from '../stores/module-factory';
  import { useSettingsStore } from '../stores/settingsStore';
  import type { CatalogGroup } from '../stores/types/moduleStore.type';

  import Card from 'primevue/card';
  import Message from 'primevue/message';
  import ProgressSpinner from 'primevue/progressspinner';
  import TabViewP1 from '../components/TabViewP1.vue';
  import ListViewP1 from '../components/ListViewP1.vue';

  const route = useRoute();
  const router = useRouter();

  const loading = ref(true);
  const error = ref<string | null>(null);
  const catalogData = ref<CatalogGroup[]>([]);
  const moduleTitle = computed(() => moduleStore?.moduleName || 'Каталог элементов');

  // Используем настройки из хранилища
  const settingsStore = useSettingsStore();
  const tabMode = computed(() => settingsStore.useTabMode); // Режим отображения из настроек
  const showDebugJson = ref(false); // Показывать ли JSON для отладки

  const moduleId = computed(() => {
    return (route.meta.moduleId as string) || '';
  });
  const moduleStore = useModuleStore(moduleId.value);

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

  // Следим за изменениями данных в сторе
  onMounted(() => {
    if (!moduleId.value || !moduleStore) {
      error.value = 'Не удалось определить модуль';
      return;
    }

    // Синхронизируем локальное состояние со стором
    catalogData.value = moduleStore.catalog;
    loading.value = moduleStore.loading;
    error.value = moduleStore.error ? String(moduleStore.error) : null;
  });

  // Следим за изменениями в сторе
  watch(
    () => moduleStore?.catalog,
    (newCatalog: CatalogGroup[]) => {
      if (newCatalog) {
        catalogData.value = newCatalog;
      }
    },
  );

  watch(
    () => moduleStore?.loading,
    (newLoading: boolean) => {
      loading.value = newLoading;
    },
  );

  watch(
    () => moduleStore?.error,
    (newError: any) => {
      error.value = newError ? String(newError) : null;
    },
  );

  // Обработчик ошибок от компонента табов
  const handleTabViewError = (message: string) => {
    error.value = message;
  };

  const handleCardClick = async (item: any) => {
    try {
      if (item && item.viewname) {
        // Формируем новый URL из модуля и viewname элемента
        const moduleId = route.meta.moduleId as string;
        const newPath = `/${moduleId}/${item.viewname}`;

        // Загрузка данных будет инициирована роутером
        console.log(`Переход по пути: ${newPath}`);
        router.push(newPath);
      }
    } catch (err) {
      console.error('Ошибка при обработке клика по карточке:', err);
      error.value = `Ошибка при переходе: ${err instanceof Error ? err.message : String(err)}`;
    }
  };
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
