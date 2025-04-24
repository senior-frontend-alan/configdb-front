<script setup>
const stats = [
    {
        title: "Total Orders",
        icon: "pi-shopping-cart",
        value: "1,234",
        subtitle: "Last 7 days",
    },
    {
        title: "Active Users",
        icon: "pi-users",
        value: "2,573",
        subtitle: "Last 7 days",
    },
    {
        title: "Revenue",
        icon: "pi-dollar",
        value: "$45,200",
        subtitle: "Last 7 days",
    },
    {
        title: "Success Rate",
        icon: "pi-chart-line",
        value: "95%",
        subtitle: "Last 7 days",
    },
];
</script>

<template>
    <div class="stats">
        <div v-for="(stat, index) in stats" :key="index" class="layout-card">
            <div class="stats-header">
                <span class="stats-title">{{ stat.title }}</span>
                <span class="stats-icon-box">
                    <i :class="['pi', stat.icon]"></i>
                </span>
            </div>
            <div class="stats-content">
                <div class="stats-value">{{ stat.value }}</div>
                <div class="stats-subtitle">{{ stat.subtitle }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stats {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 1.714rem;
    position: relative;
    z-index: 0;
}

.layout-card {
    background-color: var(--p-surface-0);
    color: var(--p-surface-950);
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid var(--p-surface-200);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.stats-icon-box {
    flex-shrink: 0;
    background-color: var(--p-primary-100);
    color: var(--p-primary-600);
    border-radius: 0.5rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--p-primary-200);
}

.stats-header {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    justify-content: space-between;
}

.stats-title {
    font-size: 1.25rem;
    font-weight: 300;
    line-height: 1.25;
    color: var(--p-surface-900);
}

.stats-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
}

.stats-value {
    font-size: 1.875rem;
    font-weight: 500;
    line-height: 1.25;
    color: var(--p-surface-900);
}

.stats-subtitle {
    color: var(--p-surface-600);
    font-size: 0.875rem;
    line-height: 1.25;
}

/* Темная тема */
:global(.p-dark) .layout-card {
    background-color: var(--p-surface-900);
    color: var(--p-surface-0);
    border-color: var(--p-surface-700);
}

:global(.p-dark) .stats-icon-box {
    background-color: color-mix(in srgb, var(--p-primary-400), transparent 80%);
    border-color: color-mix(in srgb, var(--p-primary-400), transparent 70%);
    color: var(--p-primary-200);
}

:global(.p-dark) .stats-title {
    color: var(--p-surface-0);
}

:global(.p-dark) .stats-value {
    color: var(--p-surface-0);
}

:global(.p-dark) .stats-subtitle {
    color: var(--p-surface-400);
}

/* Адаптивность */
@media (max-width: 991px) {
    .stats {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 480px) {
    .stats {
        grid-template-columns: 1fr;
    }
}
</style>
