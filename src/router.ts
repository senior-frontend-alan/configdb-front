// src/router.ts
import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  RouteLocationNormalized,
  NavigationGuardNext,
} from 'vue-router';
import { useConfig, extractModuleNameFromUrl } from './config-loader';
import { useAuthStore } from './stores/authStore';
import { useModuleStore } from './stores/module-factory';

const { config } = useConfig();

// маршрутизатор автоматически загружает данные каталога, а компоненты Page1CatalogList и Page2CatalogDetails просто отображают их
// роутер является источником информации о текущем moduleName
// В роутере координирующая функция, а в сторе оставить более атомарные методы для работы с данными.
// Защита маршрутов - проверка прав доступа
// Предзагрузка данных - координация загрузки данных перед отображением компонентов
// Обработка ошибок навигации - перенаправления при ошибках

// Роутер не должен отвечать за извлечение имени модуля из URL (это делает config-loader)
// Роутер должен быть источником текущего moduleName, но не логики его извлечения из конфигурации

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
  // Получаем moduleName напрямую из параметров маршрута
  const moduleName = to.params.moduleName as string;

  if (!moduleName) {
    console.error('Параметр moduleName не указан в маршруте');
    next('/');
    return;
  }

  // Проверяем, что moduleName соответствует имени модуля из URL getCatalog
  const module = config.value.modules.find((m) => {
    const extractedModuleName = extractModuleNameFromUrl(m.routes.getCatalog);
    return extractedModuleName === moduleName;
  });

  if (module) {
    next();
  } else {
    console.error(`Модуль с moduleName=${moduleName} не найден`);
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
    const moduleName = extractModuleNameFromUrl(module.routes.getCatalog);
    console.log(`Добавление дополнительных маршрутов для модуля: ${moduleName}`);

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

/**
 * Координирующая функция для загрузки данных каталога
 *
 * Процесс загрузки данных состоит из следующих шагов:
 * 1. Получение стора модуля по имени модуля
 * 2. Проверка наличия данных в кэше
 * 3. Загрузка каталога модуля, если он еще не загружен
 * 4. Поиск URL для загрузки деталей каталога
 * 5. Загрузка деталей каталога
 */
export const findAndLoadCatalogDetails = async (
  moduleName: string,
  viewname: string,
  next: (error?: any) => void,
  forceReload: boolean = false,
): Promise<boolean> => {
  // ШАГ 1: Получение стора модуля по имени модуля
  const moduleStore = useModuleStore(moduleName);
  if (!moduleStore) {
    const error = new Error(`Не удалось получить стор для модуля ${moduleName}`);
    console.error(error);
    next(error);
    return false;
  }

  try {
    // ШАГ 2: Проверка наличия данных в кэше
    if (!forceReload && moduleStore.hasCachedData(viewname)) {
      console.log(`Данные для ${viewname} уже загружены, используем кэш`);
      return true;
    }

    // ШАГ 3: Загрузка каталога модуля, если он еще не загружен
    if (!moduleStore.catalogGroups || moduleStore.catalogGroups.length === 0) {
      console.log(`Загрузка каталога для модуля ${moduleName}...`);
      await moduleStore.loadCatalog();
    }

    // ШАГ 4: Поиск URL для загрузки деталей каталога
    const href = moduleStore.findUrlInCatalog(viewname);
    if (!href) {
      const error = new Error(`URL для каталога ${viewname} не найден`);
      console.error(error);
      next(error);
      return false;
    }

    // ШАГ 5: Загрузка деталей каталога
    await moduleStore.loadCatalogDetails(viewname, href);
    console.log(`Детали каталога ${viewname} успешно загружены`);

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
      if (!moduleStore.catalogGroups || moduleStore.catalogGroups.length === 0) {
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
        if (moduleStore.catalogGroups && moduleStore.catalogGroups.length > 0) {
          const groupExists = moduleStore.catalogGroups.some(
            (group: any) => group.name === groupName,
          );
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
