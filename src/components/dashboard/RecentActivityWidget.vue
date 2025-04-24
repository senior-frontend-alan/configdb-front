<script setup>
const activities = [
    {
        icon: "pi-shopping-cart",
        text: "New order #1123",
        time: "2 minutes ago",
        color: "pink",
    },
    {
        icon: "pi-user-plus",
        text: "New customer registered",
        time: "15 minutes ago",
        color: "green",
    },
    {
        icon: "pi-check-circle",
        text: "Payment processed",
        time: "25 minutes ago",
        color: "blue",
    },
    {
        icon: "pi-inbox",
        text: "Inventory updated",
        time: "40 minutes ago",
        color: "yellow",
    },
];
</script>

<template>
    <div class="layout-card col-item-2">
        <span class="chart-title">Recent Activity</span>
        <div class="activity-list">
            <div v-for="(activity, index) in activities" :key="index" class="activity-item">
                <i :class="['activity-icon', activity.color, 'pi', activity.icon]"></i>
                <div class="activity-content">
                    <span class="activity-text">{{ activity.text }}</span>
                    <span class="activity-time">{{ activity.time }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
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

.chart-title {
    font-size: 1rem;
    font-weight: 500;
    color: var(--p-surface-900);
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.5rem 0;
}

.activity-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--p-surface-200);
    border-radius: 0.5rem;
    background-color: var(--p-surface-50);
}

.activity-icon {
    font-size: 1.125rem !important;
}

.activity-icon.green {
    color: #22c55e;
}

.activity-icon.blue {
    color: #3b82f6;
}

.activity-icon.yellow {
    color: #eab308;
}

.activity-icon.pink {
    color: #ec4899;
}

.activity-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.activity-text {
    font-size: 0.875rem;
    font-weight: 500;
}

.activity-time {
    font-size: 0.75rem;
    color: var(--p-surface-600);
}

/* Темная тема */
:global(.p-dark) .layout-card {
    background-color: var(--p-surface-900);
    color: var(--p-surface-0);
    border-color: var(--p-surface-700);
}

:global(.p-dark) .chart-title {
    color: var(--p-surface-0);
}

:global(.p-dark) .activity-item {
    background-color: var(--p-surface-800);
    border-color: var(--p-surface-700);
}

:global(.p-dark) .activity-time {
    color: var(--p-surface-400);
}
</style>
