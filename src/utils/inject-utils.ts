import { InjectionKey, inject } from 'vue';

export function injectStrict<T>(key: InjectionKey<T>): T {
  const resolved = inject(key, undefined);
  if (!resolved) {
    throw new Error(`Could not resolve ${key.description}`);
  }
  return resolved;
}
