<template>
  <div class="topbar">
    <!-- Кнопка переключения темы -->
    <Button type="button" @click="toggleDarkMode" text rounded>
      <i :class="['pi', isDarkMode ? 'pi-moon' : 'pi-sun']" />
    </Button>
    <div class="relative">
      <Button
        v-styleclass="{
          selector: '@next',
          enterFromClass: 'hidden',
          enterActiveClass: 'animate-scalein',
          leaveToClass: 'hidden',
          leaveActiveClass: 'animate-fadeout',
          hideOnOutsideClick: true,
        }"
        icon="pi pi-cog"
        text
        rounded
        aria-label="Settings"
      />
      <AppConfig />
    </div>
  </div>
</template>

<script setup>
import { useLayout } from "../composables/useLayout";
import AppConfig from "./AppConfig.vue";

const { isDarkMode, toggleDarkMode } = useLayout();

// Определяем события для родительского компонента
const emit = defineEmits(["toggle-sidebar"]);

// Функция для переключения видимости бокового меню
const toggleSidebar = () => {
  emit("toggle-sidebar");
};
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

.topbar-title {
  font-size: 1.25rem;
  font-weight: 300;
  color: var(--p-surface-700);
  line-height: 1;
}

:deep(.p-dark) .topbar-title {
  color: var(--p-surface-100);
}

.topbar-subtitle {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--p-primary-500);
  line-height: 1.25;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.topbar-theme-button {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transition: all 0.2s;
  color: var(--p-surface-900);
}

:deep(.p-dark) .topbar-theme-button {
  color: var(--p-surface-0);
}

.topbar-theme-button:hover,
.topbar-menu-button:hover {
  background-color: var(--p-surface-100);
}

:deep(.p-dark) .topbar-theme-button:hover,
:deep(.p-dark) .topbar-menu-button:hover {
  background-color: var(--p-surface-800);
}

.topbar-menu-button {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transition: all 0.2s;
  color: var(--p-surface-900);
  margin-right: 0.5rem;
}

:deep(.p-dark) .topbar-menu-button {
  color: var(--p-surface-0);
}
</style>
