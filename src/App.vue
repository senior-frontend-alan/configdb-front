<script setup>
  // Основной компонент приложения
  import { computed, ref, onMounted, onUnmounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from './stores/authStore';
  import AppTopbar from './components/AppTopbar.vue';
  import SideMenu from './components/SideMenu.vue';
  import AppBreadcrumb from './components/AppBreadcrumb.vue';
  import AppProgressBar from './components/AppProgressBar.vue';
  import Button from 'primevue/button';
  import Toast from 'primevue/toast';

  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();

  // Проверяем, должна ли отображаться страница входа (если путь '/login' или пользователь не авторизован)
  const isLoginPage = computed(() => route.path === '/login' || !authStore.isAuthenticated);

  // Проверяем, авторизован ли пользователь
  const isAuthenticated = computed(() => authStore.isAuthenticated);

  // Логика управления боковым меню
  const sidebarVisible = ref(true); // Состояние бокового меню (открыто/закрыто)

  // Проверяем, должно ли отображаться боковое меню
  const showSideMenu = computed(() => !isLoginPage.value && isAuthenticated.value);

  // Переключение видимости бокового меню
  const toggleSidebar = () => {
    sidebarVisible.value = !sidebarVisible.value;
  };

  const isTopbarSticky = ref(false);

  // Функция для обработки прокрутки
  const handleScroll = () => {
    // Если прокрутка больше 50px, делаем панель sticky
    isTopbarSticky.value = window.scrollY > 50;
  };

  // Добавляем слушатель события прокрутки при монтировании компонента
  onMounted(() => {
    window.addEventListener('scroll', handleScroll);
  });

  // Удаляем слушатель при размонтировании компонента
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });
</script>

<template>
  <router-view v-if="isLoginPage" />

  <div
    v-else
    class="layout-container layout-light layout-colorscheme-menu layout-static"
    :class="{ 'layout-sidebar-active': sidebarVisible }"
  >
    <!-- Кнопка переключения бокового меню -->
    <div class="sidebar-toggle-button">
      <Button type="button" @click="toggleSidebar" text rounded class="toggle-button">
        <i class="pi pi-bars" />
      </Button>
    </div>

    <!-- Боковое меню -->
    <div class="layout-sidebar">
      <SideMenu v-if="showSideMenu" :visible="true" @toggle-sidebar="toggleSidebar" />
    </div>

    <div class="layout-content-wrapper">
      <div class="sticky">
        <AppProgressBar />
      </div>

      <AppBreadcrumb class="layout-breadcrumb breadcrumb-with-margin" />
      <div class="layout-topbar" :class="{ sticky: isTopbarSticky }">
        <AppTopbar />
      </div>

      <div class="layout-content">
        <!-- :key="route.fullPath" - Это важно! 
         Оно заставляет Vue полностью пересоздавать компонент при изменении маршрута. 
         Когда мы переходим между разными модулями (например, с /catalog на /ocsmanage), 
         Vue будет полностью уничтожать старый компонент и создавать новый, вместо того чтобы 
         пытаться переиспользовать существующий иначе загружаются данные из предыдущего стора -->
        <!-- Используем keep-alive для сохранения состояния компонентов каталога -->
        <!-- Для компонентов в keep-alive не используем key, чтобы сохранить состояние -->
        <router-view v-slot="{ Component, route }">
          <keep-alive :include="['Page2CatalogDetails']" :max="10">
            <component
              :is="Component"
              :key="['Page2CatalogDetails'].includes(Component?.name) ? undefined : route.fullPath"
            />
          </keep-alive>
        </router-view>
      </div>
    </div>

    <!-- Компонент Toast для уведомлений -->
    <Toast />

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

  /* Скрытие бокового меню при неактивном состоянии */
  .layout-container:not(.layout-sidebar-active) .layout-sidebar {
    transform: translateX(-100%);
  }

  /* Кнопка переключения бокового меню */
  .sidebar-toggle-button {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 1000;
    background-color: var(--p-surface-0);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: left 0.3s;
  }

  .toggle-button {
    width: 100%;
    height: 100%;
    border-radius: 50% !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Позиционирование кнопки при активном меню */
  .layout-container.layout-sidebar-active .sidebar-toggle-button {
    left: 19rem;
  }

  .layout-content-wrapper {
    margin-left: 18rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    transition: margin-left 0.3s;
  }

  .breadcrumb-with-margin {
    margin-left: 2rem;
  }

  /* Корректировка отступа при скрытом меню */
  .layout-container:not(.layout-sidebar-active) .layout-content-wrapper {
    margin-left: 0;
  }

  .layout-topbar {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 998;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 1.5rem;
    height: 50px;
    transition: all 0.3s ease;
  }

  .sticky {
    position: fixed;
    width: 100%;
  }

  .layout-content {
    flex: 1;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
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
