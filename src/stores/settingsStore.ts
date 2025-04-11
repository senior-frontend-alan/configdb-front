import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  // Состояние
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  
  // Настройки пользователя
  const useTabMode = ref(false); // Режим отображения каталога (табы или список)
  const roundDecimals = ref(2); // Количество знаков после запятой для десятичных чисел
  
  // Изменение режима отображения
  const setTabMode = (value: boolean) => {
    useTabMode.value = value;
    // Здесь можно добавить сохранение в localStorage или на сервер
  };
  
  // Изменение количества знаков после запятой
  const setroundDecimals = (value: number) => {
    roundDecimals.value = value;
    // Здесь можно добавить сохранение в localStorage или на сервер
  };
  
  return {
    isInitialized,
    isLoading,
    error,
    useTabMode,
    roundDecimals,
    setTabMode,
    setroundDecimals,
  };
});
