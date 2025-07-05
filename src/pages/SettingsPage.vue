<template>
  <div class="settings-page">
    <Card>
      <template #title>
        <h4>{{ $t('settings.title') }}</h4>
      </template>
      <template #content>
        <!-- Секция выбора языка и региона -->
        <div class="flex gap-2 mb-4">
          <div class="flex align-items-center">
            <div>{{ $t('settings.language') }}: &nbsp;</div>
            <div>
              <Select
                v-model="currentLanguage"
                :options="localeOptions"
                optionLabel="name"
                optionValue="code"
                class="w-full md:w-14rem"
                :placeholder="$t('settings.selectLanguage')"
              />
            </div>
          </div>
          <div class="flex align-items-center">
            <div>{{ $t('settings.region') }}: &nbsp;</div>
            <div>
              <Select
                v-model="currentRegion"
                :options="regions"
                optionLabel="description"
                optionValue="code"
                class="w-full md:w-14rem"
                :placeholder="$t('settings.selectRegion')"
              />
            </div>
          </div>
        </div>

        <!-- Примеры форматирования даты и времени в текущей локали -->
        <div class="settings-section mb-4">
          <h3>Примеры форматирования в текущей локали {{ settingsStore.locale }}</h3>
          <div class="grid">
            <div class="col-4">
              <div class="font-bold mb-2">Дата:</div>
              <div>{{ formattedDate }}</div>
            </div>
            <div class="col-4">
              <div class="font-bold mb-2">Время:</div>
              <div>{{ formattedTime }}</div>
            </div>
            <div class="col-4">
              <div class="font-bold mb-2">Дата и время:</div>
              <div>{{ formattedDateTime }}</div>
            </div>
          </div>
        </div>

        <!-- Секция режима вкладок -->
        <div class="settings-section">
          <div class="flex align-items-center">
            <div>{{ $t('settings.tabMode') }}: &nbsp;</div>
            <div class="flex align-items-center gap-2">
              <ToggleSwitch v-model="tabMode" />
              <span style="font-size: 0.875rem; color: var(--text-color-secondary)">
                {{ tabMode ? $t('settings.tabModeEnabled') : $t('settings.tabModeDisabled') }}
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
  import Card from 'primevue/card';
  import ToggleSwitch from 'primevue/toggleswitch';
  import Select from 'primevue/select';
  import { useSettingsStore } from '../stores/settingsStore';
  import appConfigData from '../../app.config.ts';
  import { formatDateTime } from '../pages/Page2CatalogDetails/components/fields/DateTime.ts';

  const settingsStore = useSettingsStore();

  // Текущая дата для примеров форматирования
  const currentDate = new Date();

  // Примеры форматирования даты и времени
  const formattedDate = computed(() => {
    // Функция formatDateTime может обрабатывать объекты Date напрямую
    return formatDateTime(currentDate, settingsStore.locale, 'date');
  });

  const formattedTime = computed(() => {
    return formatDateTime(currentDate, settingsStore.locale, 'time');
  });

  const formattedDateTime = computed(() => {
    return formatDateTime(currentDate, settingsStore.locale, 'datetime');
  });

  // Получение списка доступных локалей из конфигурации
  const localeOptions = computed(() => {
    const locales = appConfigData.appConfig?.i18n?.locales || {};
    return Object.entries(locales).map(([code, name]) => ({
      code,
      name,
    }));
  });

  // Функция для получения названия локали по коду
  const getLocaleName = (localeCode: string): string => {
    const locales = appConfigData.appConfig?.i18n?.locales || {};
    return locales[localeCode] || localeCode;
  };

  // Вычисляемое свойство для двусторонней привязки языка
  const currentLanguage = computed({
    get: () => settingsStore.language,
    set: (value) => settingsStore.setLanguage(value),
  });

  const currentRegion = computed({
    get: () => settingsStore.region,
    set: (value) => settingsStore.setRegion(value),
  });

  // Получаем список доступных регионов
  const regions = computed(() => settingsStore.getAvailableRegions());

  // Используем вычисляемое свойство для двусторонней привязки режима отображения
  const tabMode = computed({
    get: () => settingsStore.useTabMode,
    set: (value) => settingsStore.setTabMode(value),
  });
</script>

<style scoped>
  .settings-page {
    padding: 1rem;
  }
</style>
