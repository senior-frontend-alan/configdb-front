// src/stores/settingsStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

// Интерфейс для пункта меню
interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon?: string;
  active?: boolean;
  children?: MenuItem[];
}

export const useSettingsStore = defineStore('userSettings', () => {
  // Состояние
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const menuItems = ref<MenuItem[]>([]);
  
  // Загрузка пунктов меню
  async function fetchMenuItems() {
    try {
      isLoading.value = true;
      error.value = null;
      
      // Здесь должен быть запрос к API, но пока используем мок-данные
      // const response = await api.get('/api/v1/menu/');
      // menuItems.value = response.data;
      
      // Мок-данные для меню
      menuItems.value = [
        {
          id: '1',
          name: 'Главная',
          path: '/',
          icon: 'pi pi-home',
          active: false
        },
        {
          id: '2',
          name: 'Каталог',
          path: '/catalog',
          icon: 'pi pi-book',
          active: false,
          children: [
            {
              id: '2-1',
              name: 'Список элементов',
              path: '/catalog/elements',
              active: false
            },
            {
              id: '2-2',
              name: 'Категории',
              path: '/catalog/categories',
              active: false
            }
          ]
        },
        {
          id: '3',
          name: 'Настройки',
          path: '/settings',
          icon: 'pi pi-cog',
          active: false
        },
        {
          id: '4',
          name: 'Пример виджета',
          path: '/example-widget',
          icon: 'pi pi-chart-bar',
          active: false
        }
      ];
      
      isInitialized.value = true;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      console.error('Ошибка при загрузке меню:', e);
    } finally {
      isLoading.value = false;
    }
  }
  
  // Установка активного пункта меню
  function setActiveMenuItem(path: string) {
    // Сбрасываем активность всех пунктов
    menuItems.value.forEach(item => {
      item.active = false;
      if (item.children) {
        item.children.forEach(child => {
          child.active = false;
        });
      }
    });
    
    // Устанавливаем активный пункт
    let found = false;
    
    // Сначала проверяем дочерние элементы
    for (const item of menuItems.value) {
      if (item.children) {
        for (const child of item.children) {
          if (child.path === path) {
            child.active = true;
            item.active = true; // Активируем и родительский пункт
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }
    
    // Если не нашли в дочерних, проверяем основные пункты
    if (!found) {
      for (const item of menuItems.value) {
        if (item.path === path) {
          item.active = true;
          break;
        }
      }
    }
  }
  
  return {
    isInitialized,
    isLoading,
    error,
    menuItems,
    fetchMenuItems,
    setActiveMenuItem,
  };
});
