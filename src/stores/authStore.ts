import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api';
import type { AuthSessionData, AuthState, ApiErrorState, Session } from './types/authStoreTypes';

// Механизм работы с CSRF-токеном:

// механизм работы с CSRF-токеном:
// На странице /login запрос отправляется без CSRF-токена,
// Получает ответ установить куку sessionid
// CSRF-токен хранится в памяти

// При перезагрузки страницы
// отправляется запрос GET http://localhost:8080/api/v1/session/?mode=short с кукой sessionid
// и сервер возвращает новый CSRF-токен в заголовке ответа который снова хранится в памяти

// Начальное состояние хранилища
const initialState: AuthState = {
  session: null, // Сессия хранится в куках
  csrfToken: null, // CSRF-токен хранится в сторе
  loading: false,
  error: {
    type: '',
    message: '',
    status: 0,
    data: null,
  },
};

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(initialState.session);
  const csrfToken = ref<string | null>(initialState.csrfToken);
  const loading = ref(initialState.loading);
  const error = ref<ApiErrorState>(initialState.error);

  // Проверяем наличие id или session_key для определения статуса аутентификации
  const isAuthenticated = computed(() => {
    if (!session.value) return false;
    return !!(session.value.id || session.value.session_key);
  });

  /**
   * Функция для сброса ошибки в хранилище
   */
  function resetError(): void {
    error.value = {
      type: '',
      message: '',
      status: 0,
      data: null,
    };
  }

  /**
   * Функция для сохранения ошибки в хранилище
   */
  function saveError(err: any): void {
    if (err.type === 'ApiError' || err.name === 'ApiError') {
      // Ошибка уже в формате ApiError
      console.log('Обнаружена ApiError:', err);
      error.value = {
        type: 'ApiError',
        message: err.message,
        status: err.status || 0,
        data: err.data || null,
      };
    } else {
      // Обычная ошибка
      console.log('Обычная ошибка:', err);
      error.value = {
        type: 'Error',
        message: err instanceof Error ? err.message : String(err),
        status: 0,
        data: null,
      };
    }
  }

  /**
   * Авторизация пользователя
   */
  async function login(authData: AuthSessionData): Promise<boolean> {
    loading.value = true;
    resetError();

    try {
      // Очищаем предыдущую сессию перед новым логином (т.к. в куках могут оставаться данные)
      clearLocalSessionData();

      // Получаем URL для авторизации из конфигурации
      let loginUrl = window.APP_CONFIG?.appConfig?.routes?.apiSession;

      // Добавляем слеш в конец URL, если его там нет
      if (loginUrl && !loginUrl.endsWith('/')) {
        loginUrl += '/';
      }

      console.log(`Используем URL для авторизации: ${loginUrl}`);
      console.log('Отправляем данные для авторизации:', { username: authData.username });

      // Отправляем запрос на аутентификацию в Django
      const response = await api.post(loginUrl, authData, {
        withCredentials: true, // Важно для работы с сессиями Django
      });

      // Проверяем наличие CSRF-токена в заголовке ответа
      const newCsrfToken = response.headers?.['x-csrftoken'];
      if (newCsrfToken) {
        csrfToken.value = newCsrfToken;
        console.log('Получен новый CSRF-токен в заголовке ответа. Сохранен в сторе:', newCsrfToken);
      }

      // Проверяем ответ сервера
      console.log('Ответ сервера при авторизации:', response.data);

      // Сохраняем сессию в сторе (а sessionId хранится в куках)
      if (response.data && (response.data.id || response.data.session_key)) {
        session.value = response.data;
        console.log('Сессия успешно создана и сохранена в сторе');
        return true;
      } else {
        console.error('Ошибка: сервер не вернул данные сессии');
        return false;
      }
    } catch (err) {
      console.error('Ошибка!!!:', err);
      saveError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Очистка локальных данных сессии и куков
   * Очищает данные сессии в сторе и удаляет связанные куки
   */
  function clearLocalSessionData(): void {
    session.value = null;
    csrfToken.value = null;

    // Более надежный способ удаления куков
    // Удаляем куку sessionid с указанием всех необходимых параметров
    const cookiesToClear = ['sessionid', 'csrftoken'];
    const domain = window.location.hostname;
    const paths = ['/', '/api/'];

    // Перебираем все комбинации имен куков и путей
    cookiesToClear.forEach((cookieName) => {
      paths.forEach((path) => {
        // Удаляем куку с указанием домена
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure;`;
        // Удаляем куку без указания домена
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; secure;`;
      });
    });

    console.log('Куки очищены');

    // Для отладки выводим все оставшиеся куки
    console.log('Оставшиеся куки после очистки:', document.cookie);
  }

  /**
   * Выход из системы с перенаправлением на страницу входа
   */
  async function logout(): Promise<boolean> {
    loading.value = true;
    resetError();

    try {
      if (!session.value) {
        throw new Error('Нет активной сессии для выхода');
      }

      if (!session.value.session_key) {
        throw new Error('Отсутствует session_key для выхода из системы');
      }

      let baseSessionUrl = window.APP_CONFIG?.appConfig?.routes?.apiSession;

      // Проверяем и добавляем слеш в конец базового URL, если его там нет
      if (!baseSessionUrl) {
        throw new Error('Не настроен URL для работы с сессиями');
      }

      if (!baseSessionUrl.endsWith('/')) {
        baseSessionUrl += '/';
      }

      // Формируем полный URL с идентификатором сессии и параметром mode=short
      const sessionUrl = `${baseSessionUrl}${session.value.session_key}/?mode=short`;
      console.log(`Отправляем запрос на выход по URL: ${sessionUrl}`);

      // Отправляем запрос на выход в Django
      const response = await api.delete(sessionUrl, {
        headers: {
          'X-CSRFToken': csrfToken.value,
        },
        withCredentials: true,
      });

      // Логируем заголовки ответа для отладки
      console.log('Заголовки ответа при выходе:', response.headers);

      // Очищаем локальные данные сессии и куки
      clearLocalSessionData();

      // Перенаправляем на страницу логина
      // Полная перезагрузка страницы - это обеспечивает полный сброс состояния приложения
      window.location.href = '/login';

      return true;
    } catch (err) {
      console.error('Ошибка при выходе из системы:', err);
      saveError(err);

      // Даже в случае ошибки очищаем сессию
      clearLocalSessionData();

      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Проверка текущей сессии
   */
  async function checkSession(): Promise<boolean> {
    loading.value = true;
    resetError();

    try {
      // Используем тот же URL, что и для авторизации
      let sessionUrl = window.APP_CONFIG?.appConfig?.routes?.apiSession;

      // Добавляем слеш в конец URL, если его там нет
      if (sessionUrl && !sessionUrl.endsWith('/')) {
        sessionUrl += '/';
      }

      console.log(`Используем URL для проверки сессии: ${sessionUrl}`);

      // При проверке сессии также получаем новый CSRF-токен
      const response = await api.get(sessionUrl, {
        withCredentials: true, // Важно для работы с сессиями Django
      });

      // Проверяем наличие CSRF-токена в заголовке ответа
      const newCsrfToken = response.headers?.['x-csrftoken'];
      if (newCsrfToken) {
        csrfToken.value = newCsrfToken;
        console.log('Получен новый CSRF-токен при проверке сессии:', newCsrfToken);
      }

      // Проверяем ответ сервера
      console.log('Ответ сервера при проверке сессии:', response.data);
      console.log('Текущая сессия в сторе:', session.value);

      // Важно: если получен CSRF-токен, значит сессия действительна
      if (newCsrfToken) {
        // Проверяем, если ответ - массив, берем первый элемент
        if (Array.isArray(response.data) && response.data.length > 0) {
          session.value = response.data[0] as Session;
          console.log('Сессия действительна, данные из массива обновлены в сторе:', session.value);
        } else {
          session.value = response.data as Session;
          console.log('Сессия действительна, данные обновлены в сторе:', session.value);
        }
        return true;
      } else {
        // Если нет CSRF-токена, сессия недействительна
        session.value = null;
        console.log('Сессия недействительна (нет CSRF-токена), очищена в сторе');
        return false;
      }
    } catch (err) {
      console.error('Ошибка при проверке сессии:', err);
      session.value = null;
      saveError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Экспортируем состояние и методы
  return {
    // Состояние
    session,
    csrfToken,
    loading,
    error,
    isAuthenticated,

    // Методы
    login,
    logout,
    clearLocalSessionData,
    checkSession,
    saveError,
    resetError,
  };
});
