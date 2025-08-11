<template>
  <div v-show="visible" class="side-menu-container">
    <div class="side-menu-content">
      <div class="topbar-brand">
        <img src="../assets/favicon.jpg" alt="Logo" class="logo-icon" />

        <span class="topbar-brand-text">
          <span class="topbar-title">{{ appConfig.siteTitle }}</span>
        </span>
      </div>
      <PanelMenu :model="menuItems" :expandedKeys="openMenuItems" data-testid="side-menu-panel" />
    </div>

    <div class="user-menu-container">
      <UserMenu />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import PanelMenu from 'primevue/panelmenu';
  import { useModuleStore } from '../stores/module-factory';
  import type { CatalogGroup } from '../stores/types/moduleStore.type';
  import { useRouter, useRoute } from 'vue-router';
  import { useModuleName } from '../composables/useModuleName';
  import UserMenu from './UserMenu.vue';

  // Определяем пропсы компонента
  defineProps({
    visible: {
      type: Boolean,
      default: true,
    },
  });

  const router = useRouter();
  const route = useRoute();
  const { moduleName: currentModuleName } = useModuleName();

  const appConfig = computed(() => window.APP_CONFIG.appConfig || {});
  const modules = computed(() => window.APP_CONFIG.modules || []);

  // Автоматическое управление открытыми пунктами меню на основе текущего moduleName
  const openMenuItems = computed(() => {
    const result: Record<string, boolean> = {};

    // Проверяем, что есть текущий moduleName
    if (currentModuleName.value) {
      // Проверяем, что модуль существует в конфигурации
      const moduleExists = modules.value.some((m) => {
        // Используем поле urlPath для проверки наличия модуля
        return m.urlPath?.toLowerCase() === currentModuleName.value.toLowerCase();
      });

      // Если модуль существует, открываем его меню
      if (moduleExists) {
        result[currentModuleName.value] = true;
      }
    }

    return result;
  });

  const handleMenuItemClick = async (event: any, path: string) => {
    // Предотвращаем стандартное поведение ссылки
    if (event && event.originalEvent) {
      event.originalEvent.preventDefault();
    }

    // Выполняем переход по нормализованному пути
    // Роутер сам загрузит данные через хуки beforeEnter
    router.push(path.toLowerCase());
  };

  const moduleName = computed(() => {
    return (route.params.moduleName as string) || '';
  });

  const isRouteActive = (path: string) => {
    // Для главной страницы
    if (path === '/') {
      return route.path === '/';
    }

    // Разбираем URL на базовый путь и query параметры
    const [basePath, queryString] = path.split('?');
    const pathModuleId = basePath.split('/')[1];

    // Проверяем совпадение модуля
    if (pathModuleId !== moduleName.value) {
      return false;
    }

    // Если нет query параметров, проверяем только модуль
    if (!queryString) {
      return route.path === basePath && !route.query.group;
    }

    // Если есть query параметр group, проверяем его значение
    const groupMatch = queryString.match(/group=([^&]+)/);
    if (groupMatch) {
      return route.path === basePath && route.query.group === groupMatch[1];
    }

    return false;
  };

  // Формируем модель меню для PrimeVue Menu
  const menuItems = computed(() => {
    // Главный пункт меню
    const homeItem = {
      label: appConfig.value.siteTitle,
      icon: 'pi pi-home',
      class: 'data-testid-side-menu-home-item',
      command: (event: any) => handleMenuItemClick(event, '/'),
      style: isRouteActive('/')
        ? {
            backgroundColor: 'var(--primary-color-lighter, #e3f2fd)',
            color: 'var(--primary-color, #2196f3)',
          }
        : undefined,
    };

    // Пункт Настройки
    const settingsItem = {
      label: 'Settings',
      icon: 'pi pi-cog',
      class: 'data-testid-side-menu-settings-item',
      command: (event: any) => handleMenuItemClick(event, '/settings'),
      style: isRouteActive('/settings')
        ? {
            backgroundColor: 'var(--primary-color-lighter, #e3f2fd)',
            color: 'var(--primary-color, #2196f3)',
          }
        : undefined,
    };

    // Пункты меню модулей из конфигурации
    const moduleItems = modules.value.map((module) => {
      // Получаем имя модуля из URL
      const moduleName = module.urlPath;
      const path = `/${moduleName}`;
      const moduleItem: any = {
        label: module.label,
        icon: 'pi pi-folder',
        class: `data-testid-side-menu-module-${moduleName}-item`,
        command: (event: any) => handleMenuItemClick(event, path),
        key: moduleName, // Уникальный ключ для пункта меню
        style: isRouteActive(path)
          ? {
              backgroundColor: 'var(--primary-color-lighter, #e3f2fd)',
              color: 'var(--primary-color, #2196f3)',
            }
          : undefined,
      };
      // Подменю строится на данных стора каждого модуля
      const moduleStore = useModuleStore(moduleName);

      // Всегда используем данные из стора, Данные будут загружены при клике на пункт меню в функции handleMenuItemClick
      if (moduleStore) {
        // Если в сторе есть данные, формируем подменю
        if (moduleStore.catalogGroups && moduleStore.catalogGroups.length > 0) {
          moduleItem.items = moduleStore.catalogGroups.map((group: CatalogGroup) => {
            // Формируем путь с параметром group
            const path = `/${moduleName}?group=${group.name}`;
            return {
              label: group.verbose_name,
              command: (event: any) => {
                handleMenuItemClick(event, path);
              },
              class: `data-testid-side-menu-group-${moduleName}-${group.name}-item`,
              key: `${moduleName}_${group.name}`, // Уникальный ключ для элемента подменю
              style: isRouteActive(path)
                ? {
                    backgroundColor: 'var(--primary-color-lighter, #e3f2fd)',
                    color: 'var(--primary-color, #2196f3)',
                  }
                : undefined,
            };
          });
        }
      }

      return moduleItem;
    });

    // Объединяем главный пункт, модули и настройки
    return [homeItem, ...moduleItems, settingsItem];
  });

  // Примечание: Загрузка данных каталога теперь происходит при клике на пункт меню
</script>

<style scoped>
  .side-menu-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .side-menu-content {
    flex: 1;
    overflow-y: auto;
  }

  .user-menu-container {
    border-top: 1px solid var(--p-surface-200);
  }
</style>

<style>
  :root {
    --p-panelmenu-gap: 0;
    --p-panelmenu-panel-border-width: 0;
    --p-panelmenu-panel-border-color: transparent;
  }

  .topbar-brand {
    padding: 1.5rem;
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .logo-letter {
    background-color: #0ba52a;
    color: white;
    font-size: 1.8rem;
    font-weight: bold;
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    margin-right: 0.5rem;
  }
</style>
