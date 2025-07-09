// src/services/RecordService.ts
import api from '../api';
import { useModuleStore, initCatalogStructure } from '../stores/module-factory';
import { useAuthStore } from '../stores/authStore';
import { CatalogService } from './CatalogService';

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
    applName: string,
    catalogName: string,
    recordId: string | number,
  ): Promise<any> {
    console.log(
      `RecordService.GET: Запрос записи ${recordId} для ${moduleName}/${applName}/${catalogName}`,
    );

    try {
      // ШАГ 1: Получаем URL для загрузки каталога через CatalogService
      const url = CatalogService.findCatalogUrl(moduleName, applName, catalogName);

      // ШАГ 2: Инициализируем структуру каталога в сторе и получаем ссылку на нее
      const currentCatalog = initCatalogStructure(moduleName, applName, catalogName);

      // ШАГ 3: Проверяем, есть ли запись в кэше
      if (currentCatalog?.GET?.resultsIndex?.has(String(recordId))) {
        const record = currentCatalog.GET.resultsIndex.get(String(recordId));
        console.log(`RecordService.GET: Запись ${recordId} найдена в кэше каталога ${catalogName}`);
        return record;
      }

      // ШАГ 4: Загрузка записи через GET-запрос
      const recordUrl = url.includes('?') ? `${url}&mode=short` : `${url}?mode=short`;
      const fullRecordUrl = `${recordUrl}${recordId}/`;
      console.log(
        `RecordService.GET: Загрузка записи ${recordId} из каталога ${catalogName}: ${fullRecordUrl}`,
      );

      const response = await api.get<any>(fullRecordUrl);
      const recordData = response.data;

      // ШАГ 5: Сохраняем запись в сторе
      if (!currentCatalog.GET.resultsIndex) {
        currentCatalog.GET.resultsIndex = new Map<string, any>();
      }

      currentCatalog.GET.resultsIndex.set(String(recordId), recordData);

      console.log(`RecordService.GET: Запись ${recordId} успешно загружена и сохранена в сторе`);
      return recordData;
    } catch (error) {
      console.error(`RecordService.GET: Ошибка при загрузке записи ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * Обновляет запись в GET после успешного PATCH ответа от сервера
   * @returns Успешно ли обновлена запись
   */
  static updateInStore(
    moduleName: string,
    applName: string,
    catalogName: string,
    recordId: string,
    updatedData: any,
  ): boolean {
    try {
      const moduleStore = useModuleStore(moduleName);

      if (
        !moduleStore.loadedCatalogsByApplName[applName][catalogName] ||
        !moduleStore.loadedCatalogsByApplName[applName][catalogName].GET
      ) {
        console.warn(`Невозможно обновить запись в сторе: данные для ${catalogName} не загружены`);
        return false;
      }

      const currentData = moduleStore.loadedCatalogsByApplName[applName][catalogName].GET;

      // Проверяем, что есть Map resultsIndex
      if (!currentData.resultsIndex || !(currentData.resultsIndex instanceof Map)) {
        console.warn(
          `Невозможно обновить запись в сторе: нет Map resultsIndex в данных ${catalogName}`,
        );
        return false;
      }

      // Проверяем наличие записи в сторе в Map
      if (!currentData.resultsIndex.has(String(recordId))) {
        console.log(`Запись с ID ${recordId} не найдена в ${catalogName}, добавляем её в стор`);

        // Добавляем новую запись в стор
        if (currentData.results && Array.isArray(currentData.results)) {
          currentData.results.push(updatedData);
          currentData.resultsIndex.set(String(recordId), updatedData);

          console.log(`Запись с ID ${recordId} успешно добавлена в стор`);
          return true;
        } else {
          console.warn(
            `Невозможно добавить запись в стор: отсутствует массив results в ${catalogName}`,
          );
          return false;
        }
      }

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

  /**
   * Создает новую запись в каталоге
   * @returns Данные созданной записи
   */
  static async sendPostRequest(
    moduleName: string,
    applName: string,
    catalogName: string,
    data: any,
  ): Promise<any> {
    const moduleStore = useModuleStore(moduleName);

    if (
      !moduleStore ||
      !moduleStore.loadedCatalogsByApplName[applName] ||
      !moduleStore.loadedCatalogsByApplName[applName][catalogName]
    ) {
      throw new Error(`Не найден каталог ${catalogName} в модуле ${moduleName}`);
    }

    // Получаем корректный URL из CatalogService
    let baseUrl = CatalogService.findCatalogUrl(moduleName, applName, catalogName);

    // Проверяем и обеспечиваем наличие символа / в конце baseUrl
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }

    // Добавляем параметр mode=short
    if (!baseUrl.includes('?mode=short')) {
      baseUrl += '?mode=short';
    }

    // Получаем CSRF-токен из аутентификационного стора
    const authStore = useAuthStore();
    const csrfToken = authStore.csrfToken;
    const headers = csrfToken ? { 'X-CSRFToken': csrfToken } : {};

    console.log(`Отправка POST запроса на: ${baseUrl}`);
    console.log('Данные для отправки:', data);

    const response = await api.post(baseUrl, data, { headers });
    console.log('Ответ сервера (создание):', response.data);

    // Получаем ID новой записи из ответа
    const newRecordId = response.data.id || response.data.ID;

    // Обновляем запись в сторе
    this.updateInStore(moduleName, applName, catalogName, String(newRecordId), response.data);

    return response.data;
  }

  /**
   * Обновляет существующую запись в каталоге
   * @returns Данные обновленной записи
   */
  static async sendPatchRequest(
    moduleName: string,
    applName: string,
    catalogName: string,
    recordId: string | number,
    data: any,
  ): Promise<any> {
    const moduleStore = useModuleStore(moduleName);

    if (
      !moduleStore ||
      !moduleStore.loadedCatalogsByApplName[applName] ||
      !moduleStore.loadedCatalogsByApplName[applName][catalogName]
    ) {
      throw new Error(`Не найден каталог ${catalogName} в модуле ${moduleName}`);
    }

    // Получаем корректный URL из CatalogService
    let baseUrl = CatalogService.findCatalogUrl(moduleName, applName, catalogName);

    // Проверяем и обеспечиваем наличие символа / в конце baseUrl
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }

    let url = `${baseUrl}${recordId}/`;

    // Добавляем параметр mode=short
    if (!url.includes('?mode=short')) {
      url += '?mode=short';
    }

    // Получаем CSRF-токен из аутентификационного стора
    const authStore = useAuthStore();
    const csrfToken = authStore.csrfToken;
    const headers = csrfToken ? { 'X-CSRFToken': csrfToken } : {};

    console.log(`Отправка PATCH запроса на: ${url}`);
    console.log('Данные для отправки:', data);

    const response = await api.patch(url, data, { headers });
    console.log('Ответ сервера (обновление):', response.data);

    this.updateInStore(moduleName, applName, catalogName, String(recordId), response.data);

    return response.data;
  }
}

/**
 * Композабл для использования ленивой загрузки в компонентах Vue
 */
// export function useLazyLoad(moduleName: string, catalogName: string, initialPageSize: number = 10) {
//   return {};
// }
