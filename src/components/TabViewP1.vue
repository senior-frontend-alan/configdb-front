<template>
  <div class="catalog-tabs-container">
    <Tabs :value="activeTabValue" @update:value="(val) => activeTabValue = String(val)">
      <TabList>
        <Tab 
          v-for="group in catalogData" 
          :key="group.name" 
          :value="group.name"
        >
          {{ group.verbose_name }}
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel 
          v-for="group in catalogData" 
          :key="group.name" 
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
              <Card @click="emit('card-click', item)" class="catalog-card">
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
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";

import type { CatalogGroup } from "../stores/types/moduleStore.type";

import Card from "primevue/card";
import Message from "primevue/message";
import Tabs from "primevue/tabs";
import TabList from "primevue/tablist";
import Tab from "primevue/tab";
import TabPanels from "primevue/tabpanels";
import TabPanel from "primevue/tabpanel";

const props = defineProps<{
  catalogData: CatalogGroup[];
  moduleId: string;
  groupName?: string;
}>();

const emit = defineEmits<{
  (e: 'error', message: string): void;
  (e: 'card-click', item: any): void;
}>();

// Используем конфигурацию для обработки кликов по карточкам
const activeTabValue = ref("");

// Следим за изменениями groupName и устанавливаем активный таб
watch(() => props.groupName, (newGroupName) => {
  if (newGroupName && props.catalogData.length > 0) {
    const group = props.catalogData.find(group => group.name === newGroupName);
    if (!group) {
      emit('error', `Группа "${newGroupName}" не найдена в модуле ${props.moduleId}`);
    } else {
      nextTick(() => {
        activeTabValue.value = newGroupName;
      });
    }
  } else if (props.catalogData.length > 0) {
    // Если группа не указана, выбираем первую группу
    activeTabValue.value = props.catalogData[0].name;
  }
}, { immediate: true });

// Следим за изменениями активного таба
watch(() => activeTabValue.value, (newValue) => {
  if (!newValue || !props.catalogData) return;
  
  const selectedGroup = props.catalogData.find(group => group.name === newValue);
  if (!selectedGroup) return;
  
  // Формируем путь для перехода
  const path = `/${props.moduleId}?group=${selectedGroup.name}`;
  
  try {
    // Обновляем URL без перезагрузки страницы
    window.history.pushState({}, '', path);
  } catch (err) {
    console.error('Ошибка при обновлении URL:', err);
  }
});


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

.catalog-card {
  cursor: pointer;
  transition: all 0.2s;
}

.catalog-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
