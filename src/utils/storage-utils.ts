// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function getFromStorage<T>(key: string): T | null {
  const value = localStorage.getItem(key);
  return value !== null ? JSON.parse(value) : null;
}

export function saveToStorage(key: string, value: unknown | null): void {
  localStorage.setItem(key.toString(), JSON.stringify(value));
}

export function updateFromStorage<T extends object>(
  key: string,
  updater: (value: T | null) => T | null,
): { updated: boolean; value: T | null } {
  const settingValue = getFromStorage<T>(key);
  const updatedValue = updater(settingValue);
  if (settingValue === updatedValue) {
    return { updated: false, value: settingValue };
  }
  saveToStorage(key, updatedValue);
  return { updated: true, value: updatedValue };
}

export function deleteFromStorage(key: string): void {
  localStorage.removeItem(key);
}
