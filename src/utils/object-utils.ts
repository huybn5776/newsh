import * as R from 'ramda';

export const isNilOrEmpty = R.either(R.isEmpty, R.isNil) as (value: unknown) => value is null | undefined;
export const isNotNilOrEmpty = R.complement(isNilOrEmpty) as (value: unknown) => value is Record<string, unknown>;
