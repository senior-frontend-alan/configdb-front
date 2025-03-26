// src/router.ts
// @ts-ignore - Игнорируем ошибки типизации для vue-router
import { createRouter, createWebHistory } from 'vue-router';
import { useConfig } from './config-loader';

const { config } = useConfig();

// Базовые маршруты
const routes = [
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
    
    // Маршрут для списка
    routes.push({
      path: `/${module.id}`,
      name: `${module.id}Catalog`,
      component: () => import('./pages/GetCatalogPage.vue')
    });
    
    // Маршрут для просмотра элемента каталога
    routes.push({
      path: `/${module.id}/:groupName`,
      name: `${module.id}CatalogGroup`,
      component: () => import('./pages/GetCatalogPage.vue')
    });
    
    // Маршрут для детальной информации
    routes.push({
      path: `/${module.id}/:id`,
      name: `${module.id}Detail`,
      component: safeImport(`./modules/${module.id}/${module.id.charAt(0).toUpperCase() + module.id.slice(1)}Detail.vue`)
    });
    
    // Маршрут для создания
    routes.push({
      path: `/${module.id}/create`,
      name: `${module.id}Create`,
      component: safeImport(`./modules/${module.id}/${module.id.charAt(0).toUpperCase() + module.id.slice(1)}Form.vue`)
    });
    
    // Маршрут для редактирования
    routes.push({
      path: `/${module.id}/:id/edit`,
      name: `${module.id}Edit`,
      component: safeImport(`./modules/${module.id}/${module.id.charAt(0).toUpperCase() + module.id.slice(1)}Form.vue`)
    });
  });
} catch (error) {
  console.error('Ошибка при создании динамических маршрутов:', error);
}

const router = createRouter({
  history: createWebHistory(),
  routes
});



export default router;