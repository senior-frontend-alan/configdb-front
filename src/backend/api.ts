export enum ApiMode {
  Short = "short",
  Full = "full",
}

export type Query = Record<string, string>;
export type Pk = string | number;


export interface PartialResource {
  [key: string]: any;
}


export interface ReferenceResolved extends PartialResource {
  id: Pk;
  name?: string;
}

export interface WeakReferenceResolved extends PartialResource {
  refid: Pk;
  name: string;
}

export interface WeakReferenceError extends PartialResource {
  refid: Pk;
  error: string;
}

export type WeakReference = WeakReferenceResolved | WeakReferenceError;

export function isWeakReference(value: FieldValue): value is WeakReference {
  return value instanceof Object && ('refid' in value || 'name' in value);
}

export type FieldValue = Resource | WeakReference | ReferenceResolved | number | string | null | boolean;

export interface Resource extends PartialResource {
  id: Pk;
  name?: string;
  __str__?: string;
  code?: string;
  [name: string]: FieldValue | FieldValue[] | undefined;
}

export function isResource(value: FieldValue): value is Resource {
  return value instanceof Object && 'id' in value;
}

export interface ErrorObject {
  non_field_errors?: string | string[],
  [fieldname: string]: string | string[] | undefined | ErrorObject,
}