import { type ExtentionComponentDesc, _t, useNGCore } from './ngcore';
import { objectPathGet } from './utils';

export interface Action {
  detail: boolean,
  methods: string[],
}

export interface FilterSetField {
  filter_name: string,
  lookup_expr: string,
  label?: string,
  class_name: string,
  field_name: string,
}

export interface FieldSubstitution {
  [fieldname: string]: (string | number | string[] | number[]),
}

export interface Widget {
  [key: string]: any,
}

export interface Choice {
  value: (string|number),
  display_name: string
};

export enum LayoutClasses {
  LayoutSection = "LayoutSection",
  LayoutRow = "LayoutRow",
  LayoutTabControl = "LayoutTabControl",
  LayoutTabPanel = "LayoutTabPanel",
  LayoutComputedField = "LayoutComputedField",
  LayoutField = "LayoutField",
  LayoutCharField = "LayoutCharField",
  LayoutIntegerField = "LayoutIntegerField",
  LayoutRichEditField = "LayoutRichEditField",
  LayoutRelatedField = "LayoutRelatedField",
  LayoutChoiceField = "LayoutChoiceField",
  LayoutReverseReferenceField = "LayoutReverseReferenceField",
  ViewSetInlineLayout = "ViewSetInlineLayout",
  ViewSetInlineDynamicLayout = "ViewSetInlineDynamicLayout",
  ViewSetInlineDynamicModelLayout = "ViewSetInlineDynamicModelLayout",
  ViewSetLayout = "ViewSetLayout",
  LayoutChartField = "LayoutChartField",
}

interface LayoutElement {
  class_name: string,
  element_id: string,
  dynamic_component?:string,
  name: string,
  label?: string,
  help_text?: string,
  grid_cols?: number,
  widget?: Widget,
  show_if?: FieldSubstitution | string,
  enable_if?: FieldSubstitution | string,
  discr_keys?: string[],
}

function isLayoutElement(object: any): object is LayoutElement {
  return 'element_id' in object
    && 'class_name' in object;
}

type RepresentationFunction = (data: any) => any;

interface LayoutFieldBase extends LayoutElement {
  field_class: string,
  minimize?: boolean,
  js_item_repr?: string,
  _jsItemReprFn?: (RepresentationFunction | null),
}

function isLayoutFieldBase(object: any): object is LayoutFieldBase {
  return isLayoutElement(object) && 'field_class' in object;
}


export interface LayoutComputedField extends LayoutFieldBase {
  list_view_items?: string,
}

export function isLayoutComputedField(object: any): object is LayoutComputedField {
  return isLayoutFieldBase(object) && object.class_name === LayoutClasses.LayoutComputedField;
}


export interface LayoutField extends LayoutFieldBase {
  label: string,
  required?: boolean,
  allow_null?: boolean,
  default?: (string | number),
  read_only?: boolean,
  input_type?: string,
  pattern?: string,
  filterable?: boolean,
  sortable?: boolean,
  hidden?: boolean,
  fk_relations?: string[],
  weak_ref?: any,
  auto_field?: boolean,
  js_validators?: string[],
}

export function isLayoutField(object: any): object is LayoutField {
  return isLayoutFieldBase(object) && object.class_name !== LayoutClasses.LayoutComputedField;
}


export interface LayoutCharField extends LayoutField {
  max_length?: number,
  multiline?: boolean,
}

export function isLayoutCharField(object: any): object is LayoutCharField {
  return isLayoutFieldBase(object) && object.class_name === LayoutClasses.LayoutCharField;
}


export interface LayoutIntegerField extends LayoutField {
  min_value?: number,
  max_value?: number,
}

export function isLayoutIntegerField(object: any): object is LayoutIntegerField {
  return isLayoutFieldBase(object) && object.class_name === LayoutClasses.LayoutIntegerField;
}


export interface LayoutRelatedField extends LayoutField {
  list_url: string,
  view_name: string,
  appl_name: string,
  lookup?: boolean,
  multiple?: boolean,
  choices?: Choice[],
  related_fk?: FieldSubstitution,
  substitutions?: (string[] | FieldSubstitution),
  list_view_items?: number,
  display_list?: string[],
  item_repr?: string,
  js_item_repr?: string,
  obj_repr?: string[],
  auto_select_unique?: boolean,
}

export function isLayoutRelatedField(object: any): object is LayoutRelatedField {
  return isLayoutFieldBase(object) && object.class_name === LayoutClasses.LayoutRelatedField;
}


export interface LayoutRichEditField extends LayoutField {
  edit_mode: string
}

export function isLayoutRichEditField(object: any): object is LayoutRichEditField {
  return isLayoutFieldBase(object) && object.class_name === LayoutClasses.LayoutRichEditField;
}


export interface LayoutChoiceField extends LayoutField {
  choices?: Choice[],
  multiple?: boolean,
  chocesMap?: {[value: string | number]: Choice},
}

export function isLayoutChoiceField(object: any): object is LayoutChoiceField {
  return isLayoutFieldBase(object) && object.class_name === LayoutClasses.LayoutChoiceField;
}


export interface ViewSetInlineDynamicLayout extends LayoutField {
  layout_uri: string,
  layout_fk?: FieldSubstitution,
}

export function isViewSetInlineDynamicLayout(object: any): object is ViewSetInlineDynamicLayout {
  return isLayoutFieldBase(object) && object.class_name === LayoutClasses.ViewSetInlineDynamicLayout;
}



export interface LayoutReverseField extends LayoutElement {
  field_class: string,
  appl_name: string,
  view_name: string,
  model_label: string,
  url: string,
  to_field: string,
  fk_field: string,
  multiple?: boolean,
  queries: any,
}

export function isLayoutReverseField(object: any): object is LayoutReverseField {
  return isLayoutElement(object) && object.class_name === LayoutClasses.LayoutReverseReferenceField;
}


type LayoutGroupElement = (
  LayoutComputedField | LayoutField | LayoutCharField | LayoutIntegerField | LayoutRichEditField |
  LayoutChoiceField | LayoutReverseField | LayoutGroup
);

export interface LayoutGroup extends LayoutElement {
  elements: LayoutGroupElement[]
}

export function isLayoutGroup(object: any): object is LayoutGroup {
  return isLayoutElement(object) && 'elements' in object;
}


export interface ModelLayout extends LayoutGroup {
  view_name: string,
  display_list?: string[],
  filterable_list?: string[],
  sortable_list?: string[]
  natural_key: string[],
  primary_key: string,
  keyset?: string[],
  js_validators?: string[],
  item_repr?: string,
  js_item_repr?: string,
  hierarchy_parent?: string,
  hierarchy_child?: string,
  discriminator?: string,
  discriminator_map?: {[value: string]: (string | number)[]},
}

export function isModelLayout(object: any): object is ModelLayout {
  return isLayoutGroup(object) && 'view_name' in object;
}


export interface ViewSetInlineLayout extends ModelLayout {
  field_class: string,
  label: string,
  read_only?: boolean;
  allow_null?: boolean,
  allow_empty?: boolean,
  min_cardinality?: number,
  max_cardinality?: number,
  list_view_items?: number,
  js_default_order?: string[],
  batch_create_by?: string,
  schema?: any,
  domain?: string,
}

export function isViewSetInlineLayout(object: any): object is ViewSetInlineLayout {
  return isLayoutElement(object) && object.class_name === LayoutClasses.ViewSetInlineLayout;
}


export interface LayoutAttrTranspose {
  key_fields: string[],
  prefix: string,
  multiplicity?: boolean,
  start_date_field?: string,
  end_date_field?: string,
  value_use_field?: string,
  value_field?: string,
  value_struct_field?: string,
}

export interface ViewSetInlineDynamicModelLayout extends ViewSetInlineLayout {
  layout_uri: string,
  layout_fk?: FieldSubstitution,
  map_attrs: LayoutAttrTranspose,
}

export function isViewSetInlineDynamicModelLayout(object: any): object is ViewSetInlineDynamicModelLayout {
  return isLayoutElement(object) && object.class_name === LayoutClasses.ViewSetInlineDynamicModelLayout;
}


export interface ViewSetLayout extends ModelLayout {
  set_operations?: boolean,
  display_list_modal?: string[],
  extentions?: {
    [classname: string]: ExtentionComponentDesc[],
  }
}

export function isViewSetLayout(object: any): object is ViewSetLayout {
  return isLayoutElement(object) && object.class_name === LayoutClasses.ViewSetLayout;
}


export interface ReloadSettings {
  reload_auto?: boolean,
  default_timeout?: number,
  reload_details?: boolean,
}

export interface Details {
  appl_name: string,
  view_name: string,
  primary_field: string,
  show_if?: FieldSubstitution | string,
}

export interface MetaData {
  name: string,
  description?: string,
  layout?: ViewSetLayout,
  transaction_required?: boolean,
  permitted_actions: {[action: string]: (Action | boolean) },
  filterset_fields: FilterSetField[],
  search_fields: string[],
  model_name: string,
  verbose_name: string,
  verbose_name_plural: string,
  help?: string,
  reload_settings?: ReloadSettings,
  details_info?: Details
}


export enum SerializerFields {
  ListSerializer = "ListSerializer",
  ManyRelatedField = "ManyRelatedField",
}


export interface LayoutColumn {
  name: string,
  label: string,
  element: LayoutField,
  minimize?: boolean,
  width?: number,
  fixedWidth?: boolean,
  isListView?: boolean,
  isHuge?: boolean,
}

export function layoutColumns(root: ViewSetLayout, columns?: string[], minimizeLength: number = 30): LayoutColumn[] {

  function _pickColumns(root: ViewSetLayout, columns?: string[]): LayoutColumn[] {
    const cols: LayoutColumn[] = [];
    const pickedSet = new Set<string>();
    const colsOrder = {};

    if (columns) {
      columns.reduce((obj, attr, i) => (obj[attr] = i, obj), colsOrder);
    }

    function _traverseLayout(item: LayoutGroupElement) {
      if (isLayoutField(item)) {
        if (!pickedSet.has(item.name) && (!columns || item.name in colsOrder)) {
          pickedSet.add(item.name);
          cols.push({
            name: item.name,
            label: item.label,
            element: item,
            minimize: !!item.minimize || (isLayoutCharField(item) && (item.max_length ?? 0) < minimizeLength),
            isListView: (isLayoutRelatedField(item) && item.multiple || isViewSetInlineLayout(item) && item.max_cardinality !== 1)
                      && !!item.list_view_items && (item.list_view_items > 0),
            isHuge: (item.class_name === LayoutClasses.LayoutRichEditField),
          });
        }
        else if (isViewSetInlineLayout(item) && item.max_cardinality === 1) {
          item.elements.forEach(_traverseLayout);
        }
      }
      else if (isLayoutGroup(item)) {
        item.elements.forEach(_traverseLayout);
      }
    };

    root.elements.forEach(_traverseLayout);
    if (columns) {
      cols.sort((a, b) => (colsOrder[a.name] ?? -1) - (colsOrder[b.name] ?? -1));
    }
    return cols;
  }

  let cols: LayoutColumn[] = [];
  // 1. At first try to pick specified "columns"
  if (columns && columns.length) {
    cols = _pickColumns(root, columns);
  }

  // 2. otherwise, try to pick specified "display_list"
  if (!cols.length && root.display_list?.length) {
    cols = _pickColumns(root, root.display_list);
  }

  // 3. otherwise, try to pick any available
  if (!cols.length) {
    cols = _pickColumns(root);
  }

  return cols;
}


export function layoutMap(elements, map_fn, data) {
    if (elements) {
        for (let i=0; i<elements.length; i++) {
            const elem = elements[i];
            if (map_fn(data, elem) && elem.elements) {
                layoutMap(elem.elements, map_fn, data);
            }
        }
    }
}

export const LayoutInlineFormClasses = new Set([
  LayoutClasses.ViewSetInlineLayout,
  LayoutClasses.ViewSetInlineDynamicLayout,
  LayoutClasses.ViewSetInlineDynamicModelLayout
]);

export const LayoutSimpleFieldClasses = new Set([
  LayoutClasses.LayoutField,
  LayoutClasses.LayoutCharField,
  LayoutClasses.LayoutRelatedField,
  LayoutClasses.LayoutChoiceField,
  LayoutClasses.LayoutRichEditField,
  LayoutClasses.LayoutComputedField,
  LayoutClasses.LayoutReverseReferenceField,
  LayoutClasses.LayoutChartField,
]);


function __layoutElementGetRepresentationFn(element: LayoutFieldBase): (RepresentationFunction | null | undefined) {
  const js_item_repr = element.js_item_repr;
  if (js_item_repr && element._jsItemReprFn === undefined) {
    element._jsItemReprFn = null;
    try {
      const ngc = useNGCore();
      element._jsItemReprFn = (data: any): any => (new Function("row", "jsi", js_item_repr)(data, ngc.jsi));
    }
    catch (e: any) {
      throw Error(`__layoutElementGetRepresentationFn: element.js_item_repr="${js_item_repr}" function constructor error: ${e}`)
    }
  }

  return element._jsItemReprFn;
}

function __layoutElementGetChoicesMap(element: LayoutChoiceField) {
    if (element.chocesMap === undefined) {
        element.chocesMap = {};
        if (element.choices) {
            element.choices.reduce((obj, x) => (obj[x.value] = x, obj), element.chocesMap);
        }
    }
    return element.chocesMap;
}

const layout_field_class_repr_helpers = {
    CharField: function(element: LayoutField, data: any) {
      return data[element.name];
    },

    ComputedField: function(element: LayoutField, data: any) {
      const reprFn = __layoutElementGetRepresentationFn(element);
      if (!reprFn) return null;
      return reprFn(data);
    },

    DecimalField: function(element: LayoutField, data: any) {
      let value = data[element.name];
      if (typeof value === "string") {
        value = parseFloat(value);
      }
      if (value!=null) {
        const ngc = useNGCore();
        value = value.toFixed(ngc.appSettings.value.roundDecimals);
      }
      return value;
    },

    ChoiceField: function(element: LayoutField, data: any) {
      let value = data[element.name];
      const val_obj = __layoutElementGetChoicesMap(element)[value];
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
          const ngc = useNGCore();
          value = (element.widget?.display === 'date') ?
            date.toLocaleDateString(ngc.locale.value) :
            date.toLocaleString(ngc.locale.value);
        }
      }
      return value;
    },

    DateField: function(element: LayoutField, data: any) {
      let value = data[element.name];
      if (value != null) {
        const date = new Date(value);
        if (date) {
          const ngc = useNGCore();
          value = date.toLocaleDateString(ngc.locale.value);
        }
      }
      return value;
    },

    TimeField: function(element: LayoutField, data: any) {
      let value = data[element.name];
      if (value != null) {
        const date = new Date(value);
        if (date) {
          const ngc = useNGCore();
          value = date.toLocaleTimeString(ngc.locale.value);
        }
      }
      return value;
    },

    PrimaryKeyRelatedLookupField: function(element: LayoutField, data: any) {
        const value = data[element.name];
        return (value instanceof Object) ? value.name : value;
    },

    ManyRelatedField: function(element: LayoutField, data: any) {
      if (!isLayoutRelatedField(element)) {
        // fallback
        return layout_field_class_repr_helpers.CharField(element, data);
      };

      let value = data[element.name];
      if (value == null) {
        return value;
      }

      if (element.list_view_items) {
        if (value.length > 0) {
          const values: any[] = [];
          const limit = (value.length <= element.list_view_items+1 ) ? value.length : element.list_view_items;

          for (let i=0; i<limit; i++) {
            let repr_value = value[i];
            if (repr_value && repr_value instanceof Object && repr_value.name) {
              repr_value = repr_value.name;
            }
            values.push(repr_value);
          }

          const items_left = value.length - limit;
          if (items_left > 0) {
            values.push(`${items_left} ${_t('labels.more')}`);
          }
          value = values;
        }
        else {
          value = null;
        }
      }
      else {
        value = `${value.length} ${_t('labels.more')}`;
      }

      return value;
    },

    ListSerializer: function(element: LayoutField, data: any) {
      if (!isViewSetInlineLayout(element)) {
        // fallback
        return layout_field_class_repr_helpers.CharField(element, data);
      };

      let value = data[element.name];
      if (value == null) {
        return value;
      }

      if (element.list_view_items) {
        if (value.length > 0) {
          const reprFn = __layoutElementGetRepresentationFn(element);
          let i;
          const newValue: any[] = [];
          const limit = (value.length <= element.list_view_items+1 ) ? value.length : element.list_view_items;

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
              element.natural_key.forEach(x => {
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
              newValue.push(`${i} ${_t('labels.more')}`);
          }
          value = newValue;
        }
        else {
          value = null;
        }
      }
      else {
        value = `${value.length} ${_t('labels.more')}`;
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
}

export function layoutElementGetRepresentation(element: LayoutField | ViewSetInlineLayout, data: any): any {
  let func = layout_field_class_repr_helpers[element.field_class];
  if (!func) {
    // return { error_message: `Unsupported class: ${element.field_class}` };
    func = layout_field_class_repr_helpers.CharField;
  }
  return func(element, data);
}

export enum PythonDefault {
  Now = "<now>",
  Today = "<date.today>",
  Tomorrow = "<date_tomorrow>",
}

const PythonDefaultsMappings: {[key: string]: () => string | number} = {
  [PythonDefault.Now]: () => new Date().toISOString(),
  [PythonDefault.Today]: () => new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
  [PythonDefault.Tomorrow]: () => new Date(new Date().setHours(23, 59, 59, 0) + 1000).toISOString(),
}

export function getPythonDefaultValue(value: string): string | number | null {
  if ((value != null) && typeof value === "string" && value.startsWith('<') && value.endsWith('>')) {
    const js_func = PythonDefaultsMappings[value];
    return (js_func != null) ? js_func() : null;
  }
  return value;
}