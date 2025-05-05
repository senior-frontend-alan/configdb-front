<template>
  <div class="catalog-tabs-container">
    <Tabs :value="activeTabValue" @update:value="(val) => (activeTabValue = String(val))">
      <TabList>
        <Tab v-for="group in catalogData" :key="group.name" :value="group.name">
          {{ group.verbose_name }}
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel v-for="group in catalogData" :key="group.name" :value="group.name">
          <div v-if="group.description" class="group-description">
            <p>{{ group.description }}</p>
          </div>

          <!-- Отображаем элементы каталога в группе -->
          <div v-if="group.items && group.items.length > 0" class="catalog-items-container">
            <div
              v-for="(item, index) in group.items"
              @click="emit('card-click', item)"
              :key="item.name"
              class="catalog-item"
            >
              <h3>
                {{ item.verbose_name || 'Без названия' }}
                <span v-if="item.model_info?.date_updated" class="update-date">
                  (обновлено: {{ formatDate(item.model_info.date_updated) }})
                </span>
              </h3>
              <div v-if="item.description" class="item-description">
                {{ item.description }}
              </div>
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
  import { ref, watch, nextTick } from 'vue';

  import type { CatalogGroup } from '../../../stores/types/moduleStore.type';

  import Message from 'primevue/message';
  import Tabs from 'primevue/tabs';
  import TabList from 'primevue/tablist';
  import Tab from 'primevue/tab';
  import TabPanels from 'primevue/tabpanels';
  import TabPanel from 'primevue/tabpanel';

  const props = defineProps<{
    catalogData: CatalogGroup[];
    moduleId: string;
    groupName?: string;
  }>();

  const emit = defineEmits<{
    (e: 'error', message: string): void;
    (e: 'card-click', item: any): void;
  }>();

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();

      // Если дата сегодняшняя, показываем только время
      if (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      ) {
        return `сегодня в ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      // Если дата вчерашняя, показываем "вчера"
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
      ) {
        return `вчера в ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      // В остальных случаях показываем полную дату
      return `${date.getDate()}.${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}.${date.getFullYear()} ${date.getHours()}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
    } catch (e) {
      console.error('Ошибка форматирования даты:', e);
      return dateString;
    }
  };

  // Активная вкладка
  const activeTabValue = ref(props.groupName || '');

  // Следим за изменением groupName в пропсах
  watch(
    () => props.groupName,
    (newGroupName) => {
      if (newGroupName) {
        activeTabValue.value = newGroupName;
      }
    },
  );

  // Следим за изменением активной вкладки
  watch(activeTabValue, async (newActiveTab) => {
    // Если данные каталога еще не загружены, выходим
    if (!props.catalogData || props.catalogData.length === 0) {
      return;
    }

    // Проверяем, существует ли группа с таким именем
    const groupExists = props.catalogData.some((group) => group.name === newActiveTab);
    if (!groupExists) {
      // Если группа не существует, устанавливаем первую доступную группу
      nextTick(() => {
        activeTabValue.value = props.catalogData[0]?.name || '';
      });
    }
  });
</script>

<style scoped>
  :deep(.p-tablist-tab-list) {
    background: transparent;
  }

  .p-tabpanels {
    padding-top: 0;
    background-color: transparent;
  }
  .update-date {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
  }

  .item-description {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
  }

  .catalog-items-container {
    display: flex;
    flex-direction: column;
    margin-top: 1rem;
  }

  .catalog-item {
    padding: 0.5rem;
    width: 100%;
    border-bottom: 1px solid var(--p-surface-200);
    cursor: pointer;
    transition: all 0.2s;
  }

  .group-description {
    margin-bottom: 1rem;
    color: var(--text-color-secondary);
  }

  .catalog-item:hover {
    background-color: var(--p-surface-100);
  }
</style>
