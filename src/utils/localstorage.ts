// src/utils/localstorage.ts
import type { Session } from '../stores/types/authStoreTypes';

/**
 * Ключи для хранения данных в localStorage
 */
export const STORAGE_KEYS = {
  AUTH_SESSION: 'auth_session',
  CSRF_TOKEN: 'csrf_token'
};

/**
 * Загрузка сессии из localStorage
 */
export function loadSessionFromStorage(): Session | null {
  try {
    const savedSession = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (savedSession) {
      return JSON.parse(savedSession);
    }
  } catch (e) {
    console.error('Ошибка при загрузке сессии из localStorage:', e);
  }
  return null;
}

/**
 * Сохранение сессии в localStorage
 */
export function saveSessionToStorage(session: Session | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  } catch (e) {
    console.error('Ошибка при сохранении сессии в localStorage:', e);
  }
}

/**
 * Сохранение CSRF-токена в localStorage
 */
export function saveCsrfToken(token: string): void {
  try {
    if (token && token.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CSRF_TOKEN, token);
      console.log('Сохранен CSRF-токен в localStorage');
    }
  } catch (e) {
    console.error('Ошибка при сохранении CSRF-токена в localStorage:', e);
  }
}

/**
 * Получение CSRF-токена из cookie и localStorage
 */
export function getCsrfToken(): string {
  // Сначала пробуем получить токен из cookie csrftoken
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  
  console.log('Все cookie:', document.cookie);
  console.log('Найденный csrftoken в cookie:', cookieValue);
  
  if (cookieValue && cookieValue.length > 0) {
    // Если нашли в cookie, сохраняем в localStorage и возвращаем
    saveCsrfToken(cookieValue);
    return cookieValue;
  }
  
  // Если не нашли в cookie, пробуем взять из localStorage
  try {
    const token = localStorage.getItem(STORAGE_KEYS.CSRF_TOKEN);
    if (token && token.length > 0) {
      console.log('Используем CSRF-токен из localStorage:', token);
      return token;
    }
  } catch (e) {
    console.error('Ошибка при получении CSRF-токена из localStorage:', e);
  }
  
  // Пробуем получить токен из мета-тега (Django часто добавляет его в HTML)
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag && metaTag.getAttribute('content')) {
    const metaValue = metaTag.getAttribute('content');
    if (metaValue && metaValue.length > 0) {
      console.log('Найден CSRF-токен в meta-теге:', metaValue);
      saveCsrfToken(metaValue);
      return metaValue;
    }
  }
  
  console.error('Не удалось получить CSRF-токен ни из cookie, ни из localStorage, ни из meta-тега');
  return '';
}
