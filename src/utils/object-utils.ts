import * as R from 'ramda';

export const isNilOrEmpty = R.either(R.isEmpty, R.isNil) as (value: unknown) => value is null | undefined;
export function isNotNilOrEmpty<T>(value: T | null | undefined): value is T {
  return !isNilOrEmpty(value);
}

export function isNotNil<T>(value: T | null | undefined): value is T {
  return !R.isNil(value);
}

export function deleteNilProperties<T>(obj: T): Partial<T> {
  const newObj = { ...obj };
  (Object.keys(newObj) as (keyof T)[]).forEach((key) => {
    if (R.isNil(newObj[key]) || isNestedEmpty(newObj[key])) {
      delete newObj[key];
    }
  });
  return newObj;
}

export function isNestedEmpty<T>(value: T): boolean {
  if (isNilOrEmpty(value)) {
    return true;
  }
  if (typeof value !== 'object' && !Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((v) => isNilOrEmpty(v) && isNestedEmpty(v));
}
