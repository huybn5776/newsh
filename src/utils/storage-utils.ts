import { SettingKey, SettingValueType } from '@enums/setting-key';

export function getSettingFromStorage<K extends SettingKey, T extends SettingValueType[K]>(key: K): T | null {
  const value = localStorage.getItem(key.toString());
  return value !== null ? JSON.parse(value) : null;
}

export function saveSettingToStorage<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
  value: T | null | undefined,
): void {
  localStorage.setItem(key.toString(), JSON.stringify(value));
}

export function updateSettingFromStorage<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
  updater: (value: T | null) => T | null,
): void {
  const settingValue = getSettingFromStorage<K, T>(key);
  const updatedValue = updater(settingValue);
  if (settingValue === updatedValue) {
    return;
  }
  saveSettingToStorage(key, updatedValue);
}

export function deleteSettingFromStorage(key: SettingKey): void {
  localStorage.removeItem(key);
}
