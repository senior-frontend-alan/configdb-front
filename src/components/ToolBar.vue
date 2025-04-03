<template>
  <div class="toolbar">
    <div class="search-container">
      <InputGroup>
        <InputGroupAddon>
          <Button
            icon="pi pi-search"
            severity="secondary"
            @click="applySearch"
          />
        </InputGroupAddon>
        <InputText
          v-model="searchValue"
          placeholder="Search"
          @input="debouncedSearch"
        />
        <InputGroupAddon>
          <Button
            :icon="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-times'"
            severity="secondary"
            @click="clearSearch"
          />
        </InputGroupAddon>
      </InputGroup>
    </div>
    <div class="toolbar-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";

const props = defineProps<{
  initialQuery?: string;
}>();

const emit = defineEmits<{
  (e: "search", value: string): void;
}>();

const router = useRouter();
const route = useRoute();

// Инициализируем значение поиска из URL-параметров или пропсов
const searchValue = ref(props.initialQuery || "");
const isLoading = ref(false);
let debounceTimer: number | null = null;

// При монтировании компонента инициализируем поисковый запрос из URL
onMounted(() => {
  if (route.query.search) {
    searchValue.value = route.query.search as string;
  }
});

// Обновляем значение поиска при изменении URL
watch(
  () => route.query.search,
  (newValue) => {
    if (newValue !== undefined) {
      searchValue.value = newValue as string;
    } else {
      searchValue.value = "";
    }
  }
);

// Функция с debounce для обработки ввода
const debouncedSearch = () => {
  isLoading.value = true;

  // Очищаем предыдущий таймер, если он есть
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // Устанавливаем новый таймер
  debounceTimer = window.setTimeout(() => {
    applySearch();
    isLoading.value = false;
  }, 500); // Задержка 500 мс
};

// Применяем поиск - обновляем URL с параметром search
const applySearch = () => {
  const query = { ...route.query };

  if (searchValue.value.trim()) {
    query.search = searchValue.value.trim();
  } else {
    delete query.search;
  }

  // Обновляем URL с новыми параметрами
  router.push({
    path: route.path,
    query,
  });

  // Также отправляем событие для родительского компонента
  emit("search", searchValue.value);
};

// Очищаем поиск
const clearSearch = () => {
  searchValue.value = "";

  // Удаляем параметр search из URL
  const query = { ...route.query };
  delete query.search;

  router.push({
    path: route.path,
    query,
  });

  emit("search", "");
};
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  max-width: 400px;
}
</style>
