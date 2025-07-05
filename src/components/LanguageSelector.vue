<template>
  <div>
    <!-- Кнопка выбора языка -->
    <Button
      :label="settingsStore.language"
      icon="pi pi-globe"
      link
      @click="(event) => localeMenu && localeMenu.toggle(event)"
      :aria-label="$t('settings.language')"
    />

    <!-- Меню выбора языка -->
    <Menu id="language-menu" ref="localeMenu" :model="localeMenuItems" :popup="true" />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import Button from 'primevue/button';
  import Menu from 'primevue/menu';
  import { useSettingsStore } from '../stores/settingsStore';
  import appConfigData from '../../app.config.ts';

  const { t } = useI18n();

  // Получаем хранилище настроек
  const settingsStore = useSettingsStore();

  // Ссылка на меню выбора языка
  const localeMenu = ref<any>(null);

  // Формируем пункты меню языков
  const localeMenuItems = computed(() => {
    const locales = appConfigData.appConfig?.i18n?.locales || {};
    return Object.entries(locales).map(([code, name]) => ({
      label: name,
      command: () => {
        settingsStore.setLanguage(code);
        console.log(`${t('settings.language')} ${t('common.success')}: ${code} (${name})`);
      },
    }));
  });
</script>
