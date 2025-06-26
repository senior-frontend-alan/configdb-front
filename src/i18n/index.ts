import { createI18n } from 'vue-i18n';
import { useSettingsStore } from '../stores/settingsStore';

// Импортируем сгенерированные файлы переводов
// Эти файлы создаются скриптом generate-translations.js
import ru from './generated/ru';
import en from './generated/en';

type MessageSchema = Record<string, any>;
type MessageLanguages = {
  [key: string]: MessageSchema;
};

// Используем предварительно сгенерированные переводы
const messages: MessageLanguages = {
  ru,
  en,
};

/**
 * Создает экземпляр i18n с настройками из settingsStore
 * @returns Экземпляр i18n
 */
export function setupI18n() {
  const settingsStore = useSettingsStore();

  // Создаем экземпляр i18n
  // Вызов useI18n() в компоненте не требуется, поскольку в настройках Vue I18n у нас уже включена опция globalInjection: true.
  const i18n = createI18n({
    legacy: false, // Используем Composition API
    globalInjection: true, // Добавляем глобальные методы $t, $tc и т.д. втоматически делает доступными глобальные методы перевода в шаблонах компонентов
    locale: settingsStore.language || 'ru',
    fallbackLocale: 'ru', // Запасной язык, если перевод не найден
    messages,
  });

  // Обновляем локаль при изменении языка в сторе
  settingsStore.$subscribe((_mutation, state) => {
    if (i18n.global.locale.value !== state.language) {
      i18n.global.locale.value = state.language;
    }
  });

  return i18n;
}

// Экспортируем типы для использования в компонентах
export type { MessageSchema };
