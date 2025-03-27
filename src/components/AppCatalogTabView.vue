<template>
  <div class="catalog-tabs-container">
    <TabView @tab-change="handleTabChange" v-model:activeIndex="activeTabIndex">
      <TabPanel
        v-for="group in catalogData"
        :key="group.name"
        :header="group.verbose_name"
        :value="group.name"
      >
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
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useConfig } from "../config-loader";
import type { CatalogGroup } from "../stores/types/moduleStore.type";
import { useModuleStore } from "../stores/module-factory";

import Card from "primevue/card";
import Message from "primevue/message";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";

const props = defineProps<{
  catalogData: CatalogGroup[];
  moduleId: string;
  groupName?: string;
}>();

const emit = defineEmits<{
  (e: 'error', message: string): void;
}>();

const router = useRouter();
const config = useConfig();
const activeTabIndex = ref(0);

// Следим за изменениями groupName и устанавливаем активный таб
watch(() => props.groupName, (newGroupName) => {
  if (newGroupName && props.catalogData.length > 0) {
    const groupIndex = props.catalogData.findIndex(group => group.name === newGroupName);
    if (groupIndex === -1) {
      emit('error', `Группа "${newGroupName}" не найдена в модуле ${props.moduleId}`);
    } else {
      nextTick(() => {
        activeTabIndex.value = groupIndex;
      });
    }
  }
}, { immediate: true });

// Функция для обработки изменения таба
const handleTabChange = async (event: any) => {
  if (!props.catalogData || !event || event.index === undefined) return;
  
  const selectedGroup = props.catalogData[event.index];
  if (!selectedGroup) return;
  
  // Формируем путь для перехода
  const path = `/${props.moduleId}/${selectedGroup.name}`;
  
  // Предотвращаем стандартное поведение
  if (event.originalEvent) {
    event.originalEvent.preventDefault();
  }
  
  // Получаем модуль из пути
  const pathParts = path.split("/");
  
  if (pathParts.length >= 2) {
    const moduleIdFromPath = pathParts[1];
    
    // Проверяем, что модуль существует в конфигурации
    const moduleConfig = config.getModuleConfig(moduleIdFromPath);
    if (!moduleConfig) {
      console.error(`Модуль ${moduleIdFromPath} не найден в конфигурации`);
      return;
    }
    
    // Загружаем данные модуля, если необходимо
    try {
      const moduleStore = useModuleStore(moduleIdFromPath);
      if (moduleStore) {
        await moduleStore.getCatalog();
      }
    } catch (err) {
      console.error(`Ошибка при загрузке данных для модуля ${moduleIdFromPath}:`, err);
    }
  }
  
  // Навигация
  router.push(path);
};
</script>

<style scoped>
.catalog-tabs-container {
  margin-top: 1rem;
}

.catalog-items-container {
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
}

.catalog-item {
  width: 100%;
}

.group-description {
  margin-bottom: 1rem;
  color: var(--text-color-secondary);
}
</style>
