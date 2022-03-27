import { Ref, ref, watch, UnwrapRef } from 'vue';

import { SettingKey, SettingValueType } from '@enums/setting-key';
import { deleteSettingFromStorage, saveSettingToStorage, getSettingFromStorage } from '@services/setting-service';
import { isNilOrEmpty } from '@utils/object-utils';

export function useSyncSetting<K extends SettingKey, T extends SettingValueType[K]>(key: K): Ref<UnwrapRef<T | null>> {
  const settingRef = ref(getSettingFromStorage<K, T>(key));
  watch(settingRef, () => saveOrDelete(key, settingRef.value as T));
  return settingRef;
}

export function useSyncSettingMapUndefined<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
): Ref<UnwrapRef<T | undefined>> {
  const settingValue = getSettingFromStorage<K, T>(key);
  const settingRef = ref<T | undefined>(settingValue === null ? undefined : settingValue);
  watch(settingRef, () => saveOrDelete(key, settingRef.value === undefined ? null : (settingRef.value as T)));
  return settingRef;
}

export function useSyncSettingMapNullArray<
  K extends SettingValueType[K] extends Array<unknown> ? SettingKey : never,
  T extends SettingValueType[K] extends Array<unknown> ? SettingValueType[K] : never,
>(key: K, map?: (value: T | undefined) => T | undefined): Ref<T | undefined> {
  const settingValue = getSettingFromStorage<K, T>(key);
  const settingRef = ref<T | undefined>();
  settingRef.value = settingValue === null ? ([] as Array<unknown> as T & Array<unknown>) : settingValue;
  watch(settingRef, () => saveOrDelete<K, T>(key, map ? map(settingRef.value) : settingRef.value));
  return settingRef;
}

function saveOrDelete<K extends SettingKey, T extends SettingValueType[K]>(key: K, value: T | null | undefined): void {
  if (isNilOrEmpty(value)) {
    deleteSettingFromStorage(key);
    return;
  }
  saveSettingToStorage(key, value);
}
