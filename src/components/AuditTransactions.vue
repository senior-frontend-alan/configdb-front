<template>
  <div class="transaction-menu">
    <!-- Кнопка транзакций -->
    <button class="transaction-button" @click="(event) => menu?.toggle(event)">
      <div class="transaction-info">
        <div class="transaction-title">
          {{ authStore.currentTransaction?.description || 'Аудит транзакций' }}
        </div>
        <div v-if="authStore.currentTransaction?.transaction_num" class="transaction-number">
          {{ authStore.currentTransaction.transaction_num }}
        </div>
      </div>
      <i class="pi pi-angle-down transaction-menu-icon"></i>
    </button>

    <!-- Раскрывающееся меню -->
    <Menu id="transaction-menu" ref="menu" :model="transactionMenuItems" :popup="true" />

    <!-- Модальное окно для просмотра транзакций -->
    <Dialog
      v-model:visible="dialogVisible"
      :style="{ width: '80vw' }"
      :modal="true"
      maximizable
      :closable="true"
      @hide="closeDialog"
    >
      <template #header>
        <div class="dialog-header-container">
          <span class="dialog-title">Аудит транзакций</span>
          <div class="dialog-buttons">
            <Button
              icon="pi pi-external-link"
              class="p-button-rounded p-button-text"
              @click="openInNewTab"
              v-tooltip="'Открыть в новой вкладке'"
            />
          </div>
        </div>
      </template>

      <div v-if="error" class="p-4 text-center">
        <Message severity="error">{{ error }}</Message>
      </div>

      <div v-else class="transactions-container">
        <Page2CatalogDetails
          v-if="isDataReady && transactionsApplName"
          :moduleName="transactionsModuleName"
          :applName="transactionsApplName"
          :catalogName="transactionsCatalogName"
          :isModalMode="true"
          :filters="auditTransactionFilters"
          @row-click="handleTransactionClick"
        />
        <div v-else class="loading-state">
          <Message severity="info">Загрузка данных аудита транзакций...</Message>
        </div>
      </div>

      <template #footer>
        <Button label="Закрыть" icon="pi pi-times" @click="closeDialog" class="p-button-text" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import Button from 'primevue/button';
  import Dialog from 'primevue/dialog';
  import Message from 'primevue/message';
  import Menu from 'primevue/menu';
  import { useToast } from 'primevue/usetoast';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '../stores/authStore';
  import Page2CatalogDetails from '../pages/Page2CatalogDetails/index.vue';
  import type { MenuItem } from 'primevue/menuitem';
  import { getOrFetchModuleCatalogGroups } from '../stores/data-loaders';

  // Template ref для компонента Menu
  const menu = ref<InstanceType<typeof Menu>>();

  // Состояние модального окна
  const dialogVisible = ref(false);
  const error = ref<string | null>(null);
  const loading = ref(false);
  const toast = useToast();
  const authStore = useAuthStore();
  const router = useRouter();

  // Пункты меню транзакций
  const transactionMenuItems = computed((): MenuItem[] => [
    {
      label: 'Выбор транзакции',
      icon: 'pi pi-history',
      command: () => {
        openTransactionsDialog();
      },
    },
    {
      label: 'Логи транзакции',
      icon: 'pi pi-external-link',
      command: () => {
        openTransactionLogPage();
      },
    },
  ]);

  // Вычисляемые свойства для каталогов транзакций
  const transactionsModuleName = ref('core');
  const transactionsApplName = ref<string | null>(null); // Будет определен динамически
  const transactionsCatalogName = ref('audittransaction'); // Имя каталога аудита
  const transactionsLogCatalogName = ref('audittransactionlog'); // Имя каталога аудита

  // Словарь состояний аудита транзакций
  const AuditTransactionState = {
    PLANING: 1,
    OPEN: 2,
    CLOSED: 3,
    PUBLISHED: 4,
  } as const;

  // Фильтр аудита транзакций - показываем только открытые транзакции
  const auditTransactionFilters = computed(() => ({
    state: {
      value: AuditTransactionState.OPEN,
      metadata: {
        label: 'Состояние',
        valueLabel: 'Open',
      },
    },
  }));

  // Флаг готовности данных для отображения
  const isDataReady = computed(() => {
    return Boolean(
      transactionsModuleName.value && transactionsApplName.value && transactionsCatalogName.value,
    );
  });

  // Общая функция для поиска информации о каталоге
  const findCatalogInfo = async (catalogName: string) => {
    // Получаем список каталогов для модуля core
    const catalogGroupsResult = await getOrFetchModuleCatalogGroups(transactionsModuleName.value);

    if (!catalogGroupsResult.success || !catalogGroupsResult.indexCatalogsByApplName) {
      return {
        success: false,
        error: 'Не удалось загрузить список каталогов для модуля core',
      };
    }

    // Ищем каталог и определяем его applName и URL
    let foundApplName: string | null = null;
    let foundCatalogUrl: string | null = null;

    for (const [applName, catalogMap] of Object.entries(
      catalogGroupsResult.indexCatalogsByApplName,
    )) {
      if (catalogMap.has(catalogName)) {
        foundApplName = applName;
        const catalogItem = catalogMap.get(catalogName);
        foundCatalogUrl = catalogItem?.href || null;
        break;
      }
    }

    if (!foundApplName) {
      return {
        success: false,
        error: `Каталог ${catalogName} не найден в модуле ${transactionsModuleName.value}`,
      };
    }

    return {
      success: true,
      applName: foundApplName,
      catalogUrl: foundCatalogUrl,
    };
  };

  const openTransactionsDialog = async () => {
    error.value = null;
    loading.value = true;

    // Используем общую функцию для поиска каталога
    const catalogInfo = await findCatalogInfo(transactionsCatalogName.value);

    if (!catalogInfo.success) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: catalogInfo.error,
        life: 5000,
      });
      loading.value = false;
      return;
    }

    transactionsApplName.value = catalogInfo.applName || null;
    catalogUrl = catalogInfo.catalogUrl || null;

    // OPTIONS и данные каталога будут загружены автоматически
    // в Page2CatalogDetails при монтировании компонента с правильными фильтрами

    // Открываем модальное окно
    loading.value = false;
    dialogVisible.value = true;
  };

  const closeDialog = () => {
    dialogVisible.value = false;
    error.value = null;
  };

  const openInNewTab = () => {
    if (
      transactionsModuleName.value &&
      transactionsApplName.value &&
      transactionsCatalogName.value
    ) {
      const url = `/${transactionsModuleName.value}/${transactionsApplName.value}/${transactionsCatalogName.value}`;
      window.open(url, '_blank');
    } else {
      console.warn('Не все параметры каталога определены для открытия в новой вкладке');
    }
  };

  // Открыть справочник логов транзакций на странице
  const openTransactionLogPage = async () => {
    try {
      // Используем общую функцию для поиска каталога
      const catalogInfo = await findCatalogInfo(transactionsLogCatalogName.value);

      if (!catalogInfo.success) {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: catalogInfo.error,
          life: 5000,
        });
        return;
      }

      const authStore = useAuthStore();
      const currentTransaction = authStore.currentTransaction;

      if (!currentTransaction) {
        console.error('Текущая транзакция не найдена в authStore');
        return;
      }

      // Переходим на страницу справочника с фильтром по id из текущей транзакции
      const routePath = `/${transactionsModuleName.value}/${catalogInfo.applName}/${transactionsLogCatalogName.value}`;
      await router.push({
        path: routePath,
        query: { transaction: currentTransaction.id },
      });
    } catch (error) {
      console.error('Ошибка при открытии справочника логов транзакций:', error);
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось открыть справочник логов транзакций',
        life: 5000,
      });
    }
  };

  // Сохраняем URL каталога после его определения
  let catalogUrl: string | null = null;

  const handleTransactionClick = async (event: any) => {
    const transaction = event.data;

    if (!transaction?.id) {
      console.warn('ID транзакции не найден');
      return;
    }

    if (!catalogUrl) {
      console.error('URL каталога не определен. Сначала откройте диалог аудита.');
      return;
    }

    const authStore = useAuthStore();
    const result = await authStore.setCurrentTransaction(transaction.id);

    if (result) {
      // Успешно - закрываем диалог
      closeDialog();

      // Проверяем, находимся ли мы на странице логов транзакций
      const currentRoute = router.currentRoute.value;
      const isTransactionLogPage = currentRoute.path.includes(
        `/${transactionsLogCatalogName.value}`,
      );

      if (isTransactionLogPage) {
        // Если мы на странице логов транзакций, перезагружаем страницу с новым фильтром ?transaction={значение}, чтобы увидеть отфильтрованный лог
        await router.replace({
          path: currentRoute.path,
          query: { ...currentRoute.query, transaction: transaction.id },
        });
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось установить текущую транзакцию. Попробуйте еще раз.',
        life: 5000,
      });
    }
  };
</script>

<style scoped>
  .dialog-header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dialog-title {
    font-size: 1.2rem;
    font-weight: 600;
  }

  .dialog-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .transactions-container {
    min-height: 400px;
  }

  .transaction-menu {
    width: 100%;
  }

  .transaction-button {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--surface-card);
    width: 100%;
  }

  .transaction-button:hover {
    border-color: var(--primary-color);
    background: var(--surface-hover);
  }

  .transaction-icon {
    width: 40px;
    height: 40px;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.75rem;
    flex-shrink: 0;
  }

  .transaction-info {
    flex: 1;
    min-width: 0;
  }

  .transaction-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: var(--text-color);
  }

  .transaction-number {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
  }

  .transaction-menu-icon {
    color: var(--text-color-secondary);
    margin-left: 0.5rem;
    flex-shrink: 0;
  }
</style>
