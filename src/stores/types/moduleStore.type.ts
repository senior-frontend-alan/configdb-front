// Типы для структуры данных каталога
import { OptionsResponse } from './optionsResponse.type';
import { 
  CatalogDetailsAPIResponseGET
} from './catalogDetailsAPIResponseGET.type.ts';

// Экспортируем типы для обратной совместимости
export * from './catalogDetailsAPIResponseGET.type.ts';

// Реэкспортируем типы для обратной совместимости
export * from './catalogsAPIResponseGET.type.ts';


// Расширенный ответ с полями GET, OPTIONS, viewname и href
export interface CatalogDetailResponse {
  GET: CatalogDetailsAPIResponseGET; // Данные полученные из GET запроса
  OPTIONS: OptionsResponse;     // Данные полученные из OPTIONS запроса
  viewname: string;             // Имя представления
  href: string;                 // URL, по которому были загружены данные
}

// Тип для хранения детальной информации каталога по viewname
export type CatalogDetails = {
  [viewname: string]: CatalogDetailResponse;
};