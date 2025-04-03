<template>
  <div class="catalog-accordion-container">
    <!-- Отображаем группы каталога -->
    <div
      v-for="group in catalogData"
      :key="group.name"
      class="catalog-accordion-item"
    >
      <div
        class="catalog-accordion-header"
        :class="{ clickable: !groupName }"
        @click="!groupName && navigateToGroup(group.name)"
      >
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
            <Card @click="emit('card-click', item)" class="catalog-card">
              <template #title>
                <div>
                  {{ item.verbose_name || "Без названия" }}
                  <span
                    v-if="item.model_info?.date_updated"
                    class="update-date"
                  >
                    (обновлено: {{ formatDate(item.model_info.date_updated) }})
                  </span>
                </div>
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
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import type { CatalogGroup } from "../stores/types/moduleStore.type";

import Card from "primevue/card";
import Message from "primevue/message";

const props = defineProps<{
  catalogData: CatalogGroup[];
  moduleId: string;
  groupName?: string;
}>();

const emit = defineEmits<{
  (e: "error", message: string): void;
  (e: "card-click", item: any): void;
}>();

const router = useRouter();

// Функция для перехода к группе
const navigateToGroup = (groupName: string) => {
  router.push(`/${props.moduleId}?group=${groupName}`);
};

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
      return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    }
  } catch (e) {
    return dateString;
  }
};
</script>

<style scoped>
.catalog-accordion-container {
  margin-top: 1rem;
}

.update-date {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
}

.catalog-accordion-item {
  margin-bottom: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  overflow: hidden;
}

.catalog-accordion-header {
  padding: 1rem;
  background-color: var(--surface-section);
  cursor: pointer;
}

.catalog-accordion-header h3 {
  margin: 0;
}

.catalog-accordion-content {
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 2px;
}

.catalog-items-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
