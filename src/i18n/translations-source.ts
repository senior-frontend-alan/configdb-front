// Все переводы хранятся в одном файле для удобства редактирования,
// а для работы приложения генерируются отдельные файлы в формате vue-i18n.
// После добавления новых переводов в этот файл
// просто запустите скрипт generate-translations.js для обновления сгенерированных файлов.

const translations = {
  // Переводы для авторизации
  auth: {
    login: {
      ru: 'Войти',
      en: 'Login',
    },
    logout: {
      ru: 'Выйти',
      en: 'Logout',
    },
    profile: {
      ru: 'Профиль',
      en: 'Profile',
    },
    username: {
      ru: 'Имя пользователя',
      en: 'Username',
    },
    password: {
      ru: 'Пароль',
      en: 'Password',
    },
    rememberMe: {
      ru: 'Запомнить меня',
      en: 'Remember me',
    },
    forgotPassword: {
      ru: 'Забыли пароль?',
      en: 'Forgot password?',
    },
    register: {
      ru: 'Зарегистрироваться',
      en: 'Register',
    },
    loginError: {
      ru: 'Ошибка входа',
      en: 'Login error',
    },
    loginSuccess: {
      ru: 'Вы успешно вошли в систему',
      en: 'You have successfully logged in',
    },
    logoutSuccess: {
      ru: 'Вы успешно вышли из системы',
      en: 'You have successfully logged out',
    },
    user: {
      ru: 'Пользователь',
      en: 'User',
    },
    role: {
      ru: 'Роль',
      en: 'Role',
    },
  },

  // Переводы для главной страницы
  home: {
    title: {
      ru: 'Главная страница',
      en: 'Home Page',
    },
    welcome: {
      ru: 'Добро пожаловать в приложение ConfigDB',
      en: 'Welcome to ConfigDB application',
    },
  },

  // Переводы для страницы Page1CatalogList
  page1CatalogList: {
    title: {
      ru: 'Каталог элементов',
      en: 'Catalog Items',
    },
    loading: {
      ru: 'Загрузка данных каталога...',
      en: 'Loading catalog data...',
    },
    noData: {
      ru: 'Данные каталога отсутствуют',
      en: 'No catalog data available',
    },
    moduleError: {
      ru: 'Не удалось определить модуль',
      en: 'Failed to determine module',
    },
    debugView: {
      ru: 'Отладочный вид',
      en: 'Debug View',
    },
    groupFilter: {
      ru: 'Фильтр по группе',
      en: 'Group Filter',
    },
    searchPlaceholder: {
      ru: 'Поиск по каталогу',
      en: 'Search catalog',
    },
  },

  // Переводы для страницы Page2CatalogDetails
  page2CatalogDetails: {
    title: {
      ru: 'Каталог без названия',
      en: 'Untitled Catalog',
    },
    refresh: {
      ru: 'Обновить данные',
      en: 'Refresh Data',
    },
    addRecord: {
      ru: 'Добавить запись',
      en: 'Add Record',
    },
    idPlaceholder: {
      ru: 'ID записи',
      en: 'Record ID',
    },
    goToRecord: {
      ru: 'Перейти',
      en: 'Go',
    },
    columnVisibility: {
      ru: 'Видимость колонок',
      en: 'Column Visibility',
    },
    tableScrollable: {
      ru: 'Прокручиваемая таблица',
      en: 'Scrollable Table',
    },
    loadingMore: {
      ru: 'Загрузка дополнительных данных...',
      en: 'Loading more data...',
    },
    allDataLoaded: {
      ru: 'Все данные загружены',
      en: 'All data loaded',
    },
    statusTotal: {
      ru: 'Всего',
      en: 'Total',
    },
    statusLoaded: {
      ru: 'Загружено',
      en: 'Loaded',
    },
    statusSelected: {
      ru: 'Выбрано',
      en: 'Selected',
    },
  },

  // Переводы для страницы Page3EditRecord
  page3EditRecord: {
    createTitle: {
      ru: 'Создание записи: {catalogName}',
      en: 'Create Record: {catalogName}',
    },
    editTitle: {
      ru: 'Редактирование записи: {catalogName} (ID: {id})',
      en: 'Edit Record: {catalogName} (ID: {id})',
    },
    backToList: {
      ru: 'Вернуться к списку',
      en: 'Back to List',
    },
    cancelChanges: {
      ru: 'Отменить изменения: {count}',
      en: 'Cancel Changes: {count}',
    },
    resetField: {
      ru: 'Поле сброшено',
      en: 'Field Reset',
    },
    resetFieldDetail: {
      ru: 'Изменения поля "{fieldName}" были отменены',
      en: 'Changes to field "{fieldName}" have been canceled',
    },
    saveSuccess: {
      ru: 'Запись успешно сохранена',
      en: 'Record saved successfully',
    },
    saveError: {
      ru: 'Ошибка при сохранении записи: {error}',
      en: 'Error saving record: {error}',
    },
    confirmLeave: {
      ru: 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?',
      en: 'You have unsaved changes. Are you sure you want to leave this page?',
    },
  },

  // Переводы для страницы настроек
  settings: {
    title: {
      ru: 'Настройки',
      en: 'Settings',
    },
    language: {
      ru: 'Язык',
      en: 'Language',
    },
    region: {
      ru: 'Регион',
      en: 'Region',
    },
    selectLanguage: {
      ru: 'Выберите язык',
      en: 'Select language',
    },
    selectRegion: {
      ru: 'Выберите регион',
      en: 'Select region',
    },
    formattingExamples: {
      ru: 'Примеры форматирования в текущей локали {locale}',
      en: 'Formatting examples in current locale {locale}',
    },
    date: {
      ru: 'Дата',
      en: 'Date',
    },
    time: {
      ru: 'Время',
      en: 'Time',
    },
    dateTime: {
      ru: 'Дата и время',
      en: 'Date and Time',
    },
    tabMode: {
      ru: 'Режим отображения каталога',
      en: 'Catalog Display Mode',
    },
    tabModeEnabled: {
      ru: 'Режим вкладок',
      en: 'Tab Mode',
    },
    tabModeDisabled: {
      ru: 'Режим списка',
      en: 'List Mode',
    },
    roundDecimals: {
      ru: 'Округление десятичных',
      en: 'Round Decimals',
    },
    darkMode: {
      ru: 'Темный режим',
      en: 'Dark Mode',
    },
    saveSuccess: {
      ru: 'Настройки сохранены',
      en: 'Settings saved',
    },
    saveError: {
      ru: 'Ошибка при сохранении настроек',
      en: 'Error saving settings',
    },
  },

  // Переводы для валидации форм
  validation: {
    required: {
      ru: 'Поле обязательно для заполнения',
      en: 'This field is required',
    },
    email: {
      ru: 'Введите корректный email',
      en: 'Please enter a valid email',
    },
    minLength: {
      ru: 'Минимальная длина: {min} символов',
      en: 'Minimum length: {min} characters',
    },
    maxLength: {
      ru: 'Максимальная длина: {max} символов',
      en: 'Maximum length: {max} characters',
    },
    numeric: {
      ru: 'Поле должно содержать только числа',
      en: 'This field must contain only numbers',
    },
    invalidFormat: {
      ru: 'Неверный формат',
      en: 'Invalid format',
    },
  },

  // Переводы для обработки ошибок
  errors: {
    notFound: {
      ru: 'Страница не найдена',
      en: 'Page not found',
    },
    serverError: {
      ru: 'Ошибка сервера',
      en: 'Server error',
    },
    networkError: {
      ru: 'Ошибка сети',
      en: 'Network error',
    },
    unauthorized: {
      ru: 'Требуется авторизация',
      en: 'Authentication required',
    },
    forbidden: {
      ru: 'Доступ запрещен',
      en: 'Access forbidden',
    },
    timeout: {
      ru: 'Превышено время ожидания запроса',
      en: 'Request timeout',
    },
  },
};
// Экспортируем объект с переводами
export default translations;
