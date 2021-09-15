import { Ref, ref, watch, UnwrapRef } from 'vue';

import { SettingKey, SettingValueType } from '@enums/setting-key';
import { getSettingFromStorage, saveSettingToStorage } from '@utils/storage-utils';

export function useSyncSetting<K extends SettingKey, T extends SettingValueType[K]>(key: K): Ref<UnwrapRef<T | null>> {
  const settingRef = ref(getSettingFromStorage<K, T>(key));
  watch(settingRef, () => saveSettingToStorage(key, settingRef.value as T));
  return settingRef;
}

export function useSyncSettingMapUndefined<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
): Ref<UnwrapRef<T | undefined>> {
  const settingValue = getSettingFromStorage<K, T>(key);
  const settingRef = ref<T | undefined>(settingValue === null ? undefined : settingValue);
  watch(settingRef, () => saveSettingToStorage(key, settingRef.value === undefined ? null : (settingRef.value as T)));
  return settingRef;
}

export function useSyncSettingMapNullArray<
  K extends SettingValueType[K] extends Array<unknown> ? SettingKey : never,
  T extends SettingValueType[K] extends Array<unknown> ? SettingValueType[K] : never,
>(key: K): Ref<T | undefined> {
  const settingValue = getSettingFromStorage<K, T>(key);
  const settingRef = ref<T | undefined>();
  settingRef.value = settingValue === null ? ([] as Array<unknown> as T & Array<unknown>) : settingValue;
  watch(settingRef, () => saveSettingToStorage<K, T>(key, settingRef.value));
  return settingRef;
}
