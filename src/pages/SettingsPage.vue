<template>
  <div class="settings-page">
    <Card>
      <template #title>
        <h4>Настройки</h4>
      </template>
      <template #content>
        <div class="settings-section">
          <h5>Отображение каталога</h5>
          <div class="setting-item">
            <div class="setting-label">Режим отображения каталога:</div>
            <div class="setting-control">
              <ToggleSwitch v-model="tabMode" />
              <span style="font-size: 0.875rem; color: var(--text-color-secondary)">
                {{ tabMode ? 'Режим вкладок' : 'Режим списка' }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Card from "primevue/card";
import ToggleSwitch from "primevue/toggleswitch";
import { useSettingsStore } from "../stores/settingsStore";

const settingsStore = useSettingsStore();

// Используем вычисляемое свойство для двусторонней привязки
const tabMode = computed({
  get: () => settingsStore.useTabMode,
  set: (value) => settingsStore.setTabMode(value)
});
</script>

<style scoped>
.settings-page {
  padding: 1rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: var(--surface-section);
  border-radius: 6px;
}

.setting-label {
  flex: 1;
  font-weight: 500;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
