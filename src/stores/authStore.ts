// src/stores/authStore.ts
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import api from '../api';
import { useConfig } from '../config-loader';
import {
  loadSessionFromStorage,
  saveSessionToStorage,
  getCsrfToken,
  clearSessionData,
} from '../utils/localstorage';
import type { AuthSessionData, Session, ApiErrorState, AuthState } from './types/authStoreTypes';

// Начальное состояние хранилища
const initialState: AuthState = {
  session: loadSessionFromStorage(),
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
  const loading = ref(initialState.loading);
  const error = ref<ApiErrorState>(initialState.error);

  const isAuthenticated = computed(() => !!session.value?.id);

  // Отслеживание изменений сессии для сохранения в localStorage
  watch(
    session,
    (newSession) => {
      saveSessionToStorage(newSession);
    },
    { deep: true },
  );

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
    error.value = JSON.parse(JSON.stringify(initialState.error));
    const { config } = useConfig();

    try {
      if (!config.value) {
        throw new Error('Конфигурация не загружена');
      }

      const loginUrl = config.value?.appConfig?.routes?.apiSession;

      console.log(`Используем URL для авторизации: ${loginUrl}`);

      // Отправляем запрос на аутентификацию в Django
      const response = await api.post(loginUrl, authData, {
        headers: {
          'X-CSRFToken': getCsrfToken(),
        },
        withCredentials: true, // Важно для работы с сессиями Django
      });

      session.value = response.data;
      return true;
    } catch (err) {
      console.error('Ошибка!!!:', err);
      saveError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Выход из системы
   */
  async function logout(): Promise<boolean> {
    loading.value = true;
    error.value = JSON.parse(JSON.stringify(initialState.error));

    try {
      // Получаем CSRF токен для запроса
      const csrfToken = getCsrfToken();

      // Проверяем, что сессия существует
      if (!session.value || !session.value.session_key) {
        console.warn('Невозможно выйти: нет активной сессии');
        return false;
      }

      // Получаем базовый URL для сессии из конфигурации
      const { config } = useConfig();
      const baseSessionUrl = config.value?.appConfig?.routes?.apiSession;

      // Формируем полный URL с ID сессии и параметром mode=short
      // http://localhost:5173/api/v1/session/rkijjeex5chslvj7v1q5gf8tur2i1usu/?mode=short
      const sessionUrl = `${baseSessionUrl}${session.value.session_key}/?mode=short`;
      console.log('Отправляем запрос на выход по адресу:', sessionUrl);

      // Отправляем запрос на выход в Django
      await api.delete(sessionUrl, {
        headers: {
          'X-CSRFToken': csrfToken,
        },
        withCredentials: true,
      });

      // Удаляем данные сессии из localStorage
      clearSessionData();

      // Очищаем сессию в хранилище
      session.value = null;

      // Дополнительный запрос на получение нового CSRF токена
      // Это поможет сбросить сессию на сервере
      try {
        await api.get('/api/v1/csrf/', {
          withCredentials: true,
        });
      } catch (csrfErr) {
        console.log('Не удалось получить новый CSRF токен, но это не критично:', csrfErr);
      }

      return true;
    } catch (err) {
      console.error('Ошибка при выходе из системы:', err);
      saveError(err);

      // Даже в случае ошибки удаляем данные сессии из localStorage
      clearSessionData();
      session.value = null;

      // Пробуем получить новый CSRF токен даже в случае ошибки
      try {
        await api.get('/api/v1/csrf/', {
          withCredentials: true,
        });
      } catch (csrfErr) {
        console.log('Не удалось получить новый CSRF токен после ошибки:', csrfErr);
      }

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
    error.value = JSON.parse(JSON.stringify(initialState.error));

    try {
      const response = await api.get('/api/v1/session/', {
        withCredentials: true,
      });

      if (response.data && response.data.id) {
        session.value = response.data;
        return true;
      } else {
        session.value = null;
        return false;
      }
    } catch (err) {
      session.value = null;
      saveError(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Очистка ошибки
   */
  function clearError(): void {
    // Используем начальное состояние для ошибки
    error.value = JSON.parse(JSON.stringify(initialState.error));
  }

  /**
   * Сброс состояния хранилища к начальному
   */
  function resetState(): void {
    session.value = initialState.session;
    loading.value = initialState.loading;
    error.value = JSON.parse(JSON.stringify(initialState.error));
  }

  // Инициализация: проверяем сессию только если уже есть данные в localStorage
  if (session.value) {
    console.log('Сессия загружена из localStorage:', session.value);
    // Можно добавить проверку сессии на сервере
    // checkSession();
  }

  // Экспортируем состояние и методы
  return {
    // Состояние
    session,
    loading,
    error,

    // Геттеры
    isAuthenticated,

    // Методы
    login,
    logout,
    checkSession,
    clearError,
    saveError,
    resetState,
  };
});
