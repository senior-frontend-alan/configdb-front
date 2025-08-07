~/…/configdb-front $ zip -r configdb-front.zip . -x "_/node_modules/_" -x ".git/_" -x ".git/\*\*/_"

Проблема была в том, что при использовании шаблона исключения -x "_/node_modules/_" команда zip не всегда корректно исключает все файлы из директории node_modules. Особенно это касается файлов, которые находятся непосредственно в корне node_modules или имеют символические ссылки.

Нужно использовать опции -x с точными путями
bash
zip -r configdb-front.zip . -x "node_modules/*" ".git/*"

Или явно указать только нужные директории и файлы для включения в архив:

zip -r configdb-front.zip src dist public app.config.json package.json package-lock.json tsconfig.json vite.config.ts README.md
Это гарантирует, что в архив попадут только нужные файлы, а все остальные (включая node_modules и .git) будут исключены.

Архив теперь содержит:

Исходный код (src/)
Собранное приложение (dist/)
Публичные файлы (public/)
Конфигурационные файлы (app.config.json, package.json, tsconfig.json, vite.config.ts)
Документацию (README.md)
Этот архив можно легко передать другим разработчикам или использовать для деплоя приложения.
