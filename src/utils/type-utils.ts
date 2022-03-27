export type NullableProps<T> = { [K in keyof T]: T[K] | null };
export type NonNullableProps<T> = { [K in keyof T]: NonNullable<T[K]> };
export type Timeout = ReturnType<typeof setTimeout>;
