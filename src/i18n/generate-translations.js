#!/usr/bin/env node

/**
 * Простой скрипт для генерации файлов переводов из ru-en.ts
 * Для каждого языка создается отдельный файл в формате, понятном для vue-i18n.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем текущую директорию и корень проекта
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Фиксированные пути к файлам
const inputFile = path.join(__dirname, 'translations-source.ts');
const outputDir = path.join(__dirname, 'generated');
const ruOutputFile = path.join(outputDir, 'ru.js');
const enOutputFile = path.join(outputDir, 'en.js');

/**
 * Извлекает переводы для конкретного языка из объединенной структуры
 * @param {Object} obj Объект с переводами
 * @param {string} locale Код языка (ru, en)
 * @returns {Object} Объект с переводами для указанного языка
 */
function extractTranslationsForLocale(obj, locale) {
  const result = {};

  for (const key in obj) {
    const value = obj[key];

    // Если значение - объект с полями ru/en
    if (value && typeof value === 'object' && (value.ru !== undefined || value.en !== undefined)) {
      result[key] = value[locale] || value.ru; // Используем ru как запасной вариант
    }
    // Если это вложенный объект (например, группа переводов)
    else if (value && typeof value === 'object') {
      result[key] = extractTranslationsForLocale(value, locale);
    }
    // Если это просто строка (старый формат)
    else {
      result[key] = value;
    }
  }

  return result;
}

async function main() {
  try {
    // Создаем директорию для сгенерированных файлов, если её нет
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Читаем содержимое файла с переводами
    console.log(`Чтение файла переводов: ${inputFile}`);
    const fileContent = fs.readFileSync(inputFile, 'utf8');

    // Создаем временный JavaScript файл с переводами
    const tempFile = path.join(outputDir, '_temp_translations.js');

    // Преобразуем TypeScript в JavaScript и добавляем экспорт
    const jsContent = fileContent
      .replace(/\/\/.*$/gm, '') // Удаляем комментарии
      .replace(/export\s+default\s+translations;?/g, 'export default translations;');

    // Записываем временный файл
    fs.writeFileSync(tempFile, jsContent);

    // Динамически импортируем модуль
    console.log('Импортируем переводы...');
    const translationsModule = await import(`file://${tempFile}?t=${Date.now()}`);
    const translationsObj = translationsModule.default;

    // Удаляем временный файл
    fs.unlinkSync(tempFile);

    // Преобразуем переводы для каждого языка
    console.log('Обрабатываем переводы...');
    const ruTranslations = extractTranslationsForLocale(translationsObj, 'ru');
    const enTranslations = extractTranslationsForLocale(translationsObj, 'en');

    // Сохраняем результат в отдельные файлы
    console.log(`Сохранение русских переводов: ${ruOutputFile}`);
    fs.writeFileSync(ruOutputFile, `export default ${JSON.stringify(ruTranslations, null, 2)};`);

    console.log(`Сохранение английских переводов: ${enOutputFile}`);
    fs.writeFileSync(enOutputFile, `export default ${JSON.stringify(enTranslations, null, 2)};`);

    console.log('Генерация переводов завершена успешно!');
  } catch (error) {
    console.error('Ошибка при генерации переводов:', error);
    process.exit(1);
  }
}

main();
