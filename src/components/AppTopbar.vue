<template>
  <div class="topbar">
    <!-- Кнопка пользователя -->
    <Button
      :label="username"
      icon="pi pi-user"
      link
      @click="(event) => menu.toggle(event)"
    />

    <!-- Меню пользователя -->
    <Menu id="user-menu" ref="menu" :model="userMenuItems" :popup="true" />
    <!-- Кнопка переключения темы -->
    <Button type="button" @click="toggleDarkMode" text rounded>
      <i :class="['pi', isDarkMode ? 'pi-moon' : 'pi-sun']" />
    </Button>
    <div class="relative">
      <Button link icon="pi pi-cog" aria-label="Настройки" />
      <AppConfig />
    </div>
  </div>
</template>

<script setup>
import { useLayout } from "../composables/useLayout";
import AppConfig from "./AppConfig.vue";
import Menu from "primevue/menu";
import { ref, computed } from "vue";
import { useAuthStore } from "../stores/authStore";

const { isDarkMode, toggleDarkMode } = useLayout();

// Определяем события для родительского компонента
const emit = defineEmits(["toggle-sidebar"]);

// Функция для переключения видимости бокового меню
const toggleSidebar = () => {
  emit("toggle-sidebar");
};

// Ссылка на меню пользователя
const menu = ref(null);

// Получаем хранилище аутентификации
const authStore = useAuthStore();

// Получаем имя пользователя из хранилища аутентификации
const username = computed(() => {
  if (authStore.session && authStore.session.user) {
    return authStore.session.user.username;
  }
  return "username";
});

// Пункты меню пользователя
const userMenuItems = ref([
  {
    label: "Профиль",
    icon: "pi pi-user",
    command: () => {
      // Логика перехода на страницу профиля
      console.log("Переход на страницу профиля");
    },
  },
  {
    label: "Настройки",
    icon: "pi pi-cog",
    command: () => {
      // Логика перехода на страницу настроек
      console.log("Переход на страницу настроек");
    },
  },
  {
    separator: true,
  },
  {
    label: "Выход",
    icon: "pi pi-sign-out",
    command: () => {
      // Логика выхода из системы
      authStore.logout();
      console.log("Выход из системы");
    },
  },
]);
</script>

<style scoped>
.topbar {
  background-color: var(--p-surface-0);
  padding: 0.75rem;
  border-radius: 0.5rem;
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  border: 1px solid var(--p-surface-200);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  justify-content: space-between;
}

:deep(.p-dark) .topbar {
  background-color: var(--p-surface-900);
  border-color: var(--p-surface-700);
}

@media (min-width: 640px) {
  .topbar-brand-text {
    display: flex;
    flex-direction: column;
  }
}
</style>
