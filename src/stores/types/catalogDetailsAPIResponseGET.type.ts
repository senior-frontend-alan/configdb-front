/**
 * ответ GET запроса деталей каталога
 */

// Строка таблицы с детальной информацией каталога
export interface CatalogDetailItem {
  id: number;
  name: string;
  description: string | null;
  date_created: string;
  date_updated: string;
  [key: string]: any; // Для дополнительных полей, которые могут быть в ответе
}

// Ответ API с пагинацией (стандартный формат Django REST Framework) для GET запроса
export interface CatalogDetailsAPIResponseGET {
  count: number;        // Общее количество элементов
  next: string | null;  // URL следующей страницы или null
  previous: string | null; // URL предыдущей страницы или null
  results: CatalogDetailItem[]; // Массив элементов на текущей странице
}
