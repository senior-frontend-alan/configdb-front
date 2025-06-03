// src/router.ts
import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  RouteLocationNormalized,
  NavigationGuardNext,
} from 'vue-router';
import { useModuleStore } from './stores/module-factory';
import { useConfig, parseBackendApiUrl } from './config-loader';
import { useAuthStore } from './stores/authStore';

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

  // Проверяем, что модуль существует в конфигурации
  const module = config.value.modules.find((m) => {
    const extractedModuleName = parseBackendApiUrl(m.routes.getCatalog).moduleName;
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
  path: '/:moduleName/:catalogName',
  name: 'CatalogDetails',
  component: () => import('./pages/Page2CatalogDetails/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
  beforeEnter: validateModuleName,
});

// Страница 3 - Редактирование записи
routes.push({
  path: '/:moduleName/:catalogName/edit/:id',
  name: 'EditRecord',
  component: () => import('./pages/Page3EditRecord/index.vue'),
  props: true, // Автоматически передаем параметры маршрута как props
  beforeEnter: (to, from, next) => {
    const moduleName = to.params.moduleName as string;
    const catalogName = to.params.catalogName as string;
    const recordId = to.params.id as string;

    console.log(
      `Защитник маршрута для редактирования записи: ${moduleName}, ${catalogName}, ${recordId}`,
    );

    // Сначала проверяем существование модуля
    const moduleResult = isModuleExist(moduleName);
    if (!moduleResult.exists) {
      console.error('Ошибка валидации модуля:', moduleResult.error);
      next('/');
      return;
    }

    // Загружаем данные записи без предварительной проверки существования записи
    // Функция loadRecordData сама загрузит данные каталога и проверит существование записи
    loadRecordData(moduleName, catalogName, recordId, (error) => {
      if (error) {
        console.error('Ошибка загрузки данных записи:', error);
        next(`/${moduleName}/${catalogName}`);
      } else {
        // Явно вызываем next() здесь для гарантии перехода
        console.log('Данные записи успешно загружены, выполняем переход');
        next();
      }
    }).catch((error) => {
      console.error('Ошибка загрузки данных записи:', error);
      next(`/${moduleName}/${catalogName}`);
    });
    // Не вызываем next() здесь, так как он вызывается в колбэке
  },
});

// Добавляем дополнительные маршруты для модулей, если необходимо
try {
  config.value.modules.forEach((module) => {
    // Получаем имя модуля из URL
    const moduleName = parseBackendApiUrl(module.routes.getCatalog).moduleName;
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
export const loadCatalogByNameFromGroups = async (
  moduleName: string,
  catalogName: string,
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
    if (!forceReload && moduleStore.hasCachedData(catalogName)) {
      console.log(`Данные для ${catalogName} уже загружены, используем кэш`);
      return true;
    }

    // ШАГ 3: Загрузка групп, если они еще не загружены
    if (!moduleStore.catalogGroups || moduleStore.catalogGroups.length === 0) {
      console.log(`Загрузка групп для модуля ${moduleName}...`);
      await moduleStore.loadCatalogGroups();
    }

    // ШАГ 4: Поиск URL для загрузки конкретного справочника
    const url = moduleStore.findUrlInCatalogGroups(catalogName);
    if (!url) {
      const error = new Error(`URL для справочника ${catalogName} не найден`);
      console.error(error);
      next(error);
      return false;
    }

    // ШАГ 5: Загрузка деталей каталога
    await moduleStore.loadCatalog(moduleName, catalogName, url);
    console.log(`Детали каталога ${catalogName} успешно загружены`);

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
        await moduleStore.loadCatalogGroups();
      }

      // 3. Проверяем тип запроса
      if (to.params.catalogName) {
        // Загрузка деталей каталога (catalogName)
        const catalogName = to.params.catalogName as string;

        // Если данные не в кэше, загружаем их
        if (!moduleStore.hasCachedData(catalogName)) {
          try {
            // Ищем URL в каталоге
            const href = moduleStore.findUrlInCatalogGroups(catalogName);
            if (href) {
              // Загружаем данные каталога
              await moduleStore.loadCatalog(moduleName, catalogName, href);
            } else {
              console.error(`URL для каталога ${catalogName} не найден`);
            }
          } catch (error) {
            console.error(`Ошибка при загрузке деталей каталога ${catalogName}:`, error);
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

// Функция для загрузки данных записи и связанных данных для вложенных компонентов
export const loadRecordData = async (
  moduleName: string,
  catalogName: string,
  recordId: string | number,
  next: (error?: any) => void,
): Promise<boolean> => {
  try {
    console.log(`Загрузка данных записи: ${moduleName}, ${catalogName}, ${recordId}`);

    // Проверяем существование модуля
    const moduleResult = isModuleExist(moduleName);
    if (!moduleResult.exists) {
      console.error(`Ошибка при проверке модуля:`, moduleResult.error);
      next(moduleResult.error);
      return false;
    }

    // Получаем стор модуля
    const moduleStore = useModuleStore(moduleName);
    if (!moduleStore) {
      const error = new Error(`Не удалось получить стор для модуля ${moduleName}`);
      console.error(error);
      next(error);
      return false;
    }

    // Сначала загружаем данные каталога, если они еще не загружены
    console.log(`Загрузка данных каталога ${catalogName} для модуля ${moduleName}...`);
    const catalogLoaded = await loadCatalogByNameFromGroups(moduleName, catalogName, next, false);
    if (!catalogLoaded) {
      console.error(`Не удалось загрузить данные каталога ${catalogName}`);
      return false;
    }

    // Теперь проверяем наличие каталога в сторе
    if (!moduleStore.catalogsByName?.[catalogName]) {
      const error = new Error(
        `Каталог ${catalogName} не найден в модуле ${moduleName} после загрузки`,
      );
      console.error(error);
      next(error);
      return false;
    }

    // Получаем метаданные из OPTIONS
    const options = moduleStore.catalogsByName?.[catalogName]?.OPTIONS;
    if (!options || !options.layout) {
      const error = new Error(`Метаданные для представления ${catalogName} не найдены`);
      next(error);
      return false;
    }

    // Проверяем существование записи
    let recordResult = isRecordExist(moduleName, catalogName, recordId);
    let recordData = recordResult.exists ? recordResult.record : null;

    console.log(
      `Запись ${recordId} ${recordData ? 'найдена' : 'не найдена'} в каталоге ${catalogName}`,
    );

    // Если запись не найдена в сторе, пытаемся загрузить её
    if (!recordData) {
      console.log(`Попытка загрузить запись ${recordId}`);
      try {
        // Загружаем запись
        const loadedRecord = await moduleStore.loadRecordById(catalogName, recordId);

        if (loadedRecord) {
          console.log(`Запись ${recordId} успешно загружена`);
          // Обновляем данные записи
          recordData = loadedRecord;
          // Обновляем результат проверки существования записи
          recordResult = isRecordExist(moduleName, catalogName, recordId);
        } else {
          console.log(`Запись ${recordId} не найдена на сервере`);
        }
      } catch (err) {
        console.error(`Ошибка при загрузке записи ${recordId}:`, err);
      }
    }

    // Загрузка связанных данных для вложенных компонентов
    if (options.layout.ELEMENTS) {
      // Ищем все поля типа VIEW_SET_INLINE_LAYOUT и загружаем данные для них
      const findAndLoadInlineLayouts = async (elements: any[]) => {
        for (const element of elements) {
          // Если это вложенный макет, загружаем данные для него
          if (element.FRONTEND_CLASS === 'view_set_inline_layout' && element.view_name) {
            console.log(`Загрузка данных для вложенного макета: ${element.view_name}`);
            try {
              await loadCatalogByNameFromGroups(
                moduleName,
                element.view_name,
                (err) => {
                  if (err) {
                    console.warn(
                      `Ошибка загрузки данных для вложенного макета ${element.view_name}:`,
                      err,
                    );
                  }
                },
                false, // Не принудительное обновление
              );
            } catch (err) {
              console.warn(
                `Ошибка загрузки данных для вложенного макета ${element.view_name}:`,
                err,
              );
            }
          }

          // Рекурсивно проверяем вложенные элементы
          if (element.ELEMENTS && Array.isArray(element.ELEMENTS)) {
            await findAndLoadInlineLayouts(element.ELEMENTS);
          }
        }
      };

      await findAndLoadInlineLayouts(options.layout.ELEMENTS);
    }

    // Инициализация PATCH данных
    if (!recordData && recordId) {
      moduleStore.catalogsByName[catalogName].PATCH = { id: recordId };
    } else {
      moduleStore.catalogsByName[catalogName].PATCH = {};
    }

    // Вызываем next() для продолжения навигации
    // Функция loadRecordData загружает данные каталога и проверяет существование записи
    // Если запись существует, она загружается из стора или с сервера
    // Если запись не существует, создается новая запись с указанным ID
    if (recordData) {
      console.log(`Успешно загружены данные существующей записи ${recordId}, вызываем next()`);
    } else {
      console.log(`Переход к созданию новой записи с ID ${recordId}, вызываем next()`);
    }
    next(); // Явно вызываем next() для продолжения навигации
    return true;
  } catch (error) {
    console.error('Ошибка загрузки данных записи:', error);
    next(error);
    return false;
  }
};

// Набор функций для проверки существования данных
// Каждая функция возвращает объект { exists: boolean, error?: Error, ... }

/**
 * Проверяет существование модуля в конфигурации
 */
export const isModuleExist = (moduleName: string): { exists: boolean; error?: Error } => {
  if (!moduleName) {
    return {
      exists: false,
      error: new Error('Параметр moduleName не указан'),
    };
  }

  const module = config.value.modules.find((m) => {
    const extractedModuleName = parseBackendApiUrl(m.routes.getCatalog).moduleName;
    return extractedModuleName === moduleName;
  });

  if (!module) {
    return {
      exists: false,
      error: new Error(`Модуль с moduleName=${moduleName} не найден`),
    };
  }

  return { exists: true };
};

/**
 * Проверяет существование стора модуля и каталога в нем
 */
export const isCatalogExist = (
  moduleName: string,
  catalogName: string,
): { exists: boolean; error?: Error; moduleStore?: ReturnType<typeof useModuleStore> } => {
  // Сначала проверяем модуль
  const moduleResult = isModuleExist(moduleName);
  if (!moduleResult.exists) {
    return { exists: false, error: moduleResult.error };
  }

  try {
    const moduleStore = useModuleStore(moduleName);

    // Проверяем, что стор существует
    if (!moduleStore) {
      return {
        exists: false,
        error: new Error(`Не удалось получить стор для модуля ${moduleName}`),
      };
    }

    // Проверяем наличие каталога в сторе
    if (!moduleStore.catalogsByName?.[catalogName]) {
      return {
        exists: false,
        error: new Error(`Каталог ${catalogName} не найден в модуле ${moduleName}`),
        moduleStore,
      };
    }

    return { exists: true, moduleStore };
  } catch (error) {
    return {
      exists: false,
      error:
        error instanceof Error
          ? error
          : new Error(`Ошибка при проверке каталога ${catalogName} в модуле ${moduleName}`),
    };
  }
};

/**
 * Проверяет существование записи в каталоге
 */
//Функция isRecordExist проверяет:
//Существует ли модуль
//Существует ли каталог
//Загружены ли данные GET для каталога
//Инициализирована ли Map RESULTS
//Существует ли запись с указанным ID в Map RESULTS
//isRecordExist только проверяет наличие данных, но не загружает их, если их нет.
// Если данные записи не были предварительно загружены, защитник маршрута не пропускает переход.
export const isRecordExist = (
  moduleName: string,
  catalogName: string,
  recordId: string | number,
): {
  exists: boolean;
  error?: Error;
  moduleStore?: ReturnType<typeof useModuleStore>;
  record?: any;
} => {
  // Сначала проверяем каталог
  const catalogResult = isCatalogExist(moduleName, catalogName);
  if (!catalogResult.exists) {
    return { exists: false, error: catalogResult.error, moduleStore: catalogResult.moduleStore };
  }

  const moduleStore = catalogResult.moduleStore!;

  // Проверяем наличие данных GET в каталоге
  if (!moduleStore.catalogsByName?.[catalogName]?.GET) {
    return {
      exists: false,
      error: new Error(`Данные GET для каталога ${catalogName} не загружены`),
      moduleStore,
    };
  }

  // Проверяем наличие Map с результатами
  if (!moduleStore.catalogsByName?.[catalogName]?.GET?.RESULTS) {
    return {
      exists: false,
      error: new Error(`Map RESULTS для каталога ${catalogName} не инициализирована`),
      moduleStore,
    };
  }

  // Проверяем наличие записи в Map
  const record = moduleStore.catalogsByName[catalogName]?.GET?.RESULTS?.get(String(recordId));
  if (!record) {
    return {
      exists: false,
      error: new Error(`Запись ${recordId} не найдена в каталоге ${catalogName}`),
      moduleStore,
    };
  }

  return { exists: true, moduleStore, record };
};

export default router;
