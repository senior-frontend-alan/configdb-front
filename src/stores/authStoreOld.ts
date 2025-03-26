// src/stores/authStore.ts
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import api from '../api';

export interface AuthSessionData {
  username: string;
  password: string;
}

export interface Session {
  id: string | number;
  username: string;
  // другие поля сессии
}

// Функция для загрузки состояния из localStorage
function loadSessionFromStorage(): Session | null {
  try {
    const savedSession = localStorage.getItem('auth_session');
    if (savedSession) {
      return JSON.parse(savedSession);
    }
  } catch (e) {
    console.error('Ошибка при загрузке сессии из localStorage:', e);
  }
  return null;
}

// Функция для сохранения состояния в localStorage
function saveSessionToStorage(session: Session | null): void {
  try {
    if (session) {
      localStorage.setItem('auth_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('auth_session');
    }
  } catch (e) {
    console.error('Ошибка при сохранении сессии в localStorage:', e);
  }
}

export const useAuthStore = defineStore('auth', () => {
  // Состояние
  const session = ref<Session | null>(loadSessionFromStorage());
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const ssoBackends = ref<any[]>([]);
  const transaction = ref<any | null>(null);
  
  // Следим за изменениями сессии и сохраняем в localStorage
  watch(session, (newSession) => {
    saveSessionToStorage(newSession);
  }, { deep: true });
  
  // Геттеры
  const isAuthenticated = computed(() => !!session.value?.id);
  const isLocalAuthAllowed = computed(() => true); // Логику можно изменить в зависимости от требований
  
  // Действия
  async function login(authData: AuthSessionData): Promise<boolean> {
    loading.value = true;
    error.value = null;
    
    try {
      // Django использует CSRF-токен для защиты форм
      // Получаем CSRF-токен из cookie
      const csrftoken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
      
      // Отправляем запрос на аутентификацию в Django
      const response = await api.post('/api/v1/auth/login/', authData, {
        headers: {
          'X-CSRFToken': csrftoken || ''
        },
        withCredentials: true // Важно для работы с сессиями Django
      });
      
      session.value = response.data;
      // Сохраняем сессию в localStorage
      saveSessionToStorage(session.value);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  async function logout(): Promise<boolean> {
    loading.value = true;
    error.value = null;
    
    try {
      // Django использует CSRF-токен для защиты форм
      const csrftoken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
      
      // Отправляем запрос на выход в Django
      await api.post('/api/v1/auth/logout/', {}, {
        headers: {
          'X-CSRFToken': csrftoken || ''
        },
        withCredentials: true
      });
      
      session.value = null;
      transaction.value = null;
      // Удаляем сессию из localStorage
      localStorage.removeItem('auth_session');
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  async function logoutSSO(): Promise<boolean> {
    loading.value = true;
    error.value = null;
    
    try {
      await api.post('/api/auth/logout-sso');
      session.value = null;
      transaction.value = null;
      // Удаляем сессию из localStorage
      localStorage.removeItem('auth_session');
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  async function fetchSSOBackends(): Promise<boolean> {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get('/api/auth/sso-backends');
      ssoBackends.value = response.data;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  async function setTransaction(id: string | number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/api/audit/transaction', { id });
      transaction.value = response.data;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  async function resetTransaction(): Promise<boolean> {
    loading.value = true;
    error.value = null;
    
    try {
      await api.delete('/api/audit/transaction');
      transaction.value = null;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  // Инициализация - загрузка данных при создании стора
  async function init() {
    // Проверяем, авторизован ли пользователь
    try {
      // В Django можно проверить текущую сессию
      const response = await api.get('/api/v1/session/', {
        withCredentials: true // Важно для работы с сессиями Django
      });
      
      // Проверяем, есть ли данные о пользователе
      if (response.data && response.data.user) {
        session.value = {
          id: response.data.user.id,
          username: response.data.user.username,
          // Другие поля пользователя
        };
        
        if (isAuthenticated.value) {
          await fetchSSOBackends();
          // Загружаем транзакцию, если пользователь авторизован
          const txResponse = await api.get('/api/v1/auditTransaction/');
          transaction.value = txResponse.data?.state === 2 ? txResponse.data : null;
        }
      }
    } catch (err: any) {
      // Если получаем 401 или 403, значит пользователь не авторизован
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        session.value = null;
      } else {
        error.value = err instanceof Error ? err : new Error(String(err));
      }
    }
  }
  
  // Вызываем инициализацию при создании стора, только если сессия не загружена из localStorage
  if (!session.value) {
    init();
  } else {
    console.log('Сессия загружена из localStorage:', session.value);
  }
  
  // Функция для очистки ошибки
  function clearError() {
    error.value = null;
  }

  return {
    // Состояние
    session,
    loading,
    error,
    ssoBackends,
    transaction,
    
    // Геттеры
    isAuthenticated,
    isLocalAuthAllowed,
    
    // Действия
    login,
    logout,
    logoutSSO,
    fetchSSOBackends,
    setTransaction,
    resetTransaction,
    clearError,
    init
  };
});