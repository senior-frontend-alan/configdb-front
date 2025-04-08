import { type ExtentionComponentDesc } from './ngcore';
import { objectPathGet } from './utils.js';
import {
  type Resource,
  type FieldValue,
  type Pk,
  type WeakReference,
  isResource,
  isWeakReference,
} from './api';

type JSInterface = any;

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
  value: string | number,
  display_name: string
}

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

interface LayoutFieldBase extends LayoutElement {
  field_class: string,
  label: string,
  minimize?: boolean,
  js_item_repr?: string,
  multiple?: boolean,
  list_view_items?: number,
}

function isLayoutFieldBase(object: any): object is LayoutFieldBase {
  return isLayoutElement(object) && 'field_class' in object;
}


export interface LayoutField extends LayoutFieldBase {
  required?: boolean,
  allow_null?: boolean,
  default?: (string | number | object | (string | number | object)[]),
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
  choices?: Choice[],
  related_fk?: FieldSubstitution,
  substitutions?: (string[] | FieldSubstitution),
  display_list?: string[],
  item_repr?: string,
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
  choices: Choice[],
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
  LayoutField | LayoutCharField | LayoutIntegerField | LayoutRichEditField |
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
  width?: number,
  fixedWidth?: boolean,
  isListView?: boolean,
  isHuge?: boolean,
  field: FieldClass,
}

export interface DisplayOptions {
  locale?: string,
  roundDecimals?: number,
  minimizeLength?: number,
}

const DefaultDisplayOptions: DisplayOptions = {
  roundDecimals: 2,
  minimizeLength: 30,
}

export function layoutColumns(root: ViewSetLayout, jsi: JSInterface, columns?: string[], options?: DisplayOptions): FieldClass[] {

  const fields: Fields = {};
  const _options = {
    ...DefaultDisplayOptions,
    ...options,
  };

  function _pickColumns(root: ViewSetLayout, columns?: string[]): FieldClass[] {
    const cols: FieldClass[] = [];
    const pickedSet = new Set<string>();
    const colsOrder: {[name: string]: number} = {};

    if (columns) {
      columns.reduce((obj, attr, i) => (obj[attr] = i, obj), colsOrder);
    }

    function _traverseLayout(item: LayoutGroupElement) {
      if (isLayoutFieldBase(item)) {
        if (!pickedSet.has(item.name) && (!columns || item.name in colsOrder)) {
          const fieldClass = isViewSetInlineLayout(item) ? InlineObjectField
            : FieldClassRepresentation[item.field_class] ?? FieldClassRepresentation._default;
          const field = new fieldClass(item, jsi, fields, _options);
          fields[item.name] = field;

          pickedSet.add(item.name);
          cols.push(field);
        }
        else if (isViewSetInlineLayout(item) && item.max_cardinality === 1) {
          item.elements.forEach(_traverseLayout);
        }
      }
      else if (isLayoutGroup(item)) {
        item.elements.forEach(_traverseLayout);
      }
    }

    root.elements.forEach(_traverseLayout);
    if (columns) {
      cols.sort((a, b) => (colsOrder[a.name] ?? -1) - (colsOrder[b.name] ?? -1));
    }
    return cols;
  }

  let cols: FieldClass[] = [];
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

export function layoutMap(elements: LayoutElement[], map_fn: (data: any, el: LayoutElement) => boolean, data: any) {
  if (elements == null) return;

  for (let i=0; i<elements.length; i++) {
      const elem = elements[i];
      if (map_fn(data, elem) && isLayoutGroup(elem)) {
          layoutMap(elem.elements, map_fn, data);
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

export interface Fields {
  [name: string]: FieldClass
}

export interface StringReprError {
  error: string,
}

export function isStringReprError(s: string | StringReprError): s is StringReprError {
  return (s instanceof Object && 'error' in s);
}

export interface ListStringRepr {
  values: (string | StringReprError)[];
  total: number;
}

abstract class AbstractField<T> {
  element: LayoutField;
  jsi: JSInterface;
  options: DisplayOptions;
  fields: Fields;

  compFn?: (value: Resource) => FieldValue;
  reprFn?: (value: T | null) => string | StringReprError | null;
  choicesMap?: {[value: string]: string};

  constructor (element: LayoutField, jsi: JSInterface, fields: Fields,
      options?: DisplayOptions)
  {
    this.element = element;
    this.jsi = jsi;
    this.fields = fields;
    this.options = options ?? {};

    if (element.class_name === LayoutClasses.LayoutComputedField) {
      if (!element.js_item_repr) {
        throw Error('Improperly configured, `js_item_repr` is requred for computed field');
      }

      try {
        const innerFn = new Function("row", "jsi", "fields", element.js_item_repr);
        this.compFn = (data: Resource): FieldValue => (innerFn(data, jsi, this.fields));
      } catch (e: any) {
        throw Error(`AbstractField: element.js_item_repr="${element.js_item_repr}" function constructor error: ${e}`)
      }
    }
    else if (element.js_item_repr) {
      try {
        const innerFn = new Function("row", "jsi", "fields", element.js_item_repr);
        this.reprFn = (data: T | null): string | null => (innerFn(data, jsi, this.fields));
      } catch (e: any) {
        throw Error(`AbstractField: element.js_item_repr="${element.js_item_repr}" function constructor error: ${e}`)
      }
    }

    if ((isLayoutChoiceField(element) || isLayoutRelatedField(element)) && element.choices) {
      this.choicesMap = {};
      element.choices.reduce((obj, x) => (obj[x.value.toString()] = x.display_name, obj), this.choicesMap);
    }
  }

  get multiple(): boolean {
    return this.element.multiple ?? false;
  }

  get name(): string {
    return this.element.name;
  }

  get label(): string {
    return this.element.label;
  }

  get isClob(): boolean {
    return false;
  }

  protected abstract _asValue(value: FieldValue): T | null;

  protected abstract _asString(value: T | null): string | StringReprError | null;

  isSingle(value: unknown): value is FieldValue {
    const single = value !== undefined && !this.multiple;
    if (single && value !== null && value instanceof Array) {
      throw Error(`Field "${this.element.element_id}" error: got Array value for single-value field`);
    }
    return single;
  }

  isMultiple(value: unknown): value is FieldValue[] {
    const multiple = value !== undefined && this.multiple;
    if (multiple && value !== null && !(value instanceof Array)) {
      throw Error(`Field "${this.element.element_id}" error: got non-Array value for multiple-value field`);
    }
    return multiple;
  }

  rawValue(data: Resource): unknown {
    return this.compFn ? this.compFn(data) : data[this.element.name];
  }

  asValue(data: Resource): T | T[] | undefined | null {
    const value = this.rawValue(data);

    if (this.isSingle(value)) {
      return this._asValue(value);
    }
    else if (this.isMultiple(value)) {
      return value.map(x => this._asValue(x))
        .filter((x): x is T => x != null);
    }
    else {
      return undefined;
    }
  }

  asString(data: Resource): string | StringReprError | ListStringRepr | null | undefined {
    const value = this.rawValue(data);

    if (this.isSingle(value)) {
      const _value = this._asValue(value);
      return this.reprFn ? this.reprFn(_value) : this._asString(_value)
    }
    else if (this.isMultiple(value)) {
      if (value === null) return null;

      if (this.element.list_view_items && this.element.list_view_items > 0
          && value.length > this.element.list_view_items)
      {
        const _reprs: (string | StringReprError)[] = [];
        for (const x of value) {
          const _value = this._asValue(x);
          const _repr = this.reprFn ? this.reprFn(_value) : this._asString(_value);
          if (_repr != null && _reprs.push(_repr) == this.element.list_view_items) {
            break;
          }
        }
        return {
          values: _reprs,
          total: value.length
        }
      }
      else {
        return {
          values: value.map(x => {
            return this.reprFn ? this.reprFn(this._asValue(x)) : this._asString(this._asValue(x))
          }).filter((x): x is string => x != null),
          total: value.length
        }
      }
    }
    else {
      return undefined;
    }
  }

  getDefault(): FieldValue | undefined {
    if (!isLayoutField(this.element)) return undefined;

    const value = this.element.default;
    if (value == null) return value;

    if (typeof value === 'object') {
      return JSON.parse(JSON.stringify(value));
    }
    else if (typeof value === 'string') {
      getPythonDefaultValue(value);
    }
    else {
      return value;
    }
  }
}

class IntegerField extends AbstractField<number> {

  protected _asValue(value: FieldValue): number | null {
    if (value == null) return null;
    if (value instanceof Object) {
      throw Error('Imporperly configured');
    }
    if (typeof value == 'boolean') return value ? 1 : 0;
    const numValue = (typeof value !== "number") ? parseInt(value, 10) : value;
    return Number.isInteger(numValue) ? numValue : Math.round(numValue);
  }

  protected _asString(value: number | null): string | null {
    return value == null ? null : value.toFixed();
  }

}

class DecimalField extends AbstractField<number> {

  protected _asValue(value: FieldValue): number | null {
    if (value == null) return null;
    if (typeof value === 'object') {
      throw Error('Imporperly configured');
    }
    if (typeof value === 'boolean') return value ? 1 : 0;
    return (typeof value !== "number") ? parseFloat(value) : value;
  }

  protected _asString(value: number | null): string | null {
    return value == null ? null : value.toFixed(this.options.roundDecimals ?? 2);
  }

}

class CharField extends AbstractField<string> {

  get isClob(): boolean {
    return isLayoutRichEditField(this.element);
  }

  protected _asValue(value: FieldValue): string | null {
    return value == null ? null : value.toString();
  }

  protected _asString(value: string | null): string | null {
    return value;
  }

}

class ChoiceField extends AbstractField<string | number> {

  protected _asValue(value: FieldValue): string | number | null {
    if (value == null) return null;
    if (value instanceof Object) {
      throw Error('Imporperly configured');
    }
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value;
  }

  protected _asString(value: string | number | null): string | null {
    return value == null ? null : this.choicesMap?.[value.toString()] ?? `<value: ${value}>`;
  }

}

class DateTimeField extends AbstractField<Date> {

  protected _asValue(value: FieldValue): Date | null {
    if (value == null) return null;
    if (value instanceof Object || typeof value === 'boolean') {
      throw Error('Imporperly configured');
    }
    return new Date(value);
  }

  protected _asString(value: Date | null): string | null {
    return value == null ? null :
      (this.element.widget?.display === 'date' ?
        value.toLocaleDateString(this.options.locale) :
        value.toLocaleString(this.options.locale));
  }
}

class DateField extends DateTimeField {
  protected _asString(value: Date | null): string | null {
    return value == null ? null : value.toLocaleDateString(this.options.locale);
  }
}

class TimeField extends AbstractField<Date> {

  protected _asValue(value: FieldValue): Date | null {
    if (value == null) return null;
    if (value instanceof Object || typeof value === 'boolean') {
      throw Error('Imporperly configured');
    }
    return new Date(typeof value === 'number' ? value : `1970-01-01T${value}Z`);
  }

  protected _asString(value: Date | null): string | null {
    return value == null ? null : value.toLocaleTimeString(this.options.locale, { timeZone: "UTC" });
  }
}

class RelatedField extends AbstractField<Resource | Pk> {


  protected _asValue(value: FieldValue): Resource | Pk | null {
    if (value == null) return null;
    if (typeof value === 'boolean' ||
      (value instanceof Object && !isResource(value)))
    {
      throw Error('Imporperly configured');
    }
    return value;
  }

  protected _asString(value: Resource | Pk | null): string | null {
    if (value == null) return null;
    if (value instanceof Object) {
      return value.name ?? `<id: ${value.id}>`;
    }
    else if (this.choicesMap) {
      return this.choicesMap[value.toString()] ?? `<id: ${value}>`;
    }
    else {
      return `<id: ${value}>`;
    }
  }

}

class WeakRelatedLookupField extends AbstractField<WeakReference | string | number> {

  protected _asValue(value: FieldValue): WeakReference | string | number | null {
    if (value == null) return null;
    if (typeof value === 'boolean' ||
      (value instanceof Object && !isWeakReference(value)))
    {
      throw Error('Imporperly configured');
    }
    return value;
  }

  protected _asString(value: WeakReference | string | number | null): string | null {
    if (value == null) return null;
    if (isWeakReference(value)) {
      return value.name ?? (value.error ? {error: value.error} : `<id: ${value.id}>`);
    }
    else {
      return value.toString();
    }
  }

}

class InlineObjectField extends AbstractField<Resource> {

  get multiple(): boolean {
    // Backend Bug-fix. For `ViewSetInlineLayout` backend doesn't fill `multiply`.
    return isViewSetInlineLayout(this.element) ? (this.element.max_cardinality ?? 2) > 1
      : super.multiple;
  }

  protected _asValue(value: FieldValue): Resource | null {
    if (value == null) return null;
    if (!isResource(value)) {
      throw Error('Imporperly configured');
    }
    return value;
  }

  protected _asString(value: Resource | null): string | null {
    if (value == null) return null;

    let repr: string | null = null;
    if (isViewSetInlineLayout(this.element)) {
      if (this.element.item_repr) {
        const innerValue = objectPathGet(value, this.element.item_repr);
        if (innerValue != null && !(innerValue instanceof Array)) {
          if (innerValue instanceof Object) {
            repr = innerValue.__str__ ?? innerValue.name ?? innerValue.code ?? innerValue.id ?? repr;
          }
          else {
            repr = innerValue;
          }
        }
      }

      // fallback to natural_key
      if (this.element.natural_key) {
        repr = this.element.natural_key
          .map(x => {
            const keyValue = value[x];
            if (!(keyValue instanceof Array) && keyValue instanceof Object) {
              return keyValue.__str__ ?? keyValue.name ?? keyValue.code ?? keyValue.id;
            }
            return keyValue;
          })
          .filter(x => x != null)
          .join(':');
      }
    }

    // fallback to predefined representaion fields
    if (repr == null) {
      repr = value.__str__ ?? value.name ?? value.code ?? (value.id ? `<id: ${value.id}>` : repr);
    }
    return repr
  }
}

type FieldClassTypes = typeof IntegerField | typeof DecimalField | typeof CharField | typeof ChoiceField |
  typeof DateTimeField | typeof TimeField | typeof RelatedField | typeof WeakRelatedLookupField | typeof InlineObjectField;

type FieldClass = IntegerField | DecimalField | CharField | ChoiceField |
  DateTimeField | TimeField | RelatedField | WeakRelatedLookupField | InlineObjectField;

export const FieldClassRepresentation: {[name: string]: FieldClassTypes}= {
  IntegerField: IntegerField,
  DecimalField: DecimalField,
  CharField: CharField,
  ChoiceField: ChoiceField,
  DateTimeField: DateTimeField,
  DateField: DateField,
  TimeField: TimeField,
  PrimaryKeyRelatedLookupField: RelatedField,
  ManyRelatedField: RelatedField,
  WeakRelatedLookupField: WeakRelatedLookupField,
  ListSerializer: InlineObjectField,
  Serializer: InlineObjectField,
  ComputedField: CharField,
  _default: CharField,
}

