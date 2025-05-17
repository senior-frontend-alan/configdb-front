// src/router.ts
import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  RouteLocationNormalized,
  NavigationGuardNext,
} from 'vue-router';
import { useConfig } from './config-loader';
import { useAuthStore } from './stores/authStore';
import { useModuleStore } from './stores/module-factory';

const { config } = useConfig();

// маршрутизатор автоматически загружает данные каталога, а компоненты Page1CatalogList и Page2CatalogDetails просто отображают их

// В роутере координирующая функция, а в сторе оставить более атомарные методы для работы с данными.
// Защита маршрутов - проверка прав доступа
// Предзагрузка данных - координация загрузки данных перед отображением компонентов
// Обработка ошибок навигации - перенаправления при ошибках

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

// Функция для проверки существования модуля с указанным moduleName
const validateModuleName = (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  // Проверяем, что moduleName соответствует viewname одного из модулей
  const moduleName = to.params.moduleName as string;
  const module = config.value.modules.find((m) => m.viewname === moduleName);
  if (module) {
    next();
  } else {
    console.error(`Модуль с viewname=${moduleName} не найден`);
    next('/');
  }
};

// Добавляем общие маршруты с динамическим сегментом :moduleName

// Страница 1 - Отображение списка справочников
routes.push({
  path: '/:moduleName',
  name: 'CatalogList',
  component: () => import('./pages/Page1CatalogList/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
  beforeEnter: validateModuleName,
});

// Страница 2 - Отображение деталей элемента каталога
routes.push({
  path: '/:moduleName/:viewname',
  name: 'CatalogDetails',
  component: () => import('./pages/Page2CatalogDetails/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
  beforeEnter: validateModuleName,
});

// Страница 3 - Редактирование записи
routes.push({
  path: '/:moduleName/:viewname/edit/:id',
  name: 'EditRecord',
  component: () => import('./pages/Page3EditRecord/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
  beforeEnter: validateModuleName,
});

// Добавляем дополнительные маршруты для модулей, если необходимо
try {
  config.value.modules.forEach((module) => {
    console.log(`Добавление дополнительных маршрутов для модуля: ${module.viewname}`);

    // Здесь можно добавить специфичные маршруты для конкретных модулей, если необходимо
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

// Координирующая функция для загрузки данных каталога
export const findAndLoadCatalogDetails = async (
  moduleName: string,
  viewname: string,
  next: (error?: any) => void,
  forceReload: boolean = false,
): Promise<boolean> => {
  const moduleStore = useModuleStore(moduleName);
  if (!moduleStore) {
    const error = new Error(`Не удалось получить стор для модуля ${moduleName}`);
    console.error(error);
    next(error);
    return false;
  }

  try {
    // Проверяем кэш, если не требуется принудительное обновление
    if (!forceReload && moduleStore.hasCachedData(viewname)) {
      console.log(`Данные для ${viewname} уже загружены, используем кэш`);
      return true;
    }

    // Загружаем каталог, если он еще не загружен
    if (!moduleStore.catalog || moduleStore.catalog.length === 0) {
      console.log(`Загрузка каталога для модуля ${moduleName}`);
      await moduleStore.loadCatalog();
    }

    // Ищем URL в каталоге
    const href = moduleStore.findUrlInCatalog(viewname);

    if (!href) {
      const error = new Error(`URL для каталога ${viewname} не найден`);
      console.error(error);
      next(error);
      return false;
    }

    // Загружаем данные каталога
    await moduleStore.loadCatalogDetails(viewname, href);
    return true;
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    next(error);
    return false;
  }
};

// Точка входа для загрузки данных любого маршрута
// Добавляем хук для предварительной загрузки данных
router.beforeResolve(async (to, _from, next) => {
  // Получаем moduleName из параметров маршрута
  // Теперь мы всегда можем получить moduleName из параметров маршрута,
  // так как все маршруты теперь имеют динамический сегмент :moduleName
  const moduleName = to.params.moduleName as string;

  if (moduleName) {
    try {
      // 1. Получаем стор модуля
      const moduleStore = useModuleStore(moduleName);
      if (!moduleStore) {
        console.error(`Не удалось получить стор для модуля ${moduleName}`);
        next();
        return;
      }

      // 2. Проверяем, загружен ли каталог, и загружаем его если нет
      if (!moduleStore.catalog || moduleStore.catalog.length === 0) {
        console.log(`Загрузка данных каталога для модуля ${moduleName}`);
        await moduleStore.loadCatalog();
      }

      // 3. Проверяем тип запроса
      if (to.params.viewname) {
        // Загрузка деталей каталога (viewname)
        const viewname = to.params.viewname as string;

        // Если данные не в кэше, загружаем их
        if (!moduleStore.hasCachedData(viewname)) {
          try {
            // Ищем URL в каталоге
            const href = moduleStore.findUrlInCatalog(viewname);
            if (href) {
              // Загружаем данные каталога
              await moduleStore.loadCatalogDetails(viewname, href);
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
          const groupExists = moduleStore.catalog.some((group: any) => group.name === groupName);
          if (!groupExists) {
            console.warn(`Группа ${groupName} не найдена в данных каталога модуля ${moduleName}`);
          }
        }
      }
    } catch (error) {
      console.error(`Ошибка при загрузке данных для маршрута:`, error);
      next();
      return;
    }
  }

  // Разрешаем переход
  next();
});

export default router;
