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

// Определяем пропсы компонента
defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
});

const { config } = useConfig();

// Открытые пункты меню
const openMenuItems = ref<Record<string, boolean>>({});

const handleMenuItemClick = async (event: any) => {
  console.log("Клик по пункту меню:", event);

  // Получаем модуль из пути
  const path = event.item.to?.split("/") || [];

  if (path.length >= 2) {
    const moduleId = path[1];
    const moduleStore = useModuleStore(moduleId);
    openMenuItems.value[moduleId] = !openMenuItems.value[moduleId];

    // Проверяем, загружены ли уже данные в сторе
    if (moduleStore.catalog && moduleStore.catalog.length > 0) {
      return; // Если данные уже загружены, не загружаем их повторно
    }

    try {
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
};

// Базовые элементы меню
// Функция для обработки клика по элементу каталога
const handleCatalogItemClick = (moduleId: string, group: CatalogGroup) => {
  console.log(`Клик по элементу каталога: ${moduleId} - ${group.verbose_name}`);
};

// Формируем модель меню для PrimeVue Menu
const menuItems = computed(() => {
  // Главный пункт меню
  const homeItem = {
    label: config.value.appConfig.name,
    icon: "pi pi-home",
    to: "/",
    command: (event: any) => handleMenuItemClick(event),
  };

  // Пункты меню модулей из конфигурации
  const moduleItems = config.value.modules.map((module) => {
    const moduleItem: any = {
      label: module.name,
      icon: module.icon || "pi pi-folder",
      to: `/${module.id}`,
      command: (event: any) => handleMenuItemClick(event),
      key: module.id, // Уникальный ключ для пункта меню
    };

    // Подменю строится на данных стора каждого модуля
    const moduleStore = useModuleStore(module.id);
    if (moduleStore && moduleStore.catalog && moduleStore.catalog.length > 0) {
      moduleItem.items = moduleStore.catalog.map((group: CatalogGroup) => ({
        label: group.verbose_name,
        icon: "pi pi-folder",
        command: () => handleCatalogItemClick(module.id, group),
        key: `${module.id}_${group.name}`, // Уникальный ключ для элемента подменю
      }));
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
