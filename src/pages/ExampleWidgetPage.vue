<script setup>
import AppTopbar from "../components/AppTopbar.vue";
import AppFooter from "../components/AppFooter.vue";
import StatsWidget from "../components/dashboard/StatsWidget.vue";
import SalesTrendWidget from "../components/dashboard/SalesTrendWidget.vue";
import RecentActivityWidget from "../components/dashboard/RecentActivityWidget.vue";
import ProductOverviewWidget from "../components/dashboard/ProductOverviewWidget.vue";
</script>

<template>
  <div class="layout-container">
    <AppTopbar />
    <div class="layout-grid">
      <StatsWidget />
      <div class="layout-grid-row">
        <SalesTrendWidget />
        <RecentActivityWidget />
      </div>
      <ProductOverviewWidget />
    </div>
    <AppFooter />
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  flex: 1;
}

.layout-grid-row {
  display: flex;
  gap: 1rem;
}

@media (max-width: 768px) {
  .layout-grid-row {
    flex-direction: column;
  }
}
</style>
