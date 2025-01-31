export function distinctArray<T>(array1: T[] | undefined | null, array2?: T[] | null): T[] {
  const set = new Set<T>(array1);
  array2?.forEach((value) => set.add(value));
  return Array.from(set);
}
