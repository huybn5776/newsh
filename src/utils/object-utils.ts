import equal from 'fast-deep-equal';
import * as R from 'ramda';

import { NonNullableProps } from '@/utils/type-utils';

export const isNilOrEmpty = R.either(R.isEmpty, R.isNil) as (value: unknown) => value is null | undefined;
export function isNotNilOrEmpty<T>(value: T | null | undefined): value is T {
  return !isNilOrEmpty(value);
}

export function isNotNil<T>(value: T | null | undefined): value is T {
  return !R.isNil(value);
}

export function deleteNilProperties<T extends object>(obj: T): Partial<NonNullableProps<T>> {
  const newObj = { ...obj };
  (Object.keys(newObj) as (keyof T)[]).forEach((key) => {
    if (R.isNil(newObj[key]) || isNestedEmpty(newObj[key] as object)) {
      delete newObj[key];
    }
  });
  return newObj;
}

export function isNestedEmpty(value: object | null | undefined): boolean {
  if (isNilOrEmpty(value)) {
    return true;
  }
  if (typeof value !== 'object' && !Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((v) => isNilOrEmpty(v) && isNestedEmpty(v));
}

export function equalOrBothNilOrEmpty(value1: unknown, value2: unknown): boolean {
  return equal(value1, value2) || (isNilOrEmpty(value1) && isNilOrEmpty(value2));
}
