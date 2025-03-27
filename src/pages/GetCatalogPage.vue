<template>
  <div class="catalog-page">
    <Card>
      <template #title>
        <!-- Переключатель режимов отображения -->
        <div class="display-mode-switch">
          <h4>{{ moduleTitle }}</h4>
          <InputSwitch v-model="tabMode" />
          <span style="font-size: 0.875rem; color: var(--text-color-secondary);">TabView</span>
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
        <div v-else-if="!catalogData || catalogData.length === 0">
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

          <!-- Отображение в виде аккордеона -->
          <div v-if="!tabMode" class="catalog-accordion-container">
            <div
              v-for="group in catalogData"
              :key="group.name"
              class="catalog-accordion-item"
            >
              <div class="catalog-accordion-header">
                <h3>{{ group.verbose_name }}</h3>
              </div>
              <div class="catalog-accordion-content">
                <div v-if="group.description" class="group-description">
                  <p>{{ group.description }}</p>
                </div>

                <!-- Отображаем элементы каталога в группе -->
                <div
                  v-if="group.items && group.items.length > 0"
                  class="catalog-items-container"
                >
                  <div
                    v-for="item in group.items"
                    :key="item.name"
                    class="catalog-item"
                  >
                    <Card>
                      <template #title>
                        <div>{{ item.verbose_name || "Без названия" }}</div>
                      </template>
                      <template #subtitle>
                        <div v-if="item.description">
                          {{ item.description }}
                        </div>
                      </template>
                    </Card>
                  </div>
                </div>
                <div v-else>
                  <Message severity="info">В этой группе нет элементов</Message>
                </div>
              </div>
            </div>
          </div>

          <!-- Отображение в виде табов -->
          <AppCatalogTabView 
            v-else
            :catalogData="catalogData" 
            :moduleId="moduleId" 
            :groupName="groupName"
            @error="handleTabViewError"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useModuleStore } from "../stores/module-factory";
import type { CatalogGroup } from "../stores/types/moduleStore.type";

import Card from "primevue/card";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";
import InputSwitch from "primevue/inputswitch";
import AppCatalogTabView from "../components/AppCatalogTabView.vue";

const route = useRoute();

const loading = ref(true);
const error = ref<string | null>(null);
const catalogData = ref<CatalogGroup[]>([]);
const moduleTitle = ref("Каталог элементов");


// Переменные для переключения режимов отображения
const tabMode = ref(false); // Режим отображения: false - аккордеон, true - табы
const showDebugJson = ref(false); // Показывать ли JSON для отладки

// Загружаем название модуля из стора
// Вычисляемые свойства для получения данных из URL
const moduleId = computed(() => {
  // Получаем ID модуля из первого сегмента URL
  const pathSegments = route.path.split("/");
  return pathSegments[1] || "";
});

const groupName = computed(() => (route.params.groupName as string) || "");

// Функция для получения стора модуля
const getModuleStore = (id: string) => {
  if (!id) return null;
  return useModuleStore(id);
};

// Загрузка названия модуля из стора
const loadModuleTitle = () => {
  const store = getModuleStore(moduleId.value);
  if (store?.moduleName) {
    moduleTitle.value = store.moduleName;
  }
};

// Загрузка данных каталога
const loadCatalogData = async () => {
  if (!moduleId.value) {
    error.value = "Не удалось определить модуль из URL";
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const moduleStore = getModuleStore(moduleId.value);
    if (!moduleStore) {
      throw new Error(`Модуль с ID ${moduleId.value} не найден`);
    }

    // Загружаем данные и название модуля
    const data = await moduleStore.getCatalog();
    loadModuleTitle();

    // Сохраняем все данные каталога
    catalogData.value = data;
    
    // Если указана группа и она не найдена, устанавливаем ошибку
    if (groupName.value) {
      const groupExists = data.some((group: CatalogGroup) => group.name === groupName.value);
      if (!groupExists) {
        error.value = `Группа "${groupName.value}" не найдена в модуле ${moduleId.value}`;
      }
    }
  } catch (err) {
    error.value = `Ошибка при загрузке данных каталога: ${
      err instanceof Error ? err.message : String(err)
    }`;
  } finally {
    loading.value = false;
  }
};

// Инициализация и обработка изменений маршрута
onMounted(loadCatalogData);

// Отслеживаем изменения маршрута
watch([() => route.path, () => route.params], loadCatalogData, { deep: true });

// Обработчик ошибок от компонента табов
const handleTabViewError = (message: string) => {
  error.value = message;
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
</style>
