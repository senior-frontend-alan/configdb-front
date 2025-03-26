<template>
  <div class="catalog-page">
    <Card>
      <template #title>
        <h4>{{ moduleTitle }}</h4>
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
          <!-- Отображаем группы каталога -->
          <pre
            style="
              background-color: #f5f5f5;
              padding: 10px;
              border-radius: 5px;
              overflow: auto;
              max-height: 300px;
            "
            >{{ JSON.stringify(catalogData, null, 2) }}</pre
          >
          <div class="catalog-accordion-container">
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
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useModuleStore } from "../stores/module-factory";
import type { CatalogGroup } from "../stores/types/moduleStore.type";

import Card from "primevue/card";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";

const route = useRoute();
const loading = ref(true);
const error = ref<string | null>(null);
const catalogData = ref<CatalogGroup[]>([]);
const moduleTitle = ref("Каталог элементов");

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

    // Фильтруем данные по группе, если она указана
    catalogData.value = groupName.value
      ? data.filter((group: CatalogGroup) => group.name === groupName.value)
      : data;

    // Проверяем наличие данных после фильтрации
    if (groupName.value && catalogData.value.length === 0) {
      error.value = `Группа "${groupName.value}" не найдена в модуле ${moduleId.value}`;
    }
  } catch (err) {
    error.value = `Ошибка при загрузке данных каталога: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    loading.value = false;
  }
};

// Инициализация и обработка изменений маршрута
onMounted(loadCatalogData);

// Отслеживаем изменения маршрута
watch([() => route.path, () => route.params], loadCatalogData, { deep: true });
</script>

<style></style>
