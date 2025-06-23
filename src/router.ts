// src/router.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from './stores/authStore';
import { ensureHierarchyLoaded } from './stores/module-factory';

// Маршрутизатор → Стор → Компоненты

// 1. Маршрутизатор (Vue Router)
// Отвечает за: Инициирование загрузки данных при переходе на страницу
// Задачи:
// Определение необходимых данных для текущего маршрута
// Блокирование перехода до загрузки критических данных (при необходимости)

// После загрузки данных (или при ошибке) роутер продолжает навигацию

// Защита маршрутов - проверка прав доступа
// Обработка ошибок навигации - перенаправления при ошибках

// Роутер не должен отвечать за извлечение имени модуля из URL (это делает config-loader)
// Пользователь остается на том же URL, который он ввел, даже если возникла ошибка
// компоненты могут обрабатывать ситуации, когда данные не загружены

// Базовые маршруты
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./pages/HomePage.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('./pages/LoginPage.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('./pages/SettingsPage.vue'),
  },
  {
    path: '/widgets',
    name: 'ExampleWidgets',
    component: () => import('./pages/ExampleWidgetPage.vue'),
  },
];

// Добавляем общие маршруты с динамическим сегментом :moduleName

// Страница 1 - Отображение списка справочников
routes.push({
  path: '/:moduleName',
  name: 'CatalogList',
  component: () => import('./pages/Page1CatalogList/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
  beforeEnter: async (to, _from, next) => {
    const moduleName = to.params.moduleName as string;

    if (!moduleName) {
      console.error('Параметр moduleName не указан в маршруте');
      next('/');
      return;
    }

    // Загружаем данные модуля через единую функцию
    console.log(`Загрузка данных для модуля: ${moduleName}`);

    try {
      const success = await ensureHierarchyLoaded(moduleName);
      if (!success) {
        console.error(`Не удалось загрузить модуль ${moduleName}`);
      }
    } catch (error) {
      console.error('Неожиданная ошибка при загрузке модуля:', error);
    } finally {
      next(); // Продолжаем навигацию в любом случае
    }
  },
});

// Страница 2 - Отображение деталей элемента каталога
routes.push({
  path: '/:moduleName/:catalogName',
  name: 'CatalogDetails',
  component: () => import('./pages/Page2CatalogDetails/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
  beforeEnter: async (to, _from, next) => {
    const moduleName = to.params.moduleName as string;
    const catalogName = to.params.catalogName as string;

    console.log(`Загрузка данных каталога: ${moduleName}/${catalogName}`);

    try {
      const success = await ensureHierarchyLoaded(moduleName, catalogName);
      if (!success) {
        console.error(`Не удалось загрузить каталог ${catalogName}`);
      }
    } catch (error) {
      console.error('Неожиданная ошибка при загрузке каталога:', error);
    } finally {
      next(); // Продолжаем навигацию в любом случае
    }
  },
});

// Страница 3 - Редактирование записи
routes.push({
  path: '/:moduleName/:catalogName/edit/:id',
  name: 'EditRecord',
  component: () => import('./pages/Page3EditRecord/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props,
  beforeEnter: async (to, _from, next) => {
    const moduleName = to.params.moduleName as string;
    const catalogName = to.params.catalogName as string;
    const recordId = to.params.id as string;

    console.log(`Загрузка данных записи: ${moduleName}/${catalogName}/${recordId}`);

    try {
      const success = await ensureHierarchyLoaded(moduleName, catalogName, recordId);
      if (!success) {
        console.error(`Не удалось загрузить запись ${recordId}`);
      }
    } catch (error) {
      console.error('Неожиданная ошибка при загрузке записи:', error);
    } finally {
      next(); // Продолжаем навигацию в любом случае
    }
  },
});

// Страница 3 - Добавление новой записи
routes.push({
  path: '/:moduleName/:catalogName/add',
  name: 'AddRecord',
  component: () => import('./pages/Page3EditRecord/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
  beforeEnter: async (to, _from, next) => {
    const moduleName = to.params.moduleName as string;
    const catalogName = to.params.catalogName as string;

    console.log(`Подготовка к добавлению новой записи: ${moduleName}/${catalogName}`);

    try {
      // Загружаем только иерархию модуля и каталога, без записи
      const success = await ensureHierarchyLoaded(moduleName, catalogName);
      if (!success) {
        console.error(`Не удалось загрузить иерархию для ${moduleName}/${catalogName}`);
      }
    } catch (error) {
      console.error('Неожиданная ошибка при подготовке к добавлению записи:', error);
    } finally {
      next(); // Продолжаем навигацию в любом случае
    }
  },
});

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Для загрузки данных используйте ensureHierarchyLoaded из module-factory.ts
// Эта функция обеспечивает иерархическую загрузку данных: модуль -> каталог -> запись
// В зависимости от переданных параметров загружает только необходимые уровни иерархии:
// - ensureHierarchyLoaded(moduleName) - загружает только модуль
// - ensureHierarchyLoaded(moduleName, catalogName) - загружает модуль и каталог
// - ensureHierarchyLoaded(moduleName, catalogName, recordId) - загружает всю иерархию

// Для загрузки связанных данных для вложенных компонентов используйте отдельную функцию в компоненте

// Маршруты, которые доступны без авторизации
const publicRoutes = ['/login'];

// Функция для инициализации проверки сессии при запуске приложения
export async function initializeAuth() {
  const authStore = useAuthStore();

  try {
    console.log('Инициализация приложения: проверка сессии');
    const isSessionValid = await authStore.checkSession();
    console.log('Проверка сессии завершена, статус аутентификации:', authStore.isAuthenticated);

    // Если сессия недействительна и текущий маршрут не в списке публичных
    const currentPath = window.location.pathname;
    if (!isSessionValid && !publicRoutes.includes(currentPath)) {
      console.log('Сессия недействительна, перенаправление на страницу входа');
      router.push('/login');
      return false;
    }

    return isSessionValid;
  } catch (error) {
    console.error('Ошибка при инициализации проверки сессии:', error);

    // В случае ошибки также перенаправляем на страницу входа
    const currentPath = window.location.pathname;
    if (!publicRoutes.includes(currentPath)) {
      router.push('/login');
    }
    return false;
  }
}

export default router;
