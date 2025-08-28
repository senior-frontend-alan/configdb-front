<template>
  <div class="flex-1">
    <!-- Отображаем только основную таблицу, если нет выбранных записей -->
    <Page2CatalogDetails
      v-if="detailConfigs.length === 0"
      :moduleName="moduleName"
      :applName="applName"
      :catalogName="catalogName"
      :isModalMode="false"
      @show-details-table="handleShowDetails"
    />

    <!-- Отображаем разделенный экран после выбора хотя бы одной записи -->
    <Splitter v-else :layout="layoutDirection" style="height: 100vh">
      <!-- Мастер-панель -->
      <SplitterPanel :size="50" :minSize="10">
        <Page2CatalogDetails
          :moduleName="moduleName"
          :applName="applName"
          :catalogName="catalogName"
          :isModalMode="false"
          @show-details-table="handleShowDetails"
        />
      </SplitterPanel>

      <!-- Детальная панель с вкладками -->
      <SplitterPanel :size="50">
        <!-- Заголовок с вкладками -->
        <div
          class="flex items-center justify-between px-4 py-2 bg-[var(--surface-section)] border-b border-[var(--surface-border)]"
        >
          <!-- Вкладки для каждой деталь-таблицы -->
          <div class="flex gap-2">
            <div
              v-for="(config, index) in detailConfigs"
              :key="`${config.appl_name}-${config.view_name}-${config.record_id}`"
              class="cursor-pointer px-3 py-1 rounded-t-md flex items-center gap-1"
              :class="{
                'bg-[var(--surface-hover)]': activeDetailIndex === index,
                'hover:bg-[var(--surface-hover)]': activeDetailIndex !== index,
              }"
              @click="setActiveDetail(index)"
            >
              <span>{{ config.view_name }}</span>
              <Button
                icon="pi pi-times"
                class="p-button-rounded p-button-text p-button-sm"
                @click.stop="removeDetailConfig(index)"
                aria-label="Закрыть вкладку"
              />
            </div>
          </div>

          <!-- Кнопка закрытия всех вкладок -->
          <Button
            icon="pi pi-times"
            class="p-button-rounded p-button-text p-button-sm"
            @click="closeDetailPanel"
            aria-label="Закрыть все вкладки"
          />
        </div>

        <!-- Активная деталь-таблица -->
        <Page2CatalogDetails
          v-if="activeDetailConfig"
          :moduleName="activeDetailConfig.module_name"
          :applName="activeDetailConfig.appl_name"
          :catalogName="activeDetailConfig.view_name"
          :isModalMode="true"
          :relatedFields="getRelatedFields(activeDetailConfig)"
        />
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import Splitter from 'primevue/splitter';
  import SplitterPanel from 'primevue/splitterpanel';
  import Button from 'primevue/button';
  import Page2CatalogDetails from './index.vue';

  const route = useRoute();

  const moduleName = computed(() => route.params.moduleName as string);
  const applName = computed(() => route.params.applName as string);
  const catalogName = computed(() => route.params.catalogName as string);

  const layoutDirection = ref<'horizontal' | 'vertical'>('vertical');

  // Интерфейс для конфигурации деталь-таблицы
  interface DetailConfig {
    module_name: string;
    appl_name: string;
    view_name: string;
    primary_field: string;
    record_id: string | number;
    record: any;
  }

  // Массив конфигураций деталь-таблиц
  const detailConfigs = ref<DetailConfig[]>([]);
  const activeDetailIndex = ref<number>(0);

  // Вычисляемое свойство для активной конфигурации
  const activeDetailConfig = computed(() => {
    if (detailConfigs.value.length === 0) return null;
    return detailConfigs.value[activeDetailIndex.value];
  });

  // Функция для установки активной вкладки
  function setActiveDetail(index: number) {
    activeDetailIndex.value = index;
  }

  // Функция для закрытия всех деталь-таблиц
  function closeDetailPanel() {
    detailConfigs.value = [];
    activeDetailIndex.value = 0;
  }

  // Функция для удаления конфигурации деталь-таблицы
  function removeDetailConfig(index: number) {
    // Удаляем конфигурацию из массива
    detailConfigs.value.splice(index, 1); // Удаляем один элемент по индексу

    // Если удалили активную вкладку, переключаемся на предыдущую
    if (index === activeDetailIndex.value) {
      if (index > 0) {
        activeDetailIndex.value = index - 1;
      } else if (detailConfigs.value.length > 0) {
        activeDetailIndex.value = 0;
      }
    } else if (index < activeDetailIndex.value) {
      // Если удалили вкладку перед активной, корректируем индекс
      activeDetailIndex.value--;
    }
  }

  // Функция для получения связанных полей для фильтрации
  function getRelatedFields(config?: DetailConfig) {
    if (!config) return [];

    const record = config.record;
    if (!record || !config.primary_field) return [];

    return [
      {
        name: config.primary_field,
        data: record[config.primary_field],
        metadata: { field: config.primary_field },
        isEmpty: !record[config.primary_field],
      },
    ];
  }

  function handleShowDetails(row: any) {
    if (!row) return;

    // Проверяем, есть ли уже такая деталь-таблица в массиве
    const existingIndex = detailConfigs.value.findIndex(
      (config) => config.record_id === row.id && config.view_name === row.details_view_name,
    );

    // Если такая таблица уже есть
    if (existingIndex !== -1) {
      // Если кликнули на активную вкладку - закрываем её
      if (existingIndex === activeDetailIndex.value) {
        removeDetailConfig(existingIndex);
      } else {
        // Иначе делаем её активной
        setActiveDetail(existingIndex);
      }
      return;
    }

    // Создаем новую конфигурацию для деталь-таблицы
    const newConfig: DetailConfig = {
      module_name: moduleName.value,
      appl_name: row.details_appl_name,
      view_name: row.details_view_name,
      primary_field: row.details_primary_field,
      record_id: row.id,
      record: row,
    };

    detailConfigs.value.push(newConfig);

    setActiveDetail(detailConfigs.value.length - 1);
  }
</script>

<style scoped></style>
