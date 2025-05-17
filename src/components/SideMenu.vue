<template>
  <div v-show="visible">
    <div class="topbar-brand">
      <span class="logo-letter">R</span>

      <span class="topbar-brand-text">
        <span class="topbar-title">RSC Management Console</span>
      </span>
    </div>
    <PanelMenu :model="menuItems" :expandedKeys="openMenuItems" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useConfig, parseBackendApiUrl } from '../config-loader';
  import PanelMenu from 'primevue/panelmenu';
  import { useModuleStore } from '../stores/module-factory';
  import type { CatalogGroup } from '../stores/types/moduleStore.type';
  import { useRouter, useRoute } from 'vue-router';
  import { useModuleName } from '../composables/useModuleName';

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

  const { config } = useConfig();

  // Автоматическое управление открытыми пунктами меню на основе текущего moduleName
  const openMenuItems = computed(() => {
    const result: Record<string, boolean> = {};

    // Проверяем, что есть текущий moduleName
    if (currentModuleName.value) {
      // Проверяем, что модуль существует в конфигурации
      const moduleExists = config.value.modules.some((m) => {
        const extractedModuleName = parseBackendApiUrl(m.routes.getCatalog).moduleName;
        return extractedModuleName === currentModuleName.value;
      });

      // Если модуль существует, открываем его меню
      if (moduleExists) {
        result[currentModuleName.value] = true;
      }
    }

    return result;
  });

  const handleMenuItemClick = async (event: any, path: string) => {
    console.log('Клик по пункту меню:', path);

    // Предотвращаем стандартное поведение ссылки
    if (event && event.originalEvent) {
      event.originalEvent.preventDefault();
    }

    // Просто выполняем переход по указанному пути
    // Роутер сам загрузит данные через хуки beforeResolve/beforeEach
    router.push(path);
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
      label: config.value.appConfig.name,
      icon: 'pi pi-home',
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
      command: (event: any) => handleMenuItemClick(event, '/settings'),
      style: isRouteActive('/settings')
        ? {
            backgroundColor: 'var(--primary-color-lighter, #e3f2fd)',
            color: 'var(--primary-color, #2196f3)',
          }
        : undefined,
    };

    // Пункты меню модулей из конфигурации
    const moduleItems = config.value.modules.map((module) => {
      // Получаем имя модуля из URL
      const moduleName = parseBackendApiUrl(module.routes.getCatalog).moduleName;
      const path = `/${moduleName}`;
      const moduleItem: any = {
        label: module.label,
        icon: module.icon || 'pi pi-folder',
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
