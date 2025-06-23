# Инструкция по запуску собранного приложения из директории `dist`

### О собранном проекте

Собранный проект представляет собой SPA (одностраничное приложение) на основе Vue 3, скомпилированное в статические HTML, CSS и JavaScript файлы. Приложение использует внешний файл конфигурации `app.config.json` для настройки API эндпоинтов и других параметров во время выполнения.

### Шаг 1: Установка простого HTTP-сервера

Для работы приложения нужен HTTP-сервер по следующим причинам:

1. **Загрузка модулей JavaScript**: Браузеры блокируют загрузку JavaScript-модулей при открытии файлов напрямую с файловой системы (CORS-ограничения).
2. **Маршрутизация SPA**: Если пользователь обновляет страницу (F5), находясь на URL типа /profile то без HTTP-сервера браузер попытается найти папку profile на компьютере, а не обработать это через JavaScript. HTTP-сервер решает эту проблему, перенаправляя все запросы на index.html, что позволяет роутеру обрабатывать URL правильно.

Выберите один из вариантов:

**Вариант A: Использование Node.js и `serve` (рекомендуется)**

1. Убедитесь, что у вас установлен Node.js и npm:

```bash
# Проверка версии Node.js
node --version
# Проверка версии npm
npm --version
```

Если команды выдают ошибку, установите Node.js с сайта [nodejs.org](https://nodejs.org/)

```bash
# Установка serve глобально
sudo npm install -g serve

# Запуск сервера из директории dist
serve -s dist
```

**Вариант B: Использование Python (если установлен)**

```bash
# Python 3
cd dist
python -m http.server 8080

# Python 2
cd dist
python -m SimpleHTTPServer 8080
```

## Шаг 2: Настройка конфигурации

1. Убедитесь, что файл `app.config.json` находится в корне директории `dist`
2. Проверьте, что в `app.config.json` указаны правильные URL-адреса API:
   - URL должны быть абсолютными (например, `http://localhost:5173/api/v1/session/`)
   - Если API находится на другом сервере, укажите соответствующие адреса

## Шаг 3: Настройка CORS (если API на другом домене)

Если API находится на том же сервере, что и приложение, то CORS не требуется.
Если ваш API находится на другом домене или порту:

1. Убедитесь, что сервер API настроен для поддержки CORS
2. На сервере API должны быть разрешены заголовки:
   - `Access-Control-Allow-Origin: *` (или конкретный домен)
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE`
   - `Access-Control-Allow-Headers: Content-Type, X-CSRFToken`
   - `Access-Control-Allow-Credentials: true`

Если API на Django Rest Framework:
Настройка CORS на Django
https://pypi.org/project/django-cors-headers/

```python

CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = (
    "x-csrftoken",
    "content-type",
)

CORS_EXPOSE_HEADERS = ['X-CSRFToken']  # Важно! Иначе JS не имеет доступа к заголовку X-CSRFToken

INSTALLED_APPS = [
    ...
    "corsheaders",
]


MIDDLEWARE = [
    ...
    "corsheaders.middleware.CorsMiddleware",
    'django.middleware.common.CommonMiddleware',
    ...
]
```

## Шаг 4: Задать правильные маршруты в app.config.json

1. URI аутентификации `appConfig.routes.apiSession`

```json

{

  "appConfig": {

    ...

    "routes": {

      ...

      "apiSession": "http://localhost:8000/api/v1/session/"

      ...

    },

  ...

}

```

2. Модули приложений `modules`

```json

{

  ...

  "modules": [

    ...

    {

      "label": "DRA Config",

      "routes": {

        "getCatalog": "http://localhost:8000/api/v1/draConfig/-catalog/",

      }

    }

    ...

  ]

}

```

## Шаг 5: Запуск приложения

1. Откройте браузер и перейдите по адресу, указанному в выводе сервера
   - Обычно это `http://localhost:5000` (для serve) или `http://localhost:8080` (для Python)
2. Приложение должно загрузиться и автоматически прочитать конфигурацию из `app.config.json`

## Шаг 6: Устранение возможных проблем

Если возникают ошибки:

1. Проверьте консоль браузера (F12) на наличие ошибок
2. Убедитесь, что API-сервер запущен и доступен
3. Проверьте, что URL в `app.config.json` соответствуют реальным адресам API
4. При проблемах с CORS настройте заголовки на API-сервере или используйте прокси

## Примечание

Для продакшн-окружения рекомендуется использовать полноценный веб-сервер, такой как Nginx или Apache, вместо простых решений, указанных выше.

```

```
