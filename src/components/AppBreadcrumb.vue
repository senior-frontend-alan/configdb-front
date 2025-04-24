<script setup>
  import { ref, watch, onMounted, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import BreadCrumb from 'primevue/breadcrumb';
  import { useModuleStore } from '../stores/module-factory';

  const route = useRoute();
  const router = useRouter();

  const moduleId = computed(() => {
    return route.meta.moduleId || '';
  });

  const moduleStore = moduleId.value ? useModuleStore(moduleId.value) : null;

  const catalogData = computed(() => moduleStore?.catalog || []);

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

      pathSegments.forEach((segment) => {
        currentPath += `/${segment}`;
        // Преобразуем сегмент пути для отображения (первая буква заглавная, дефисы заменяем на пробелы)
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

        items.push({
          label,
          route: { path: currentPath, query: currentQuery },
        });
      });

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
