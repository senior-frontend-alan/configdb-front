<template>
  <div class="side-menu" v-show="visible">
    <div class="side-menu-content">
      <ul class="menu-list" v-if="!settingsStore.isLoading">
        <template v-for="item in settingsStore.menuItems" :key="item.id">
          <!-- Основной пункт меню -->
          <li class="menu-item" :class="{ active: item.active }">
            <!-- Все пункты меню как router-link -->
            <router-link :to="item.path" class="menu-item-content">
              <i :class="item.icon" v-if="item.icon"></i>
              <span>{{ item.name }}</span>
            </router-link>
          </li>

          <!-- Подменю, если есть (всегда видимое) -->
          <li v-if="item.children">
            <ul class="submenu">
              <li
                v-for="child in item.children"
                :key="child.id"
                class="submenu-item"
                :class="{ active: child.active }"
              >
                <router-link :to="child.path" class="submenu-item-content">
                  <span>{{ child.name }}</span>
                </router-link>
              </li>
            </ul>
          </li>
        </template>
      </ul>

      <!-- Индикатор загрузки -->
      <div v-else class="loading-menu">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <p>Загрузка меню...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from "vue";
import { useSettingsStore } from "../stores/userSettingsStore";
import { useRoute } from "vue-router";

// Определяем пропсы компонента
defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
});

const settingsStore = useSettingsStore();
const route = useRoute();

// Загружаем данные меню при монтировании компонента
onMounted(async () => {
  await settingsStore.fetchMenuItems();

  // Устанавливаем активный пункт меню на основе текущего маршрута
  settingsStore.setActiveMenuItem(route.path);
});

// Обновляем активный пункт меню при изменении маршрута
watch(
  () => route.path,
  (newPath) => {
    settingsStore.setActiveMenuItem(newPath);
  }
);
</script>

<style scoped>
.side-menu {
  width: 250px;
  height: 100%;
  background-color: white;
  border-right: 1px solid #e9ecef;
  overflow-y: auto;
  position: fixed;
  top: 48px; /* Высота AppMenubar */
  left: 0;
  z-index: 900; /* Меньше, чем у AppMenubar */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.side-menu-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 48px; /* Добавляем отступ снизу для прокрутки */
}

.menu-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  display: flex;
  flex-direction: column;
  color: #495057;
  font-weight: 500;
  position: relative;
}

.menu-item-content {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  width: 100%;
}

.menu-item i {
  margin-right: 0.75rem;
  font-size: 1rem;
}

.menu-item-content:hover {
  background-color: #e9ecef;
}

.menu-item.active .menu-item-content {
  background-color: #e6f7ff;
  color: var(--primary-color);
  font-weight: 600;
}

.menu-item.active i {
  color: var(--primary-color);
}

.submenu-icon {
  margin-left: auto;
  font-size: 0.875rem;
}

.submenu {
  background-color: #f1f3f5;
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.submenu-item {
  display: flex;
  flex-direction: column;
  color: #495057;
}

.submenu-item-content {
  padding: 0.5rem 1rem 0.5rem 2.75rem;
  cursor: pointer;
  width: 100%;
}

.submenu-item-content:hover {
  background-color: #e9ecef;
}

.submenu-item.active {
  color: var(--primary-color);
  font-weight: 500;
}

.loading-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
}
</style>
