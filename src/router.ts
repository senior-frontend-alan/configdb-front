// src/router.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useConfig } from './config-loader';
import { useAuthStore } from './stores/authStore';

const { config } = useConfig();

// Базовые маршруты
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./pages/HomePage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('./pages/LoginPage.vue')
  },
  {
    path: '/widgets',
    name: 'ExampleWidgets',
    component: () => import('./pages/ExampleWidgetPage.vue')
  }
];

// Динамическое добавление маршрутов для модулей
try {
  config.value.modules.forEach(module => {
    console.log(`Добавление маршрутов для модуля: ${module.id}`);
    
    // Функция для безопасного импорта компонентов если компонент не найден
    const safeImport = (path: string) => {
      return () => import(path).catch((error: Error) => {
        console.error(`Ошибка загрузки компонента: ${path}`, error);
        return import('./App.vue'); // Запасной вариант
      });
    };
    
    // Страница 1 - Отображение списка справочников
    routes.push({
      path: `/${module.id}`,
      name: `${module.id}Catalog`,
      component: () => import('./pages/Page1CatalogList.vue'),
      meta: {
        moduleId: module.id // Всегда знаем какой модуль открыт на странице чтобы найти его стор
      }
    });
    
  });
} catch (error) {
  console.error('Ошибка при создании динамических маршрутов:', error);
}

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Маршруты, которые доступны без авторизации
const publicRoutes = ['/login'];

// Проверка авторизации перед каждым переходом
router.beforeEach((to, _, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  
  // Если пользователь не авторизован и пытается попасть на защищенный маршрут
  if (!isAuthenticated && !publicRoutes.includes(to.path)) {
    console.log('Пользователь не авторизован, перенаправление на страницу входа');
    next('/login');
  } else {
    // Если пользователь авторизован и пытается попасть на страницу входа
    if (isAuthenticated && to.path === '/login') {
      console.log('Пользователь авторизован и переходит на /login - выполняем разлогинивание');
      // Выполняем разлогинивание
      authStore.logout().finally(() => {
        // После разлогинивания разрешаем переход на страницу входа
        next();
      });
    } else {
      // В остальных случаях разрешаем переход
      next();
    }
  }
});

export default router;