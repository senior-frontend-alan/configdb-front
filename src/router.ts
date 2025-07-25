// src/router.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from './stores/authStore';

// Маршрутизатор → Стор → Компоненты

// 1. Маршрутизатор (Vue Router)
// Отвечает за: Инициирование загрузки данных при переходе на страницу
// Задачи:
// Определение необходимых данных для текущего маршрута
// Блокирование перехода до загрузки критических данных (при необходимости)

// После загрузки данных (или при ошибке) роутер продолжает навигацию

// Защита маршрутов - проверка прав доступа
// Обработка ошибок навигации - перенаправления при ошибках

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
});

// Страница 1 добавлением applName - Отображение списка справочников только с выбранным applName
routes.push({
  path: '/:moduleName/:applName',
  name: 'CatalogListByApplName',
  component: () => import('./pages/Page1CatalogList/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
});

// Страница 2 - Отображение деталей элемента каталога
routes.push({
  path: '/:moduleName/:applName/:catalogName',
  name: 'CatalogDetails',
  component: () => import('./pages/Page2CatalogDetails/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
});

// Страница 3 - Редактирование записи
routes.push({
  path: '/:moduleName/:applName/:catalogName/edit/:id',
  name: 'EditRecord',
  component: () => import('./pages/Page3EditRecord/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
});

// Страница 3 - Добавление новой записи
routes.push({
  path: '/:moduleName/:applName/:catalogName/add',
  name: 'AddRecord',
  component: () => import('./pages/Page3EditRecord/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
});

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// beforeEnter не вызывается при каждой навигации
// Vue Router оптимизирует навигацию:
// переход с /catalog1 на /inventory считается переходом между
// одинаковыми маршрутами (/:moduleName), только с разными параметрами
// Vue Router по умолчанию повторно использует экземпляр компонента при изменении только параметров маршрута
// компонент не пересоздается, а его хуки жизненного цикла не вызываются заново
// Защитники маршрута beforeEnter вызываются только при первоначальном переходе на маршрут
// При изменении только параметров маршрута защитники не вызываются повторно

// Для загрузки данных раньше использовался ensureHierarchyLoaded из module-factory.ts
// Эта функция обеспечивает иерархическую загрузку данных: модуль -> каталог -> запись
// В зависимости от переданных параметров загружает только необходимые уровни иерархии:
// - ensureHierarchyLoaded(moduleName) - загружает только модуль
// - ensureHierarchyLoaded(moduleName, catalogName) - загружает модуль и каталог
// - ensureHierarchyLoaded(moduleName, catalogName, recordId) - загружает модуль, каталог и конкретную запись

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
