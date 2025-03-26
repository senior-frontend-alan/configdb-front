// src/stores/module-factory.ts
import { defineStore, getActivePinia } from 'pinia';
import { ref } from 'vue';
import api from '../api';
import { useConfig } from '../config-loader';
import type { ModuleConfig } from '../config-loader';
import type { CatalogResponse } from './types/moduleStore.type';

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
    const catalog = ref<CatalogResponse>([]);
    const currentItem = ref<any | null>(null);
    const loading = ref<boolean>(false);
    const error = ref<any | null>(null);
    

    // действия
    const getCatalog = async (): Promise<CatalogResponse> => {
      loading.value = true;
      try {
        const routes = moduleConfig.routes as unknown as Record<string, string>;
        const url = routes['getCatalog'];
        
        console.log(`Отправка запроса на ${url}`);
        const response = await api.get<CatalogResponse>(url);
        catalog.value = response.data;
        error.value = null;
        return response.data;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при получении ${moduleConfig.name}:`, err);
        return [];
      } finally {
        loading.value = false;
      }
    };
    
  
    
    
    const deleteItem = async (id: number | string) => {
      loading.value = true;
      try {
        const url = moduleConfig.routes.delete.replace('{id}', id.toString());
        await api.delete(url);
        catalog.value = catalog.value.filter(item => item.id !== id);
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
      catalog,
      currentItem,
      loading,
      error,
      
      // действия
      getCatalog,
      deleteItem
    };
  });
}