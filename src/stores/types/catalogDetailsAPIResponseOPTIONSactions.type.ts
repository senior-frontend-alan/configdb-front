// ------------------------------------------------------------------------------------------------------
// Базовый тип для поля в actions
export interface ActionField {
  type: string;
  required: boolean;
  read_only: boolean;
  label: string;
  max_length?: number;
  min_value?: number;
  max_value?: number;
}

// Тип для действий (POST, PUT, PATCH и т.д.)
export interface Actions {
  [method: string]: {
    [fieldName: string]: ActionField;
  };
}

// Тип для разрешенных действий
export interface PermittedAction {
  detail: boolean;
  methods: string[];
}

export interface PermittedActions {
  get: boolean;
  delete: boolean;
  patch: boolean;
  put: boolean;
  post: boolean;
  copy?: boolean;
  batch?: PermittedAction; // поле определяет разрешения для пакетных операций, первый столбец (чекбоксы в таблице)
  count?: PermittedAction;
  exportData?: PermittedAction;
  importData?: PermittedAction;
  lastTransaction?: PermittedAction;
  maxUpdated?: PermittedAction;
  [key: string]: boolean | PermittedAction | undefined;
}

// Основной тип для ответа OPTIONS запроса
export interface CatalogDetailsAPIResponseOPTIONS {
  name: string;
  description: string;
  renders: string[];
  parses: string[];
  actions: Actions;
  layout: Layout;
  transaction_required: boolean;
  permitted_actions: PermittedActions;
}

// Для обратной совместимости
export type OptionsResponse = CatalogDetailsAPIResponseOPTIONS;
