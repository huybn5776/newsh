import { SettingKey } from '@enums/setting-key';

export function getSettingFromStorage<T>(key: SettingKey): T | null {
  const value = localStorage.getItem(key.toString());
  return value !== null ? JSON.parse(value) : null;
}

export function saveSettingToStorage<T>(key: SettingKey, value: T): void {
  localStorage.setItem(key.toString(), JSON.stringify(value));
}
