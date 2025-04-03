// Типы для структуры данных каталога

// Методы, доступные для элемента каталога
export interface CatalogItemMethods {
  batch: boolean;
  copy: boolean;
  count: boolean;
  delete: boolean;
  exportData: boolean;
  get: boolean;
  importData: boolean;
  lastTransaction: boolean;
  maxUpdated: boolean;
  patch: boolean;
  post: boolean;
  put: boolean;
}

// Элемент каталога
export interface CatalogItem {
  name: string;
  verbose_name: string;
  description: string | null;
  appl_name: string;
  viewname: string;
  href: string;
  methods: CatalogItemMethods;
  display: boolean;
  export: boolean;
  discriminators: any | null;
  tags: string[] | null;
  model_name: string;
  model_info: {
    date_updated?: string;
    valid_date?: string;
    content_type?: number;
    [key: string]: any;
  } | null;
}

// Группа каталога
export interface CatalogGroup {
  name: string;
  verbose_name: string;
  description: string | null;
  display: boolean;
  items: CatalogItem[];
  tags: string[] | null;
}

// Результат запроса getCatalog
export type CatalogResponse = CatalogGroup[];
