<template>
  <div class="user-menu">
    <!-- Кнопка пользователя -->
    <div class="user-button" @click="(event) => menu.toggle(event)">
      <div class="user-avatar">
        <i class="pi pi-user"></i>
      </div>
      <div class="user-info">
        <div class="username">{{ username }}</div>
        <div class="user-role">{{ userRole }}</div>
      </div>
      <i class="pi pi-angle-down user-menu-icon"></i>
    </div>

    <!-- Меню пользователя -->
    <Menu id="user-menu" ref="menu" :model="userMenuItems" :popup="true" />
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import Menu from 'primevue/menu';
  import { useAuthStore } from '../stores/authStore';

  const { t } = useI18n();

  // Ссылка на меню пользователя
  const menu = ref(null);

  // Получаем хранилище аутентификации
  const authStore = useAuthStore();

  // Получаем имя пользователя из хранилища аутентификации
  const username = computed(() => {
    if (authStore.session && authStore.session.user) {
      return authStore.session.user.username;
    }
    return 'username';
  });

  // Получаем роль пользователя
  const userRole = computed(() => {
    if (authStore.session && authStore.session.user && authStore.session.user.role) {
      return authStore.session.user.role;
    }
    return t('auth.user');
  });

  // Пункты меню пользователя
  const userMenuItems = computed(() => [
    {
      label: t('auth.profile'),
      icon: 'pi pi-user',
      command: () => {
        // Переход на страницу профиля
        console.log(t('auth.profile'));
      },
    },
    {
      label: t('auth.logout'),
      icon: 'pi pi-sign-out',
      command: () => {
        // Выход из системы
        authStore.logout();
      },
    },
  ]);
</script>

<style scoped>
  .user-menu {
    width: 100%;
  }

  .user-button {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: background-color 0.2s;
  }

  .user-button:hover {
    background-color: var(--p-surface-100);
  }

  :deep(.p-dark) .user-button:hover {
    background-color: var(--p-surface-800);
  }

  .user-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: var(--p-primary-100);
    color: var(--p-primary-700);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.75rem;
    flex-shrink: 0;
  }

  :deep(.p-dark) .user-avatar {
    background-color: var(--p-primary-900);
    color: var(--p-primary-300);
  }

  .user-info {
    flex: 1;
    overflow: hidden;
  }

  .username {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-role {
    font-size: 0.85rem;
    color: var(--p-text-500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-menu-icon {
    margin-left: 0.5rem;
    color: var(--p-text-500);
  }
</style>
