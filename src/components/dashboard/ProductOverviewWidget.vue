<script setup>
import { ref, watch, onMounted } from "vue";

const products = ref([
    {
        name: "Laptop Pro",
        category: "Electronics",
        price: 2499,
        status: "In Stock",
    },
    {
        name: "Wireless Mouse",
        category: "Accessories",
        price: 49,
        status: "Low Stock",
    },
    {
        name: "Monitor 4K",
        category: "Electronics",
        price: 699,
        status: "Out of Stock",
    },
    { name: "Keyboard", category: "Accessories", price: 149, status: "In Stock" },
]);

const selectedProduct = ref(null);
const searchQuery = ref("");
const loading = ref(false);
const filteredProducts = ref([]);

const searchProducts = () => {
    loading.value = true;
    filteredProducts.value = products.value.filter(
        (product) =>
            product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            product.status.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
    setTimeout(() => {
        loading.value = false;
    }, 300);
};

watch(searchQuery, () => {
    searchProducts();
});

onMounted(() => {
    filteredProducts.value = [...products.value];
});
</script>

<template>
    <div class="layout-card">
        <div class="products-header">
            <span class="products-title">Products Overview</span>
            <IconField class="search-field">
                <InputIcon class="pi pi-search" />
                <InputText
                    v-model="searchQuery"
                    placeholder="Search products..."
                    class="products-search"
                    @keyup.enter="searchProducts"
                />
            </IconField>
        </div>
        <div class="products-table-container">
            <DataTable
                :value="filteredProducts"
                v-model:selection="selectedProduct"
                selectionMode="single"
                :loading="loading"
                :rows="5"
                class="products-table"
                :pt="{
                    mask: {
                        class: 'products-table-mask',
                    },
                    loadingIcon: {
                        class: 'products-table-loading',
                    },
                }"
            >
                <Column field="name" header="Name" sortable></Column>
                <Column field="category" header="Category" sortable></Column>
                <Column field="price" header="Price" sortable>
                    <template #body="{ data }"> ${{ data.price }} </template>
                </Column>
                <Column field="status" header="Status">
                    <template #body="{ data }">
                        <Tag
                            :severity="
                                data.status === 'In Stock' ? 'success' : data.status === 'Low Stock' ? 'warn' : 'danger'
                            "
                        >
                            {{ data.status }}
                        </Tag>
                    </template>
                </Column>
            </DataTable>
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

.products-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}

.products-title {
    font-size: 1rem;
    font-weight: 500;
    color: var(--p-surface-900);
}

.products-table-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background-color: var(--p-surface-0);
}

.products-table {
    width: 100%;
    color: var(--p-surface-900);
}

.products-table-mask {
    backdrop-filter: blur(4px) !important;
    background-color: color-mix(in srgb, var(--p-surface-0), transparent 80%) !important;
}

.products-table-loading {
    color: var(--p-primary-500) !important;
}

.products-search {
    font-size: 0.875rem;
    padding: 0.5rem;
    background-color: var(--p-surface-0);
    color: var(--p-surface-900);
    border: 1px solid var(--p-surface-200);
}

/* Темная тема */
:global(.p-dark) .layout-card {
    background-color: var(--p-surface-900);
    color: var(--p-surface-0);
    border-color: var(--p-surface-700);
}

:global(.p-dark) .products-title {
    color: var(--p-surface-0);
}

:global(.p-dark) .products-table-container {
    background-color: var(--p-surface-900);
}

:global(.p-dark) .products-table {
    color: var(--p-surface-0);
}

:global(.p-dark) .products-table-mask {
    background-color: color-mix(in srgb, var(--p-surface-900), transparent 80%) !important;
}

:global(.p-dark) .products-search {
    background-color: var(--p-surface-900);
    color: var(--p-surface-0);
    border-color: var(--p-surface-700);
}

/* Адаптивность */
@media (max-width: 640px) {
    .products-header {
        flex-direction: column;
        gap: 0.5rem;
    }

    .products-header .search-field {
        width: 100%;
    }
}

@media (min-width: 768px) {
    .products-search {
        width: auto !important;
    }
}

@media (max-width: 767px) {
    .products-search {
        width: 100% !important;
    }
}
</style>
