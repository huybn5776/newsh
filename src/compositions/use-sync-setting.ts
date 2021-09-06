import { Ref, ref, watch, UnwrapRef } from 'vue';

import { SettingKey } from '@enums/setting-key';
import { getSettingFromStorage, saveSettingToStorage } from '@utils/storage-utils';

export function useSyncSetting<T>(key: SettingKey): Ref<UnwrapRef<T | null>> {
  const settingRef = ref(getSettingFromStorage<T>(key));
  watch(settingRef, () => saveSettingToStorage(key, settingRef.value));
  return settingRef;
}

export function useSyncSettingMapUndefined<T>(key: SettingKey): Ref<UnwrapRef<T | undefined>> {
  const settingValue = getSettingFromStorage<T>(key);
  const settingRef = ref<T | undefined>(settingValue === null ? undefined : settingValue);
  watch(settingRef, () => saveSettingToStorage(key, settingRef.value === undefined ? null : settingRef.value));
  return settingRef;
}
