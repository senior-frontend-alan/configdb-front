<template>
  <div class="topbar">
    <div class="topbar-container">
      <div class="topbar-brand">
        <svg
          width="35"
          height="40"
          viewBox="0 0 35 40"
          fill="none"
          class="w-8"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M25.87 18.05L23.16 17.45L25.27 20.46V29.78L32.49 23.76V13.53L29.18 14.73L25.87 18.04V18.05ZM25.27 35.49L29.18 31.58V27.67L25.27 30.98V35.49ZM20.16 17.14H20.03H20.17H20.16ZM30.1 5.19L34.89 4.81L33.08 12.33L24.1 15.67L30.08 5.2L30.1 5.19ZM5.72 14.74L2.41 13.54V23.77L9.63 29.79V20.47L11.74 17.46L9.03 18.06L5.72 14.75V14.74ZM9.63 30.98L5.72 27.67V31.58L9.63 35.49V30.98ZM4.8 5.2L10.78 15.67L1.81 12.33L0 4.81L4.79 5.19L4.8 5.2ZM24.37 21.05V34.59L22.56 37.29L20.46 39.4H14.44L12.34 37.29L10.53 34.59V21.05L12.42 18.23L17.45 26.8L22.48 18.23L24.37 21.05ZM22.85 0L22.57 0.69L17.45 13.08L12.33 0.69L12.05 0H22.85Z"
            class="fill-primary"
          />
          <path
            d="M30.69 4.21L24.37 4.81L22.57 0.69L22.86 0H26.48L30.69 4.21ZM23.75 5.67L22.66 3.08L18.05 14.24V17.14H19.7H20.03H20.16H20.2L24.1 15.7L30.11 5.19L23.75 5.67ZM4.21002 4.21L10.53 4.81L12.33 0.69L12.05 0H8.43002L4.22002 4.21H4.21002ZM21.9 17.4L20.6 18.2H14.3L13 17.4L12.4 18.2L12.42 18.23L17.45 26.8L22.48 18.23L22.5 18.2L21.9 17.4ZM4.79002 5.19L10.8 15.7L14.7 17.14H14.74H15.2H16.85V14.24L12.24 3.09L11.15 5.68L4.79002 5.2V5.19Z"
            class="fill-surface"
          />
        </svg>
        <span class="topbar-brand-text">
          <span class="topbar-title">PrimeVue Examples</span>
          <span class="topbar-subtitle">Vite TypeScript</span>
        </span>
      </div>
      <div class="topbar-actions">
        <!-- Кнопка переключения бокового меню -->
        <Button
          type="button"
          class="topbar-menu-button"
          @click="toggleSidebar"
          text
          rounded
        >
          <i class="pi pi-bars" />
        </Button>
        <!-- Кнопка переключения темы -->
        <Button
          type="button"
          class="topbar-theme-button"
          @click="toggleDarkMode"
          text
          rounded
        >
          <i
            :class="[
              'pi ',
              'pi ',
              { 'pi-moon': isDarkMode, 'pi-sun': !isDarkMode },
            ]"
          />
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
  padding: 1.5rem;
  border-radius: 1rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  border: 1px solid var(--p-surface-200);
  width: 100%;
}

:deep(.p-dark) .topbar {
  background-color: var(--p-surface-900);
  border-color: var(--p-surface-700);
}

.topbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.topbar-brand {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.topbar-brand-text {
  display: none;
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
