<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import BreadCrumb from "primevue/breadcrumb";

const route = useRoute();
const router = useRouter();

// Хлебные крошки
const home = ref({
  icon: "pi pi-home",
  route: "/",
});

// Формируем элементы хлебных крошек на основе текущего маршрута
const breadcrumbItems = ref([]);

// Обновляем хлебные крошки при изменении маршрута
const updateBreadcrumbs = () => {
  const items = [];

  if (route.path !== "/") {
    const pathSegments = route.path.split("/").filter((segment) => segment);

    let currentPath = "";
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      // Преобразуем сегмент пути для отображения (первая буква заглавная, дефисы заменяем на пробелы)
      const label =
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

      items.push({
        label,
        route: currentPath,
      });
    });
  }

  breadcrumbItems.value = items;
};

// Следим за изменениями маршрута
watch(
  () => route.path,
  () => updateBreadcrumbs()
);

// Инициализируем хлебные крошки при загрузке
onMounted(() => {
  updateBreadcrumbs();
});
</script>

<template>
  <nav class="breadcrumb-container">
    <BreadCrumb :home="home" :model="breadcrumbItems">
      <template #item="{ item, props }">
        <router-link
          v-if="item.route"
          v-slot="{ href, navigate }"
          :to="item.route"
          custom
        >
          <a :href="href" v-bind="props.action" @click="navigate">
            <span v-if="item.icon" :class="[item.icon, 'text-color']"></span>
            <span class="text-primary font-semibold">{{ item.label }}</span>
          </a>
        </router-link>
        <a v-else :href="item.url" :target="item.target" v-bind="props.action">
          <span class="text-surface-700 dark:text-surface-0">{{
            item.label
          }}</span>
        </a>
      </template>
    </BreadCrumb>
  </nav>
</template>

<style scoped>
.breadcrumb-container {
  padding: 0.5rem 1.5rem;
  background-color: var(--p-surface-50);
}
</style>
