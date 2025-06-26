<template>
  <div class="topbar">
    <!-- Компонент меню пользователя -->
    <UserMenu />
    <!-- Не удалять! Кнопка переключения темы -->
    <!-- <Button
      type="button"
      @click="toggleDarkMode"
      text
      rounded
      :aria-label="$t('settings.darkMode')"
    >
      <i :class="['pi', isDarkMode ? 'pi-moon' : 'pi-sun']" />
    </Button> -->
    <div class="relative">
      <Button link icon="pi pi-cog" :aria-label="$t('common.settings')" />
      <AppConfig />
    </div>

    <!-- Не удалять! Компонент выбора языка -->
    <!-- <LanguageSelector /> -->
  </div>
</template>

<script setup>
  import { useLayout } from '../composables/useLayout';
  import AppConfig from './AppConfig.vue';
  import { useI18n } from 'vue-i18n';
  import LanguageSelector from './LanguageSelector.vue';
  import UserMenu from './UserMenu.vue';
  const { t } = useI18n();

  const { isDarkMode, toggleDarkMode } = useLayout();

  // Определяем события для родительского компонента
  const emit = defineEmits(['toggle-sidebar']);

  // Функция для переключения видимости бокового меню
  const toggleSidebar = () => {
    emit('toggle-sidebar');
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
