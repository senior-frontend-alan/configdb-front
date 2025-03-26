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
    
  return {
    isInitialized,
    isLoading,
    error,
  };
});
