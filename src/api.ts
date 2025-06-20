// настройка axios для всего приложения
import axios from 'axios';
import { useConfig } from './config-loader';
import { ref } from 'vue';
import { setCsrfTokenFromHeader, getCsrfToken } from './utils/localstorage';

// Создаем экземпляр axios с базовыми настройками
// Без зависимостей от конфигурации на уровне модуля
const api = axios.create({
  // Устанавливаем пустой baseURL, чтобы запросы проходили через прокси Vite
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  // Устанавливаем стандартный таймаут, который будет обновлен после загрузки конфигурации
  timeout: 10000, // 10 секунд по умолчанию
  // Включаем куки для всех запросов по умолчанию
  withCredentials: true,
});

/**
 * Функция для настройки API с использованием загруженной конфигурации
 * Должна быть вызвана после успешной загрузки конфигурации
 */
export function setupApi() {
  const { config } = useConfig();

  if (!config.value) {
    console.error('Невозможно настроить API: конфигурация не загружена');
    return;
  }

  // Настраиваем таймаут из конфигурации
  api.defaults.timeout = config.value.appConfig.apiRetryTimeoutMs;
  console.log('API таймаут установлен:', api.defaults.timeout, 'мс');
}

// Состояние загрузки для отображения индикатора прогресса
export const isLoading = ref(false);

// Счетчик активных запросов
const activeRequests = ref(0);

// Функция для создания искусственной задержки
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Интерцепторы для обработки запросов
api.interceptors.request.use(
  async (config) => {
    // Добавляем токен авторизации, если он есть
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Добавляем CSRF-токен в заголовки
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    // Увеличиваем счетчик активных запросов
    activeRequests.value++;
    isLoading.value = true;

    // Добавляем искусственную задержку в 2 секунды
    // await delay(2000);

    return config;
  },
  (error) => {
    // Уменьшаем счетчик в случае ошибки
    activeRequests.value = Math.max(0, activeRequests.value - 1);
    if (activeRequests.value === 0) {
      isLoading.value = false;
    }
    return Promise.reject(error);
  },
);

// Создаем класс для API ошибок с дополнительной информацией
export class ApiError extends Error {
  status?: number;
  data?: any;
  type: string = 'ApiError';

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Интерцепторы для обработки ответов
api.interceptors.response.use(
  (response) => {
    // Уменьшаем счетчик при получении ответа
    activeRequests.value = Math.max(0, activeRequests.value - 1);
    if (activeRequests.value === 0) {
      isLoading.value = false;
    }

    // Сохраняем CSRF токен из заголовка ответа, если он есть
    const csrfToken = response.headers['x-csrftoken'];
    if (csrfToken) {
      console.log('Получен CSRF токен из заголовка ответа:', csrfToken);
      setCsrfTokenFromHeader(csrfToken);
    }

    return response;
  },
  (error) => {
    // Уменьшаем счетчик в случае ошибки
    activeRequests.value = Math.max(0, activeRequests.value - 1);
    if (activeRequests.value === 0) {
      isLoading.value = false;
    }

    // Создаем информативный объект ошибки
    let apiError: ApiError;

    if (error.response) {
      // Ошибка от сервера (статус не 2xx)
      const status = error.response.status;
      const data = error.response.data;

      // Проверяем наличие поля detail в ответе
      let errorMessage = 'Ошибка запроса';
      if (data && typeof data === 'object' && 'detail' in data) {
        errorMessage = String(data.detail);
      }

      apiError = new ApiError(errorMessage, status, data);
    } else if (error.request) {
      // Запрос был сделан, но ответ не получен
      apiError = new ApiError('Нет ответа от сервера');
      console.error('Нет ответа от сервера.');
    } else {
      // Что-то пошло не так при настройке запроса
      apiError = new ApiError(error.message || 'Ошибка при настройке запроса');
      console.error('Ошибка при настройке запроса:', error.message);
    }

    // Заменяем оригинальную ошибку на нашу ApiError
    return Promise.reject(apiError);
  },
);

export default api;
