// src/stores/types/authTypes.ts

// Интерфейс для данных авторизации
export interface AuthSessionData {
  username: string;
  password: string;
}

// Интерфейс для пользователя
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  last_login: string;
  date_joined: string;
  groups: any[];
}

// Интерфейс для сессии пользователя
export interface Session {
  id: string;
  url: string;
  session_key: string;
  expiry_date: string;
  username: string;
  user: User;
  last_login_backend: string | null;
  providers: any[];
  groups: any[];
  appconfig: Record<string, any>;
}

// Интерфейс для ошибки
export interface ApiErrorState {
  type: string;
  message: string;
  status: number;
  data: any;
}

// Интерфейс для состояния хранилища
export interface AuthState {
  session: Session | null;
  csrfToken: string | null; // CSRF-токен для защищенных запросов
  loading: boolean;
  error: ApiErrorState;
}
