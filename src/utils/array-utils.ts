export function distinctArrayLeft<T>(array: T[] | undefined): T[] {
  return Array.from(new Set(array));
}

export function distinctArrayRight<T>(array: T[] | undefined): T[] {
  return Array.from(new Set([...(array || [])]?.reverse())).reverse();
}
