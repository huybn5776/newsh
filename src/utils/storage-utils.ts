import { SettingKey } from '@enums/setting-key';

export function getSettingFromStorage<T>(key: SettingKey): T | null {
  const value = localStorage.getItem(key.toString());
  return value !== null ? JSON.parse(value) : null;
}

export function saveSettingToStorage<T>(key: SettingKey, value: T): void {
  localStorage.setItem(key.toString(), JSON.stringify(value));
}

export function updateSettingFromStorage<T>(key: SettingKey, updater: (value: T | null) => T | null): void {
  const settingValue = getSettingFromStorage<T>(key);
  const updatedValue = updater(settingValue);
  if (settingValue === updatedValue) {
    return;
  }
  saveSettingToStorage(key, updatedValue);
}

export function deleteSettingFromStorage(key: SettingKey): void {
  localStorage.removeItem(key);
}
