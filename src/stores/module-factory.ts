// src/stores/module-factory.ts
import { defineStore, getActivePinia } from 'pinia';
import { ref, reactive } from 'vue';
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
    const moduleName = ref<string>(moduleConfig.name);
    const catalog = ref<CatalogResponse>([]);
    const currentItem = ref<any | null>(null);
    const loading = ref<boolean>(false);
    const error = ref<any | null>(null);
    const diamApplicationList = ref<any[]>([]);
    
    // Сохраненные данные по различным viewname - используем reactive вместо ref
    const catalogDetails = reactive<Record<string, any>>({});
    
    // Флаг для отслеживания запросов в процессе
    const isRequestInProgress = ref<boolean>(false);
    
    // действия
    const getCatalog = async (): Promise<CatalogResponse> => {
      // Если данные уже загружены или запрос уже выполняется, возвращаем текущие данные
      if (catalog.value && catalog.value.length > 0) {
        console.log(`Данные для модуля ${moduleConfig.id} уже загружены, используем кэшированные данные`);
        return catalog.value;
      }
      
      // Если запрос уже выполняется, ожидаем его завершения
      if (isRequestInProgress.value) {
        console.log(`Запрос для модуля ${moduleConfig.id} уже выполняется, ожидаем...`);
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (!isRequestInProgress.value) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 100);
        });
        return catalog.value;
      }
      
      // Устанавливаем флаги загрузки
      isRequestInProgress.value = true;
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
        isRequestInProgress.value = false;
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
    
    // Получение списка DIAM приложений
    const getDiamApplicationList = async () => {
      loading.value = true;
      try {
        const routes = moduleConfig.routes as unknown as Record<string, string>;
        const url = routes['getDiamApplicationList'];
        
        if (!url) {
          throw new Error(`Маршрут getDiamApplicationList не найден в конфигурации модуля ${moduleConfig.id}`);
        }
        
        console.log(`Отправка запроса на ${url}`);
        const response = await api.get(url);
        
        // Проверяем, есть ли в ответе поле results
        if (response.data && response.data.results) {
          diamApplicationList.value = response.data.results;
          error.value = null;
          return response.data.results;
        } else {
          // Если нет поля results, используем данные как есть
          diamApplicationList.value = response.data;
          error.value = null;
          return response.data;
        }
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при получении списка DIAM приложений:`, err);
        return [];
      } finally {
        loading.value = false;
      }
    };
    
    // Загрузка данных по URL и сохранение их в соответствующее поле catalogDetails
    const loadCatalogDetails = async (viewname: string, url: string): Promise<any> => {
      // Проверяем, есть ли уже загруженные данные для этого viewname
      if (catalogDetails[viewname] && !loading.value) {
        console.log(`Используем кэшированные данные для ${viewname}`);
        return catalogDetails[viewname];
      }
      
      loading.value = true;
      error.value = null;
      
      try {
        console.log(`Загрузка данных по URL: ${url}`);
        const response = await api.get(url);
        
        // Создаем новый объект с добавлением поля viewname для удобства
        const detailsData = {
          ...response.data,
          viewname: viewname,
          href: url,
          _timestamp: new Date().getTime() // Добавляем временную метку для отслеживания изменений
        };
        
        // Напрямую обновляем реактивный объект (reactive вместо ref)
        catalogDetails[viewname] = detailsData;
        
        console.log(`Данные для ${viewname} успешно загружены в стор:`, catalogDetails[viewname]);
        
        error.value = null;
        return detailsData;
      } catch (err) {
        error.value = err;
        console.error(`Ошибка при загрузке данных для ${viewname}:`, err);
        return null;
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
      moduleName,
      isRequestInProgress,
      diamApplicationList,
      catalogDetails,
      
      // действия
      getCatalog,
      getDiamApplicationList,
      deleteItem,
      loadCatalogDetails
    };
  });
}