<template>
  <div class="catalog-page">
    <Card>
      <template #title>
        <!-- Переключатель режимов отображения -->
        <div class="display-mode-switch">
          <h4>{{ moduleTitle }}</h4>
          <ToggleSwitch v-model="tabMode" />
          <span style="font-size: 0.875rem; color: var(--text-color-secondary)"
            >TabView</span
          >
        </div>
      </template>
      <template #content>
        <div v-if="loading">
          <ProgressSpinner />
          <p>Загрузка данных каталога...</p>
        </div>
        <div v-else-if="error">
          <Message severity="error">{{ error }}</Message>
        </div>
        <div
          v-else-if="!filteredCatalogData || filteredCatalogData.length === 0"
        >
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
            :catalogData="filteredCatalogData"
            :moduleId="moduleId"
            :groupName="queryGroupName"
            @error="handleTabViewError"
            @card-click="handleCardClick"
          />

          <!-- Отображение в виде табов -->
          <TabViewP1
            v-else
            :catalogData="filteredCatalogData"
            :moduleId="moduleId"
            :groupName="queryGroupName"
            @error="handleTabViewError"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useModuleStore } from "../stores/module-factory";
import type { CatalogGroup } from "../stores/types/moduleStore.type";

import Card from "primevue/card";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";
import ToggleSwitch from "primevue/toggleswitch";
import TabViewP1 from "../components/TabViewP1.vue";
import ListViewP1 from "../components/ListViewP1.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref<string | null>(null);
const catalogData = ref<CatalogGroup[]>([]);
const moduleTitle = computed(
  () => moduleStore?.moduleName || "Каталог элементов"
);

const tabMode = ref(false); // Переменные для переключения режимов отображения
const showDebugJson = ref(false); // Показывать ли JSON для отладки

const moduleId = computed(() => {
  return (route.meta.moduleId as string) || "";
});
const moduleStore = useModuleStore(moduleId.value);

const queryGroupName = computed(() => (route.query.group as string) || "");

// Фильтруем данные каталога по query-параметру group
const filteredCatalogData = computed(() => {
  if (!catalogData.value || catalogData.value.length === 0) {
    return [];
  }

  // Если указана группа в query-параметрах, фильтруем по ней
  if (queryGroupName.value) {
    return catalogData.value.filter(
      (group) => group.name === queryGroupName.value
    );
  }

  // Иначе возвращаем все данные
  return catalogData.value;
});

// Загрузка данных каталога
onMounted(async () => {
  try {
    loading.value = true;
    error.value = null;

    if (!moduleId.value || !moduleStore) {
      error.value = "Не удалось определить модуль";
      return;
    }

    // Загружаем данные каталога
    const data = await moduleStore.getCatalog();
    catalogData.value = data;
  } catch (err) {
    error.value = `Ошибка при загрузке данных: ${
      err instanceof Error ? err.message : String(err)
    }`;
  } finally {
    loading.value = false;
  }
});

// Обработчик ошибок от компонента табов
const handleTabViewError = (message: string) => {
  error.value = message;
};

const handleCardClick = (item: any) => {
  try {
    if (item && item.href) {
      // Перенаправление по ссылке из item.href
      router.push(item.href);
    } else {
      console.warn("Ссылка (href) не указана для элемента:", item);
      error.value = "Не удалось перейти по ссылке: ссылка не указана";
    }
  } catch (err) {
    console.error("Ошибка при обработке клика по карточке:", err);
    error.value = `Ошибка при переходе по ссылке: ${
      err instanceof Error ? err.message : String(err)
    }`;
  }
};
</script>

<style scoped>
.catalog-page {
  padding: 1rem;
}

/* Стили для переключателя режимов */
.display-mode-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: var(--surface-section);
  border-radius: 6px;
  width: fit-content;
}

/* Стили для аккордеона */
.catalog-accordion-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
