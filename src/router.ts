// src/router.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useConfig } from './config-loader';
import { useAuthStore } from './stores/authStore';
import { useModuleStore } from './stores/module-factory';

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
    path: '/settings',
    name: 'Settings',
    component: () => import('./pages/SettingsPage.vue')
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
    
    // Страница 2 - Отображение деталей элемента каталога
    routes.push({
      path: `/${module.id}/:viewname`,
      name: `${module.id}CatalogDetails`,
      component: () => import('./pages/Page2CatalogDetails.vue'),
      meta: {
        moduleId: module.id // Передаем ID модуля для доступа к стору
      },
      props: true // Передаем параметры маршрута как props компонента
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

// Загрузка данных перед разрешением перехода
router.beforeResolve(async (to, _from, next) => {
  try {
    // Проверяем наличие moduleId в метаданных маршрута
    if (to.meta.moduleId) {
      const moduleId = to.meta.moduleId as string;
      
      // Проверяем существование стора с соответствующим ID
      const moduleStore = useModuleStore(moduleId);
      
      if (moduleStore) {
        // Если стор существует, загружаем данные каталога
        console.log(`Загрузка данных каталога для модуля ${moduleId}`);
        await moduleStore.getCatalog();
        
        // Проверяем, если это маршрут деталей каталога (/:viewname)
        if (to.params.viewname) {
          const viewname = to.params.viewname as string;
          console.log(`Обнаружен параметр viewname: ${viewname}`);
          
          // Проверяем, есть ли данные в сторе для этого viewname
          if (!moduleStore.catalogDetails[viewname]) {
            // Ищем элемент в каталоге с соответствующим viewname
            const catalogItem = moduleStore.catalog
              .flatMap((group: { items?: any[] }) => group.items || [])
              .find((item: { viewname: string; href?: string }) => item.viewname === viewname);
            
            if (catalogItem && catalogItem.href) {
              console.log(`Загрузка данных для ${viewname} по ссылке: ${catalogItem.href}`);
              try {
                // Загружаем данные по URL и сохраняем их в стор
                await moduleStore.loadCatalogDetails(viewname, catalogItem.href);
                console.log(`Данные успешно загружены для ${viewname}`);
              } catch (loadError) {
                console.error(`Ошибка при загрузке данных для ${viewname}:`, loadError);
              }
            } else {
              console.warn(`Не найден элемент каталога для viewname: ${viewname}`);
            }
          } else {
            console.log(`Данные для ${viewname} уже загружены в стор`);
          }
        }
      } else {
        console.error(`Не удалось получить стор для модуля ${moduleId}`);
      }
    }
    
    // В любом случае разрешаем переход
    next();
  } catch (error) {
    console.error(`Ошибка при загрузке данных:`, error);
    // В случае ошибки всё равно разрешаем переход, ошибка будет обработана на странице
    next();
  }
});

export default router;