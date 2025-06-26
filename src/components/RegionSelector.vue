<template>
  <div class="region-selector">
    <Dropdown
      v-model="selectedRegion"
      :options="regions"
      optionLabel="description"
      optionValue="code"
      class="w-full"
      :placeholder="$t('settings.selectRegion')"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useSettingsStore } from '../stores/settingsStore';

  const settingsStore = useSettingsStore();

  // Получаем список доступных регионов
  const regions = computed(() => settingsStore.getAvailableRegions());

  // Вычисляемое свойство для двусторонней привязки региона
  const selectedRegion = computed({
    get: () => settingsStore.region,
    set: (value) => settingsStore.setRegion(value),
  });
</script>

<style scoped>
  .region-selector {
    padding: 0.5rem;
  }
</style>
