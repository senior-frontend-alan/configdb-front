import { ref } from 'vue';
import { parseBackendApiUrl } from '../config-loader';
import { loadCatalogIfNeeded } from '../router';

/**
 * Композабл для загрузки данных каталога по URL
 * Определяет модуль и каталог из URL и загружает данные в соответствующий стор
 */
export function useCatalogLoader() {
  const loading = ref(false);
  const error = ref<Error | null>(null);

  /**
   * Загружает данные каталога по URL
   * @param url URL каталога (например, /catalog/api/v1/charValueType/)
   * @param forceReload Принудительная перезагрузка данных, даже если они уже загружены
   * @returns Promise<boolean> Успешность загрузки
   */
  const loadCatalogByUrl = async (url: string, forceReload = false): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      // Парсим URL для получения информации о модуле и каталоге
      const urlInfo = parseBackendApiUrl(url);
      const { moduleName, catalogName } = urlInfo;

      if (!moduleName) {
        throw new Error(`Не удалось определить имя модуля из URL: ${url}`);
      }

      if (!catalogName) {
        throw new Error(`Не удалось определить имя каталога из URL: ${url}`);
      }

      console.log(`Загрузка каталога ${catalogName} для модуля ${moduleName}`);
      console.log('Информация о URL:', urlInfo);

      // Загружаем данные в moduleName стор с соответствующим catalogName
      const success = await loadCatalogIfNeeded(
        moduleName,
        catalogName,
        (err) => {
          if (err) {
            console.error('Ошибка при загрузке каталога:', err);
            error.value = err instanceof Error ? err : new Error(String(err));
          }
        },
        forceReload,
      );

      return success;
    } catch (err) {
      console.error('Ошибка при загрузке каталога:', err);
      error.value = err instanceof Error ? err : new Error(String(err));
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    loadCatalogByUrl,
  };
}
