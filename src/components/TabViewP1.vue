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

  import type { CatalogGroup } from '../stores/types/moduleStore.type';

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
      const diffMs = now.getTime() - date.getTime();

      // Переводим в минуты, часы, дни
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Выбираем подходящий формат
      if (diffMinutes < 60) {
        return `${diffMinutes} мин. назад`;
      } else if (diffHours < 24) {
        return `${diffHours} ч. назад`;
      } else if (diffDays < 30) {
        return `${diffDays} дн. назад`;
      } else {
        // Если прошло больше 30 дней, показываем полную дату
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date);
      }
    } catch (e) {
      return dateString;
    }
  };

  // Используем конфигурацию для обработки кликов по карточкам
  const activeTabValue = ref('');

  // Следим за изменениями groupName и устанавливаем активный таб
  watch(
    () => props.groupName,
    (newGroupName) => {
      if (newGroupName && props.catalogData.length > 0) {
        const group = props.catalogData.find((group) => group.name === newGroupName);
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
    },
    { immediate: true },
  );

  // Следим за изменениями активного таба
  watch(
    () => activeTabValue.value,
    (newValue) => {
      if (!newValue || !props.catalogData) return;

      const selectedGroup = props.catalogData.find((group) => group.name === newValue);
      if (!selectedGroup) return;

      // Формируем путь для перехода
      const path = `/${props.moduleId}?group=${selectedGroup.name}`;

      try {
        // Обновляем URL без перезагрузки страницы
        window.history.pushState({}, '', path);
      } catch (err) {
        console.error('Ошибка при обновлении URL:', err);
      }
    },
  );
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
    opacity: 0.5;
  }

  .item-description {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
    opacity: 0.5;
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
