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

// Динамическое добавление маршрутов для модулей
try {
  config.value.modules.forEach((module) => {
    console.log(`Добавление маршрутов для модуля: ${module.id}`);

    // Функция для безопасного импорта компонентов если компонент не найден
    const safeImport = (path: string) => {
      return () =>
        import(path).catch((error: Error) => {
          console.error(`Ошибка загрузки компонента: ${path}`, error);
          return import('./App.vue'); // Запасной вариант
        });
    };

    // Страница 1 - Отображение списка справочников
    routes.push({
      path: `/${module.id}`,
      name: `${module.id}Catalog`,
      component: () => import('./pages/Page1CatalogList/index.vue'),
      meta: {
        moduleId: module.id, // Всегда знаем какой модуль открыт на странице чтобы найти его стор
      },
    });

    // Страница 2 - Отображение деталей элемента каталога
    routes.push({
      path: `/${module.id}/:viewname`,
      name: `${module.id}CatalogDetails`,
      component: () => import('./pages/Page2CatalogDetails/index.vue'),
      meta: {
        moduleId: module.id, // Передаем ID модуля для доступа к стору
      },
      props: true, // Передаем параметры маршрута как props компонента
    });

    // Страница 3 - Редактирование записи
    routes.push({
      path: `/${module.id}/:viewname/edit/:id`,
      name: `${module.id}EditRecord`,
      component: () => import('./pages/Page3EditRecord/index.vue'),
      meta: {
        moduleId: module.id, // Передаем ID модуля для доступа к стору
      },
      props: true, // Передаем параметры маршрута как props компонента
    });
  });
} catch (error) {
  console.error('Ошибка при создании динамических маршрутов:', error);
}

const router = createRouter({
  history: createWebHistory(),
  routes,
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

// Экспортируем функции для работы с данными каталога
export const checkCachedCatalogData = (moduleId: string, viewname: string): boolean => {
  const moduleStore = useModuleStore(moduleId);
  if (!moduleStore) {
    console.error(`Не удалось получить стор для модуля ${moduleId}`);
    return false;
  }

  const cachedData = moduleStore.catalogDetails[viewname];
  if (cachedData && cachedData.GET && cachedData.GET.results) {
    console.log(`Роутер: используем кэшированные данные для ${viewname}`);
    return true;
  }
  return false;
};

export const loadCatalogData = async (
  moduleId: string,
  viewname: string,
  href: string,
): Promise<void> => {
  const moduleStore = useModuleStore(moduleId);
  if (!moduleStore) {
    throw new Error(`Не удалось получить стор для модуля ${moduleId}`);
  }

  console.log(`Роутер: загрузка данных для ${viewname}`);
  await moduleStore.loadCatalogDetails(viewname, href);
};

export const findAndLoadCatalogData = async (
  moduleId: string,
  viewname: string,
  next: (error?: any) => void,
  forceReload: boolean = false,
): Promise<boolean> => {
  const moduleStore = useModuleStore(moduleId);
  if (!moduleStore) {
    const error = new Error(`Не удалось получить стор для модуля ${moduleId}`);
    console.error(error);
    next(error);
    return false;
  }

  try {
    // Проверяем кэш, если не требуется принудительное обновление
    if (!forceReload && checkCachedCatalogData(moduleId, viewname)) {
      return true;
    }

    // Ищем URL в каталоге
    const href = await moduleStore.findCatalogItemUrl(viewname);

    if (!href) {
      const error = new Error(`URL для каталога ${viewname} не найден`);
      console.error(error);
      next(error);
      return false;
    }

    // Загружаем данные каталога
    await loadCatalogData(moduleId, viewname, href);
    return true;
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    next(error);
    return false;
  }
};

// Точка входа для загрузки данных любого маршрута
// Добавляем хук для предварительной загрузки данных
router.beforeResolve(async (to, from, next) => {
  // Проверяем, есть ли в маршруте moduleId
  if (to.meta.moduleId) {
    const moduleId = to.meta.moduleId as string;
    
    try {
      // 1. Получаем стор модуля
      const moduleStore = useModuleStore(moduleId);
      if (!moduleStore) {
        console.error(`Не удалось получить стор для модуля ${moduleId}`);
        next();
        return;
      }
      
      // 2. Проверяем, загружен ли каталог, и загружаем его если нет
      if (!moduleStore.catalog || moduleStore.catalog.length === 0) {
        console.log(`Загрузка данных каталога для модуля ${moduleId}`);
        await moduleStore.getCatalog();
      }
      
      // 3. Проверяем тип запроса
      if (to.params.viewname) {
        // Загрузка деталей каталога (viewname)
        const viewname = to.params.viewname as string;
        
        // Если данные не в кэше, загружаем их
        if (!checkCachedCatalogData(moduleId, viewname)) {
          try {
            // Ищем URL в каталоге
            const href = await moduleStore.findCatalogItemUrl(viewname);
            if (href) {
              // Загружаем данные каталога
              await loadCatalogData(moduleId, viewname, href);
            } else {
              console.error(`URL для каталога ${viewname} не найден`);
            }
          } catch (error) {
            console.error(`Ошибка при загрузке деталей каталога ${viewname}:`, error);
          }
        }
      } else if (to.query.group) {
        // Проверка группы, если она указана
        const groupName = to.query.group as string;
        if (moduleStore.catalog && moduleStore.catalog.length > 0) {
          const groupExists = moduleStore.catalog.some((group) => group.name === groupName);
          if (!groupExists) {
            console.warn(`Группа ${groupName} не найдена в данных каталога модуля ${moduleId}`);
          }
        }
      }
      
      // Продолжаем навигацию
      next();
    } catch (error) {
      console.error(`Ошибка при загрузке данных для модуля ${moduleId}:`, error);
      next();
    }
  }
  
  // Для всех остальных маршрутов просто продолжаем навигацию
  next();
});

export default router;
