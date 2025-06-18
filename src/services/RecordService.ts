// src/services/CatalogService.ts
import { ref, computed } from 'vue';
import api from '../api';
import { useModuleStore, initCatalogStructure } from '../stores/module-factory';
import type { CatalogDetailsAPIResponseGET } from '../stores/types/catalogDetailsAPIResponseGET.type';
import type { CatalogItem } from '../stores/types/catalogsAPIResponseGET.type';

// Маршрутизатор → Стор → Компоненты

// Lazy Loading + Virtual Scroll = Эффективность²
// Lazy Loading: экономит трафик и серверные ресурсы
// Virtual Scroll: экономит память браузера и ускоряет рендеринг

// 3. RecordService
// Отвечает за: Непосредственную загрузку данных с пагинацией
// Задачи:
// Формирование запросов к API с учетом пагинации
// Кэширование загруженных диапазонов данных
// Управление размером кэша
// Обновление данных в сторе

/**
 * Сервис для ленивой загрузки данных с использованием гибридного подхода
 * Позволяет эффективно управлять кэшированием и загрузкой данных по страницам
 */
export class RecordService {
  static async GET(
    moduleName: string,
    catalogName: string,
    recordId: string | number,
  ): Promise<any[]> {
    const moduleStore = useModuleStore(moduleName);
    let url = '';

    // Если каталог уже есть в сторе и у него есть URL, используем его
    if (moduleStore.catalogsByName?.[catalogName]?.url) {
      url = moduleStore.catalogsByName[catalogName].url;
      console.log(`Используем сохраненный URL для каталога ${catalogName}: ${url}`);
    } else {
      // Иначе ищем URL в индексе элементов каталога
      const catalogItem = moduleStore.catalogGroupsIndex.get(catalogName);

      if (!catalogItem || !catalogItem.href) {
        throw new Error(`URL для каталога ${catalogName} не найден в индексе`);
      }

      url = catalogItem.href;
      console.log(`Найден URL для каталога ${catalogName} в индексе: ${url}`);
    }

    // ШАГ 2: Проверяем, есть ли запись в сторе
    if (
      moduleStore.catalogsByName[catalogName] &&
      moduleStore.catalogsByName[catalogName].GET?.resultsIndex &&
      moduleStore.catalogsByName[catalogName].GET.resultsIndex.has(String(recordId))
    ) {
      // Если запись уже есть в сторе, возвращаем её
      const record = moduleStore.catalogsByName[catalogName].GET.resultsIndex.get(String(recordId));
      console.log(`Запись ${recordId} найдена в кэше каталога ${catalogName}`);
      return record;
    }

    // ШАГ 3: Загрузка записи через GET-запрос
    const recordUrl = `${url}${recordId}/?mode=short`;
    console.log(`Загрузка записи ${recordId} из каталога ${catalogName}: ${recordUrl}`);

    const response = await api.get<any>(recordUrl);
    const recordData = response.data;

    // ШАГ 4: Сохраняем запись в сторе
    // Если каталог еще не существует в сторе, создаем его
    // Инициализируем структуру каталога в сторе с помощью функции initCatalogStructure
    initCatalogStructure(moduleName, catalogName, url);

    // Добавляем запись в индекс
    moduleStore.catalogsByName[catalogName].GET.resultsIndex.set(String(recordId), recordData);

    console.log(`Запись ${recordId} успешно загружена и сохранена в сторе`);
    return recordData;
  }

  /**
   * Обновляет запись в GET после успешного PATCH ответа от сервера
   * @returns Успешно ли обновлена запись
   */
  static updateInStore(
    moduleName: string,
    catalogName: string,
    recordId: string,
    updatedData: any,
  ): boolean {
    try {
      const moduleStore = useModuleStore(moduleName);

      if (
        !moduleStore.catalogsByName[catalogName] ||
        !moduleStore.catalogsByName[catalogName].GET
      ) {
        console.warn(`Невозможно обновить запись в сторе: данные для ${catalogName} не загружены`);
        return false;
      }

      const currentData = moduleStore.catalogsByName[catalogName].GET;

      // Проверяем, что есть Map resultsIndex
      if (!currentData.resultsIndex || !(currentData.resultsIndex instanceof Map)) {
        console.warn(
          `Невозможно обновить запись в сторе: нет Map resultsIndex в данных ${catalogName}`,
        );
        return false;
      }

      // Проверяем наличие записи в Map
      if (!currentData.resultsIndex.has(String(recordId))) {
        console.warn(
          `Невозможно обновить запись в сторе: запись с ID ${recordId} не найдена в ${catalogName}`,
        );
        return false;
      }

      // Получаем существующую запись
      const existingRecord = currentData.resultsIndex.get(String(recordId));

      // Обновляем существующий объект на месте, чтобы сохранить связь с массивом results
      // Это гарантирует, что если объект также находится в массиве results, он тоже обновится
      Object.assign(existingRecord, updatedData);

      console.log(`Запись с ID ${recordId} успешно обновлена в сторе`);
      return true;
    } catch (error) {
      console.error(`Ошибка при обновлении записи в сторе:`, error);
      return false;
    }
  }
}

/**
 * Композабл для использования ленивой загрузки в компонентах Vue
 */
// export function useLazyLoad(moduleName: string, catalogName: string, initialPageSize: number = 10) {
//   return {};
// }
