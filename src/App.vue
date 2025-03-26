<script setup>
// Основной компонент приложения
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "./stores/authStore";
import AppTopbar from "./components/AppTopbar.vue";
import AppSideMenu from "./components/AppSideMenu.vue";

const route = useRoute();
const authStore = useAuthStore();

// Проверяем, должна ли отображаться страница входа (если путь '/login' или пользователь не авторизован)
const isLoginPage = computed(
  () => route.path === "/login" || !authStore.isAuthenticated
);

// Проверяем, авторизован ли пользователь
const isAuthenticated = computed(() => authStore.isAuthenticated);

// Состояние бокового меню (открыто/закрыто)
const sidebarVisible = ref(true);

// Переключение видимости бокового меню
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

// Флаг для отображения бокового меню
const showSideMenu = computed(
  () => !isLoginPage.value && isAuthenticated.value
);
</script>

<template>
  <router-view v-if="isLoginPage" />

  <div
    v-else
    class="layout-container layout-light layout-colorscheme-menu layout-static"
    :class="{ 'layout-sidebar-active': sidebarVisible }"
  >
    <!-- Боковое меню -->
    <div class="layout-sidebar">
      <AppSideMenu v-if="showSideMenu" :visible="true" />
    </div>

    <div class="layout-content-wrapper">
      <div class="layout-topbar">
        <AppTopbar @toggle-sidebar="toggleSidebar" />
      </div>

      <nav class="layout-breadcrumb content-breadcrumb">
        <!-- Здесь будут хлебные крошки -->
      </nav>

      <div class="layout-content">
        <router-view />
      </div>
    </div>

    <!-- Маска для мобильных устройств -->
    <div class="layout-mask" @click="sidebarVisible = false"></div>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  position: relative;
}

.layout-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 18rem;
  height: 100%;
  z-index: 999;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  background-color: var(--p-surface-0);
}

.layout-content-wrapper {
  margin-left: 18rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s;
}

.layout-topbar {
  position: sticky;
  top: 0;
  z-index: 998;
  height: 4rem;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  background-color: var(--p-surface-0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.layout-breadcrumb {
  padding: 0.5rem 1.5rem;
  background-color: var(--p-surface-50);
  border-bottom: 1px solid var(--p-surface-200);
}

.layout-content {
  flex: 1;
  padding: 1.5rem;
  background-color: var(--p-surface-50);
}

.layout-mask {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 998;
}

/* Мобильная версия */
@media screen and (max-width: 991px) {
  .layout-sidebar {
    transform: translateX(-100%);
  }

  .layout-content-wrapper {
    margin-left: 0;
  }

  .layout-sidebar-active .layout-sidebar {
    transform: translateX(0);
  }

  .layout-sidebar-active .layout-mask {
    display: block;
  }
}

/* Темная тема */
:deep(.p-dark) .layout-sidebar,
:deep(.p-dark) .layout-topbar {
  background-color: var(--p-surface-900);
}

:deep(.p-dark) .layout-breadcrumb {
  background-color: var(--p-surface-800);
  border-color: var(--p-surface-700);
}

:deep(.p-dark) .layout-content {
  background-color: var(--p-surface-800);
}
</style>
