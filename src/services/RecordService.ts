// src/services/RecordService.ts
import api from '../api';
import { useAuthStore } from '../stores/authStore';

// Lazy Loading + Virtual Scroll = Эффективность²
// Lazy Loading: экономит трафик и серверные ресурсы
// Virtual Scroll: экономит память браузера и ускоряет рендеринг

// 3. RecordService
// Формирование запросов к API

export class RecordService {
  /**
   * Универсальный метод для отправки запросов к API
   * @description Поддерживает GET, POST и PATCH запросы
   * @param method Метод запроса (GET, POST, PATCH)
   * @param url Базовый URL каталога
   * @param recordId ID записи (для GET и PATCH)
   * @param data Данные для отправки (для POST и PATCH)
   * @returns Данные ответа
   */
  static async sendRequest(
    method: 'GET' | 'POST' | 'PATCH',
    url: string,
    recordId?: string | number,
    data?: any,
  ): Promise<any> {
    try {
      if (!url) {
        throw new Error(`URL каталога не указан`);
      }

      // Проверяем и обеспечиваем наличие символа / в конце baseUrl
      let baseUrl = url;
      if (!baseUrl.endsWith('/')) {
        baseUrl += '/';
      }

      // Формируем итоговый URL в зависимости от метода
      let finalUrl = baseUrl;
      if ((method === 'GET' || method === 'PATCH') && recordId) {
        finalUrl = `${baseUrl}${recordId}/`;
      }

      // Добавляем параметр mode=short
      if (!finalUrl.includes('?mode=short')) {
        const queryChar = finalUrl.includes('?') ? '&' : '?';
        finalUrl += `${queryChar}mode=short`;
      }

      // Получаем CSRF-токен из аутентификационного стора
      const headers: Record<string, string> = {};
      if (method === 'POST' || method === 'PATCH') {
        const authStore = useAuthStore();
        const csrfToken = authStore.csrfToken;
        if (csrfToken) {
          headers['X-CSRFToken'] = csrfToken;
        }
      }

      console.log(`RecordService.sendRequest: Отправка ${method} запроса на: ${finalUrl}`);
      if (data) {
        console.log('Данные для отправки:', data);
      }

      // Выполняем запрос в зависимости от метода
      let response;
      switch (method) {
        case 'GET':
          response = await api.get(finalUrl);
          break;
        case 'POST':
          response = await api.post(finalUrl, data, { headers });
          break;
        case 'PATCH':
          response = await api.patch(finalUrl, data, { headers });
          break;
        default:
          throw new Error(`Неподдерживаемый метод: ${method}`);
      }

      console.log(`Ответ сервера (${method}):`, response.data);

      return response.data;
    } catch (error) {
      console.error(`RecordService.sendRequest: Ошибка при выполнении ${method} запроса:`, error);
      throw error;
    }
  }
}
