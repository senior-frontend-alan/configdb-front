// src/utils/localstorage.ts
import type { Session } from '../stores/types/authStoreTypes';

// Переменная для хранения последнего известного CSRF токена из заголовка
let lastKnownCsrfToken = '';

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
 * Получение CSRF-токена из разных источников
 */
export function getCsrfToken(): string {
  // Сначала пробуем получить токен из cookie csrftoken
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  
  // Если нашли в cookie, сохраняем в localStorage и возвращаем
  if (cookieValue && cookieValue.length > 0) {
    console.log('Найден csrftoken в cookie:', cookieValue);
    saveCsrfToken(cookieValue);
    lastKnownCsrfToken = cookieValue; // Сохраняем в переменную
    return cookieValue;
  }
  
  // Проверяем последний известный токен из заголовка
  if (lastKnownCsrfToken && lastKnownCsrfToken.length > 0) {
    console.log('Используем последний известный CSRF токен из заголовка:', lastKnownCsrfToken);
    saveCsrfToken(lastKnownCsrfToken);
    return lastKnownCsrfToken;
  }
  
  // Если не нашли в cookie, пробуем взять из localStorage
  try {
    const token = localStorage.getItem(STORAGE_KEYS.CSRF_TOKEN);
    if (token && token.length > 0) {
      console.log('Используем CSRF-токен из localStorage:', token);
      lastKnownCsrfToken = token; // Сохраняем в переменную
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
      lastKnownCsrfToken = metaValue; // Сохраняем в переменную
      return metaValue;
    }
  }
  
  // Если токен не найден, возвращаем пустую строку
  console.log('Не удалось найти CSRF-токен, используем пустой токен');
  return '';
}

/**
 * Удаление сессионных cookie и токенов
 */
/**
 * Установка значения CSRF токена из заголовка
 */
export function setCsrfTokenFromHeader(token: string): void {
  if (token && token.length > 0) {
    console.log('Установлен CSRF токен из заголовка:', token);
    lastKnownCsrfToken = token;
    saveCsrfToken(token);
  }
}

export function clearSessionData(): void {
  try {
    // Удаляем из localStorage
    localStorage.removeItem(STORAGE_KEYS.CSRF_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    
    // Сбрасываем последний известный CSRF токен
    lastKnownCsrfToken = '';
    
    console.log('Данные сессии в localStorage удалены');
  } catch (error) {
    console.error('Ошибка при удалении данных сессии:', error);
  }
}
