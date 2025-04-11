import { 
  LayoutField, 
  LayoutChoiceField 
} from '../stores/types/catalogDetailsAPIResponseOPTIONS.type';
import { useSettingsStore } from '../stores/settingsStore';


// Функция для получения значения по пути в объекте
function objectPathGet(obj: any, path: string | string[]): any {
  const parr = (path instanceof Array) ? path : path.split('.');
  let target = obj;
  for (let i=0; i<parr.length; i++) {
    if (!(target && target instanceof Object)) {
      return null;
    }
    const attr = parr[i];
    if (!(attr in target)) {
      return null;
    }
    target = target[attr];
  }
  return target;
}

// Функция для проверки, является ли объект полем связанного типа
function isLayoutRelatedField(object: any): boolean {
  return object && 
         object.class_name === 'LayoutRelatedField' && 
         'list_url' in object && 
         'view_name' in object && 
         'appl_name' in object;
}

// Функция для проверки, является ли объект встроенным макетом
function isViewSetInlineLayout(object: any): boolean {
  return object && 
         object.class_name === 'ViewSetInlineLayout';
}

// Тип для функции представления
type RepresentationFunction = (data: any) => any;

// Вспомогательная функция для получения функции представления
function getRepresentationFn(element: LayoutField): RepresentationFunction | null {
  if (element._jsItemReprFn !== undefined) {
    return element._jsItemReprFn as RepresentationFunction | null;
  }

  if (element.js_item_repr) {
    try {
      // eslint-disable-next-line no-new-func
      element._jsItemReprFn = new Function('data', element.js_item_repr) as RepresentationFunction;
    } catch (e) {
      console.error(`Error in js_item_repr for ${element.name}:`, e);
      element._jsItemReprFn = null;
    }
  } else {
    element._jsItemReprFn = null;
  }

  return element._jsItemReprFn as RepresentationFunction | null;
}

// Вспомогательная функция для получения карты выборов
function getChoicesMap(element: LayoutChoiceField) {
  if (element.chocesMap === undefined) {
    element.chocesMap = {};
    if (element.choices) {
      element.choices.reduce((obj, x) => (obj[x.value] = x, obj), element.chocesMap);
    }
  }
  return element.chocesMap;
}

// Набор функций для форматирования различных типов полей
export const fieldFormatters = {
  CharField: function(element: LayoutField, data: any) {
    return data[element.name];
  },

  ComputedField: function(element: LayoutField, data: any) {
    const reprFn = getRepresentationFn(element);
    if (!reprFn) return null;
    return reprFn(data);
  },

  DecimalField: function(element: LayoutField, data: any) {
    let value = data[element.name];
    if (typeof value === "string") {
      value = parseFloat(value);
    }
    if (value!=null) {
      const settingsStore = useSettingsStore();
      value = value.toFixed(settingsStore.roundDecimals);
    }
    return value;
  },

  ChoiceField: function(element: LayoutField, data: any) {
    let value = data[element.name];
    const val_obj = getChoicesMap(element as LayoutChoiceField)[value];
    if (val_obj) {
      value = val_obj.display_name;
    }
    return value;
  },

  DateTimeField: function(element: LayoutField, data: any) {
    let value = data[element.name];
    if (value != null) {
      const date = new Date(value);
      if (date) {
        value = (element.widget?.display === 'date') ?
          date.toLocaleDateString() :
          date.toLocaleString();
      }
    }
    return value;
  },

  DateField: function(element: LayoutField, data: any) {
    let value = data[element.name];
    if (value != null) {
      const date = new Date(value);
      if (date) {
        value = date.toLocaleDateString();
      }
    }
    return value;
  },

  TimeField: function(element: LayoutField, data: any) {
    let value = data[element.name];
    if (value != null) {
      const date = new Date(value);
      if (date) {
        value = date.toLocaleTimeString();
      }
    }
    return value;
  },

  PrimaryKeyRelatedLookupField: function(element: LayoutField, data: any) {
    const value = data[element.name];
    return (value instanceof Object) ? value.name : value;
  },

  ManyRelatedField: function(element: LayoutField & { list_view_items?: string }, data: any) {
    if (!isLayoutRelatedField(element)) {
      // fallback
      return fieldFormatters.CharField(element, data);
    };

    let value = data[element.name];
    if (value == null) {
      return value;
    }

    if (element.list_view_items) {
      if (value.length > 0) {
        const values: any[] = [];
        const limit = (value.length <= Number(element.list_view_items)+1 ) ? value.length : Number(element.list_view_items);

        for (let i=0; i<limit; i++) {
          let repr_value = value[i];
          if (repr_value && repr_value instanceof Object && repr_value.name) {
            repr_value = repr_value.name;
          }
          values.push(repr_value);
        }

        const items_left = value.length - limit;
        if (items_left > 0) {
          values.push(`${items_left} more`);
        }
        value = values;
      }
      else {
        value = null;
      }
    }
    else {
      value = `${value.length} more`;
    }

    return value;
  },

  ListSerializer: function(element: LayoutField & { list_view_items?: string, item_repr?: string, natural_key?: string[] }, data: any) {
    if (!isViewSetInlineLayout(element)) {
      // fallback
      return fieldFormatters.CharField(element, data);
    };

    let value = data[element.name];
    if (value == null) {
      return value;
    }

    if (element.list_view_items) {
      if (value.length > 0) {
        const reprFn = getRepresentationFn(element);
        let i;
        const newValue: any[] = [];
        const limit = (value.length <= Number(element.list_view_items)+1 ) ? value.length : Number(element.list_view_items);

        for (i=0; i<limit; i++) {
          const item = value[i];
          let repr_value: any = null;
          if (reprFn) {
            repr_value = reprFn(item);
          }
          else if (element.item_repr) {
            repr_value = objectPathGet(item, element.item_repr);
            if (repr_value && repr_value instanceof Object && repr_value.name) {
              repr_value = repr_value.name;
            }
          }
          else if (element.natural_key) {
            repr_value = [];
            element.natural_key.forEach((x: string) => {
              let value = item[x];
              if (value && value instanceof Object && value.name) {
                value = value.name;
              }
              if (value) {
                repr_value.push(value);
              }
            });

            repr_value = repr_value.join(':');
          }
          newValue.push( repr_value || item.__str__ || item.name || item.code || item.id );
        }
        i = value.length - limit;
        if (i > 0) {
            newValue.push(`${i} more`);
        }
        value = newValue;
      }
      else {
        value = null;
      }
    }
    else {
      value = `${value.length} more`;
    }

    return value;
  },

  WeakRelatedLookupField: function(element: LayoutField, data: any) {
    let value = data[element.name];
    if (value instanceof Object) {
      if (value.error)
        value = { error_message: value.error };
      else if (value.name)
        value = value.name;
      else
        value = value.refid;
    }
    return value;
  },
};

/**
 * Форматирует значение поля в зависимости от его типа
 * @param element Описание поля из макета
 * @param data Данные, содержащие значение поля
 * @returns Отформатированное значение
 */
export function formatFieldValue(element: LayoutField, data: any): any {
  const fieldClass = element.field_class;
  let formatter = fieldFormatters[fieldClass as keyof typeof fieldFormatters];
  
  if (!formatter) {
    // Если форматтер не найден, используем форматтер для текстового поля
    formatter = fieldFormatters.CharField;
  }
  
  return formatter(element, data);
}
