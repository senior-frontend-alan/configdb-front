import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  // ===== Состояние стора =====
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  // ===== Настройки отображения (табы или список) =====
  const useTabMode = ref(false);
  const setTabMode = (value: boolean) => {
    useTabMode.value = value;
    // Здесь можно добавить сохранение в localStorage или на сервер
  };

  // ===== Настройки форматирования =====
  const roundDecimals = ref(2); // Количество знаков после запятой для десятичных чисел
  const setRoundDecimals = (value: number) => {
    roundDecimals.value = value;
    // Здесь можно добавить сохранение в localStorage или на сервер
  };

  // ===== Настройки локализации =====
  const language = ref(''); // Язык интерфейса (ISO 639)

  // Захардкоженный список основных регионов
  type RegionCode = 'RU' | 'US' | 'GB' | 'DE' | 'FR' | 'ES' | 'IT' | 'CN' | 'JP';

  // Описания регионов для отображения в интерфейсе
  const regionDescriptions: Record<RegionCode, string> = {
    RU: 'Россия',
    US: 'США',
    GB: 'Великобритания',
    DE: 'Германия',
    FR: 'Франция',
    ES: 'Испания',
    IT: 'Италия',
    CN: 'Китай',
    JP: 'Япония',
  };

  const region = ref<RegionCode>('RU'); // Регион для форматирования (ISO 3166)

  // Полная локаль для Intl API
  const locale = computed(() => `${language.value}-${region.value}`);

  // Получение списка доступных регионов
  const getAvailableRegions = () => {
    return Object.entries(regionDescriptions).map(([code, description]) => ({
      code,
      description,
    }));
  };

  const setLanguage = (value: string) => {
    const availableLocales = window.APP_CONFIG?.appConfig?.i18n?.locales || {};
    // Если локаль существует в списке доступных, устанавливаем ее
    if (Object.keys(availableLocales).includes(value)) {
      language.value = value;

      // Устанавливаем куку django_language
      const cookieValue = `django_language=${value};path=/;max-age=${365 * 10 * 24 * 60 * 60}`;
      document.cookie = cookieValue;

      document.documentElement.lang = value;
    } else {
      console.warn(`Локаль ${value} не найдена в списке доступных локалей`);
    }
  };

  // ===== Настройки формата даты =====
  // Формат локали в Intl API состоит из двух частей, разделенных дефисом:

  // Первая часть (ru) - это код языка по стандарту ISO 639, который определяет язык (русский, английский, немецкий и т.д.)
  // Вторая часть (RU) - это код региона/страны по стандарту ISO 3166, который определяет региональные особенности использования языка
  // Комбинация ru-EN технически допустима в синтаксисе, но не является стандартной локалью. Она означала бы "русский язык, используемый в Англии".
  // Таким образом, ru-RU означает "русский язык, используемый в России", что влияет на:
  // Формат даты и времени
  // Формат чисел (разделители тысяч и десятичных дробей)
  // Правила сортировки
  // Другие региональные особенности
  // Форматы даты: 'DD.MM.YYYY' (европейский), 'MM/DD/YYYY' (американский), 'YYYY-MM-DD' (ISO)

  const getCookie = (name: string): string | null => {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        return cookie.substring(name.length + 1);
      }
    }
    return null;
  };

  // Метод для установки региона
  const setRegion = (value: RegionCode) => {
    // Проверяем, что регион существует в нашем списке
    if (Object.keys(regionDescriptions).includes(value)) {
      region.value = value;
      localStorage.setItem('region', value);
    } else {
      console.warn(`Регион ${value} не найден в списке доступных регионов`);
    }
  };

  const initLanguage = () => {
    // Проверяем язык в куках
    const savedLocale = getCookie('django_language');
    const availableLocales = window.APP_CONFIG?.appConfig?.i18n?.locales || {};
    const defaultLanguage = window.APP_CONFIG?.appConfig?.i18n?.defaultLanguage || 'ru';

    if (savedLocale && Object.keys(availableLocales).includes(savedLocale)) {
      // Если в куках есть валидный язык, используем его
      language.value = savedLocale;
      document.documentElement.lang = savedLocale;
    } else {
      // 2) Проверяем системный язык
      const browserLang = navigator.language.split('-')[0];

      if (Object.keys(availableLocales).includes(browserLang)) {
        // Если системный язык есть в списке, используем его
        language.value = browserLang;
        // Устанавливаем куку django_language
        document.cookie = `django_language=${browserLang};path=/;max-age=${
          365 * 10 * 24 * 60 * 60
        }`; // 10 лет
        document.documentElement.lang = browserLang;
      } else {
        // 3) Используем язык по умолчанию из конфигурации
        language.value = defaultLanguage;
        // Устанавливаем куку django_language
        document.cookie = `django_language=${defaultLanguage};path=/;max-age=${
          365 * 10 * 24 * 60 * 60
        }`; // 10 лет
        document.documentElement.lang = defaultLanguage;
      }
    }

    // Инициализация региона из localStorage или по умолчанию
    const savedRegion = localStorage.getItem('region') as RegionCode | null;
    if (savedRegion && Object.keys(regionDescriptions).includes(savedRegion)) {
      region.value = savedRegion;
    }
  };

  // Вызываем инициализацию при создании стора
  initLanguage();

  return {
    // Состояние
    isInitialized,
    isLoading,
    error,

    // Настройки отображения
    useTabMode,
    setTabMode,

    // Настройки форматирования
    roundDecimals,
    setRoundDecimals,

    // Настройки локализации
    language,
    setLanguage,
    region,
    setRegion,
    locale,
    getAvailableRegions,
    initLanguage,
  };
});
