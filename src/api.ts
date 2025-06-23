// настройка axios для всего приложения
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { useConfig } from './config-loader';
import { useAuthStore } from './stores/authStore';
import { ref } from 'vue';

// Создаем экземпляр axios с базовыми настройками
// Без зависимостей от конфигурации на уровне модуля
const api: AxiosInstance = axios.create({
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
export function setupApi(): void {
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

// Интерцепторы для обработки запросов
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Увеличиваем счетчик активных запросов
    activeRequests.value++;
    isLoading.value = true;

    return config;
  },
  (error: any) => {
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

// Функция для обновления счетчика запросов
const updateRequestCounter = () => {
  activeRequests.value = Math.max(0, activeRequests.value - 1);
  if (activeRequests.value === 0) {
    isLoading.value = false;
  }
};

// Интерцепторы для обработки ответов
api.interceptors.response.use(
  (response: AxiosResponse) => {
    updateRequestCounter();
    return response;
  },
  (error: any) => {
    updateRequestCounter();

    // Создаем информативный объект ошибки
    let message = 'Ошибка запроса';
    let status = 0;
    let data = null;

    if (error.response) {
      // Ошибка от сервера (статус не 2xx)
      status = error.response.status;
      data = error.response.data;
      
      // Проверяем наличие поля detail в ответе
      if (data && typeof data === 'object' && 'detail' in data) {
        message = String(data.detail);
      }
    } else if (error.request) {
      // Запрос был сделан, но ответ не получен
      message = 'Нет ответа от сервера';
      console.error('Нет ответа от сервера');
    } else {
      // Ошибка при настройке запроса
      message = error.message || 'Ошибка при настройке запроса';
      console.error('Ошибка при настройке запроса:', message);
    }

    return Promise.reject(new ApiError(message, status, data));
  },
);

export default api;
