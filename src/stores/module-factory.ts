// src/stores/module-factory.ts
import { defineStore, getActivePinia } from 'pinia';
import { ref } from 'vue';
import api from '../api';
import { useConfig } from '../config-loader';
import type { ModuleConfig } from '../config-loader';

// Функция для получения стора модуля по ID
export function useModuleStore(moduleId: string) {
  const { getModuleConfig } = useConfig();
  const moduleConfig = getModuleConfig(moduleId);
  
  if (!moduleConfig) {
    console.error(`Модуль ${moduleId} не найден в конфигурации`);
    return null;
  }
  
  // Получаем активный экземпляр Pinia
  const pinia = getActivePinia();
  
  if (!pinia) {
    console.error('Не найден активный экземпляр Pinia');
    return null;
  }
  
  // ID стора формируется как `${moduleConfig.id}Store`
  const storeId = `${moduleConfig.id}`;
  
  try {
    // Используем стандартную функцию Pinia для получения стора по ID
    // @ts-ignore - игнорируем ошибку типизации, так как мы знаем, что стор существует
    return pinia._s.get(storeId);
  } catch (err) {
    console.error(`Ошибка при получении стора ${storeId}:`, err);
    return null;
  }
}

export function createModuleStore(moduleConfig: ModuleConfig) {
  return defineStore(`${moduleConfig.id}`, () => {
    // состояние
    const items = ref<any[]>([]);
    const currentItem = ref<any | null>(null);
    const loading = ref<boolean>(false);
    const error = ref<any | null>(null);
    
    // геттеры
    const getItemById = (id: number | string) => {
      return items.value.find(item => item.id === id);
    };
    
    // действия
    const fetchItems = async () => {
      loading.value = true;
      try {
        const response = await api.get(moduleConfig.routes.list);
        items.value = response.data;
        error.value = null;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при получении ${moduleConfig.name}:`, err);
      } finally {
        loading.value = false;
      }
    };
    
    const fetchItemById = async (id: number | string) => {
      loading.value = true;
      try {
        const url = moduleConfig.routes.get.replace('{id}', id.toString());
        const response = await api.get(url);
        currentItem.value = response.data;
        error.value = null;
        return response.data;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при получении ${moduleConfig.name} с ID ${id}:`, err);
        return null;
      } finally {
        loading.value = false;
      }
    };
    
    const createItem = async (item: any) => {
      loading.value = true;
      try {
        const response = await api.post(moduleConfig.routes.create, item);
        items.value.push(response.data);
        error.value = null;
        return response.data;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при создании ${moduleConfig.name}:`, err);
        return null;
      } finally {
        loading.value = false;
      }
    };
    
    const updateItem = async (id: number | string, item: any) => {
      loading.value = true;
      try {
        const url = moduleConfig.routes.update.replace('{id}', id.toString());
        const response = await api.put(url, item);
        const index = items.value.findIndex(i => i.id === id);
        if (index !== -1) {
          items.value[index] = response.data;
        }
        error.value = null;
        return response.data;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при обновлении ${moduleConfig.name} с ID ${id}:`, err);
        return null;
      } finally {
        loading.value = false;
      }
    };
    
    const deleteItem = async (id: number | string) => {
      loading.value = true;
      try {
        const url = moduleConfig.routes.delete.replace('{id}', id.toString());
        await api.delete(url);
        items.value = items.value.filter(item => item.id !== id);
        error.value = null;
        return true;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при удалении ${moduleConfig.name} с ID ${id}:`, err);
        return false;
      } finally {
        loading.value = false;
      }
    };
    
    return {
      // состояние
      items,
      currentItem,
      loading,
      error,
      
      // геттеры
      getItemById,
      
      // действия
      fetchItems,
      fetchItemById,
      createItem,
      updateItem,
      deleteItem
    };
  });
}