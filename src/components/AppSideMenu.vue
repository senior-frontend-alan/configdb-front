<template>
  <div v-show="visible">
    <PanelMenu :model="menuItems" :expandedKeys="openMenuItems" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useConfig } from "../config-loader";
import PanelMenu from "primevue/panelmenu";
import { useModuleStore } from "../stores/module-factory";
import type { CatalogGroup } from "../stores/types/moduleStore.type";
import { useRouter, useRoute } from "vue-router";

// Определяем пропсы компонента
defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
});

const router = useRouter();
const route = useRoute();

const { config } = useConfig();

// Сохраняем открытые пункты меню
const openMenuItems = ref<Record<string, boolean>>({});

// Функция для обработки клика по пункту меню
const handleMenuItemClick = async (
  event: any,
  path: string,
  isSubmenuItem = false
) => {
  console.log("Клик по пункту меню:", event, path, isSubmenuItem);

  // Предотвращаем стандартное поведение ссылки
  if (event && event.originalEvent) {
    event.originalEvent.preventDefault();
  }

  // Если это главная страница, просто переходим на неё
  if (path === "/") {
    router.push(path);
    return;
  }

  // Получаем модуль из пути
  const pathParts = path.split("/");

  if (pathParts.length >= 2) {
    const moduleId = pathParts[1];

    // Проверяем, что модуль существует в конфигурации
    const moduleExists = config.value.modules.some((m) => m.id === moduleId);
    if (!moduleExists) {
      console.error(`Модуль ${moduleId} не найден в конфигурации`);
      return;
    }

    const moduleStore = useModuleStore(moduleId);

    // Переключаем состояние меню только если это не элемент подменю
    if (!isSubmenuItem) {
      const isCurrentlyActive = isRouteActive(`/${moduleId}`);
      // Если это активный пункт меню и он уже открыт, тогда можно его закрыть
      if (isCurrentlyActive && openMenuItems.value[moduleId]) {
        openMenuItems.value[moduleId] = false;
      } else {
        openMenuItems.value[moduleId] = true;
      }
    } else {
      // Если это элемент подменю, убедимся, что меню открыто
      openMenuItems.value[moduleId] = true;
    }

    // Проверяем, загружены ли уже данные в сторе
    if (!moduleStore.catalog || moduleStore.catalog.length === 0) {
      try {
        // Загружаем данные, если их еще нет
        await moduleStore.getCatalog();
        console.log(
          `Данные успешно загружены для модуля ${moduleId}:`,
          moduleStore.catalog
        );
      } catch (error) {
        console.error(
          `Ошибка при получении данных для модуля ${moduleId}:`,
          error
        );
      }
    }
  }

  router.push(path);
};

const isRouteActive = (path: string) => {
  // Проверяем, совпадает ли текущий маршрут с путем
  if (path === "/" && route.path === "/") {
    return true;
  }

  // Для модулей и подменю
  const pathParts = path.split("/");
  const routeParts = route.path.split("/");

  // Если это просто модуль (2 части пути)
  if (pathParts.length === 2 && routeParts.length >= 2) {
    return pathParts[1] === routeParts[1] && routeParts.length === 2;
  }

  // Если это элемент подменю (3 части пути)
  if (pathParts.length === 3 && routeParts.length === 3) {
    return pathParts[1] === routeParts[1] && pathParts[2] === routeParts[2];
  }

  return false;
};

// Формируем модель меню для PrimeVue Menu
const menuItems = computed(() => {
  // Главный пункт меню
  const homeItem = {
    label: config.value.appConfig.name,
    icon: "pi pi-home",
    command: (event: any) => handleMenuItemClick(event, "/"),
    style: isRouteActive("/")
      ? {
          backgroundColor: "var(--primary-color-lighter, #e3f2fd)",
          color: "var(--primary-color, #2196f3)",
        }
      : undefined,
  };

  // Пункты меню модулей из конфигурации
  const moduleItems = config.value.modules.map((module) => {
    const modulePath = `/${module.id}`;
    const moduleItem: any = {
      label: module.name,
      icon: module.icon || "pi pi-folder",
      command: (event: any) => handleMenuItemClick(event, modulePath),
      key: module.id, // Уникальный ключ для пункта меню
      style: isRouteActive(modulePath)
        ? {
            backgroundColor: "var(--primary-color-lighter, #e3f2fd)",
            color: "var(--primary-color, #2196f3)",
          }
        : undefined,
    };

    // Подменю строится на данных стора каждого модуля
    const moduleStore = useModuleStore(module.id);
    if (moduleStore && moduleStore.catalog && moduleStore.catalog.length > 0) {
      moduleItem.items = moduleStore.catalog.map((group: CatalogGroup) => {
        const groupPath = `/${module.id}/${group.name}`;
        return {
          label: group.verbose_name,
          icon: "pi pi-folder",
          command: (event: any) => {
            handleMenuItemClick(event, groupPath, true);
          },
          key: `${module.id}_${group.name}`, // Уникальный ключ для элемента подменю
          style: isRouteActive(groupPath)
            ? {
                backgroundColor: "var(--primary-color-lighter, #e3f2fd)",
                color: "var(--primary-color, #2196f3)",
              }
            : undefined,
        };
      });
    }

    return moduleItem;
  });

  // Объединяем главный пункт и модули
  return [homeItem, ...moduleItems];
});

// Примечание: Загрузка данных каталога теперь происходит при клике на пункт меню
</script>

<style>
:root {
  --p-panelmenu-gap: 0;
  --p-panelmenu-panel-border-width: 0;
  --p-panelmenu-panel-border-color: transparent;
}
</style>
