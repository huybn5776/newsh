export function getFromStorage<T>(key: string): T | null {
  const value = localStorage.getItem(key);
  return value !== null ? JSON.parse(value) : null;
}

export function saveToStorage<T>(key: string, value: T | null): void {
  localStorage.setItem(key.toString(), JSON.stringify(value));
}

export function updateFromStorage<T>(key: string, updater: (value: T | null) => T | null): void {
  const settingValue = getFromStorage<T>(key);
  const updatedValue = updater(settingValue);
  if (settingValue === updatedValue) {
    return;
  }
  saveToStorage(key, updatedValue);
}

export function deleteFromStorage(key: string): void {
  localStorage.removeItem(key);
}
