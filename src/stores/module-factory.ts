// src/stores/module-factory.ts
import { defineStore, getActivePinia } from 'pinia';
import { ref, reactive } from 'vue';
import api from '../api';
import { useConfig } from '../config-loader';
import type { ModuleConfig } from '../config-loader';
import type { CatalogsAPIResponseGET } from './types/catalogsAPIResponseGET.type';
import type { CatalogDetailsAPIResponseGET } from './types/catalogDetailsAPIResponseGET.type';
import type { CatalogDetailsAPIResponseOPTIONS } from './types/catalogDetailsAPIResponseOPTIONS.type';

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
    const catalog = ref<CatalogsAPIResponseGET>([]);
    const currentItem = ref<any | null>(null);
    const loading = ref<boolean>(false);
    const error = ref<any | null>(null);
    const diamApplicationList = ref<any[]>([]);
    
    // Сохраненные данные по различным viewname - используем reactive вместо ref
    const catalogDetails = reactive<Record<string, any>>({});
    
    // Флаг для отслеживания запросов в процессе
    const isRequestInProgress = ref<boolean>(false);
    
    // действия
    const getCatalog = async (): Promise<CatalogsAPIResponseGET> => {
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
        const response = await api.get<CatalogsAPIResponseGET>(url);
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
        
        // Выполняем GET запрос
        const getResponse = await api.get<CatalogDetailsAPIResponseGET>(url);
        
        // Выполняем OPTIONS запрос на тот же URL
        console.log(`Запрашиваем OPTIONS для URL: ${url}`);
        const optionsResponse = await api.options<CatalogDetailsAPIResponseOPTIONS>(url);
        
        // Создаем новый объект с добавлением поля viewname и сохранением данных в полях GET и OPTIONS
        const detailsData = {
          GET: {
            ...getResponse.data
          },
          OPTIONS: {
            ...optionsResponse.data
          },
          viewname: viewname,
          href: url,
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
      loadCatalogDetails
    };
  });
}