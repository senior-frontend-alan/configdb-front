<template>
  <ProgressBar
    :mode="isLoading ? 'indeterminate' : 'determinate'"
    style="height: 6px"
    :class="isLoading ? '' : 'custom-progress-bar'"
  ></ProgressBar>
</template>

<style scoped>
/* Стиль для активного индикатора (при загрузке) */
.custom-progress-bar:deep(.p-progressbar-value) {
  background-color: var(--primary-color);
}

/* Стиль для фона индикатора (серый цвет) */
.custom-progress-bar:deep(.p-progressbar) {
  background-color: var(--surface-200);
}

/* Убираем границу */
.custom-progress-bar:deep(.p-progressbar) {
  border: none;
}
</style>

<script setup>
import ProgressBar from "primevue/progressbar";
import { isLoading } from "../api";
</script>
