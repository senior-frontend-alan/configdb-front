<script setup>
  import { ref, watch, onMounted, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import BreadCrumb from 'primevue/breadcrumb';
  import { useModuleStore } from '../stores/module-factory';

  const route = useRoute();
  const router = useRouter();

  const moduleName = computed(() => {
    return route.meta.moduleName || '';
  });

  const moduleStore = moduleName.value ? useModuleStore(moduleName.value) : null;

  const catalogData = computed(() => moduleStore?.catalogGroups || []);

  // Функция для получения названия группы по её идентификатору
  const getGroupVerboseName = (groupName) => {
    const group = catalogData.value?.find((g) => g.name === groupName);
    return group?.verbose_name || group?.name || groupName;
  };

  // Хлебные крошки
  const home = ref({
    icon: 'pi pi-home',
    route: '/',
  });

  // Формируем элементы хлебных крошек на основе текущего маршрута
  const breadcrumbItems = ref([]);

  // Обновляем хлебные крошки при изменении маршрута
  const updateBreadcrumbs = () => {
    const items = [];

    if (route.path !== '/') {
      const pathSegments = route.path.split('/').filter((segment) => segment);

      let currentPath = '';
      let currentQuery = {};

      // Обрабатываем сегменты пути
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;

        let label = '';

        // Обработка специальных случаев
        if (segment === 'edit' && i + 1 < pathSegments.length) {
          // Случай редактирования записи (edit/ID)
          const id = pathSegments[i + 1];
          if (!isNaN(Number(id))) {
            currentPath += `/${id}`;
            label = `edit ${id}`;
            i++; // Пропускаем следующий сегмент (ID)
          } else {
            label = 'edit';
          }
        } else if (segment === 'add') {
          // Случай добавления новой записи
          label = 'add';
        } else {
          // Стандартный случай - форматируем сегмент пути
          label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        }

        // Добавляем элемент хлебных крошек
        items.push({
          label,
          route: { path: currentPath, query: currentQuery },
        });
      }

      // Добавляем группу в хлебные крошки, если она указана в параметрах запроса
      if (route.query.group) {
        const groupId = route.query.group;
        const groupDisplayName = getGroupVerboseName(groupId);
        items.push({
          label: `Группа: ${groupDisplayName}`,
          route: { path: route.path, query: { group: groupId } },
        });
      }
    }

    breadcrumbItems.value = items;
  };

  // Следим за изменениями маршрута и параметров запроса
  watch([() => route.path, () => route.query], () => updateBreadcrumbs());

  // Инициализируем хлебные крошки при загрузке
  onMounted(() => {
    updateBreadcrumbs();
  });
</script>

<template>
  <nav class="breadcrumb-container">
    <BreadCrumb :home="home" :model="breadcrumbItems">
      <template #item="{ item, props }">
        <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
          <a :href="href" v-bind="props.action" @click="navigate">
            <span v-if="item.icon" :class="[item.icon, 'text-color']"></span>
            <span class="text-primary font-semibold">{{ item.label }}</span>
          </a>
        </router-link>
        <a v-else :href="item.url" :target="item.target" v-bind="props.action">
          <span class="text-surface-700 dark:text-surface-0">{{ item.label }}</span>
        </a>
      </template>
    </BreadCrumb>
  </nav>
</template>

<style scoped>
  .breadcrumb-container {
    padding: 0.5rem 1.5rem;
  }

  .p-breadcrumb {
    background-color: transparent;
  }
</style>
