import { Ref, ref, watch, UnwrapRef, toRaw } from 'vue';

import { useMitt } from '@compositions/use-mitt';
import { SettingKey, SettingValueType } from '@enums/setting-key';
import { deleteSettingFromStorage, saveSettingToStorage, getSettingFromStorage } from '@services/setting-service';
import { isNilOrEmpty } from '@utils/object-utils';

export function useSyncSetting<K extends SettingKey>(key: K): Ref<UnwrapRef<SettingValueType[K] | null>> {
  const settingRef = ref(getSettingFromStorage<K, SettingValueType[K]>(key));
  watchWithEvent(key, settingRef, (value) => saveOrDelete(key, value as SettingValueType[K]));
  return settingRef;
}

export function useSyncSettingMapUndefined<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
): Ref<UnwrapRef<T | undefined>> {
  const settingValue = getSettingFromStorage<K, T>(key);
  const settingRef = ref(settingValue === null ? undefined : settingValue);
  watchWithEvent(
    key,
    settingRef,
    (value) => saveOrDelete(key, value as T),
    (value) => (value === undefined ? null : (value as T)),
  );
  return settingRef;
}

export function useSyncSettingMapNullArray<
  K extends SettingValueType[K] extends Array<unknown> ? SettingKey : never,
  T extends SettingValueType[K] extends Array<unknown> ? SettingValueType[K] : never,
>(key: K, map?: (value: T | undefined) => T | undefined): Ref<T | undefined> {
  const settingValue = getSettingFromStorage<K, T>(key);
  const settingRef = ref<T | undefined>();
  settingRef.value = settingValue === null ? ([] as Array<unknown> as T & Array<unknown>) : settingValue;
  watchWithEvent(key, settingRef, (value) => saveOrDelete<K, T>(key, value), map);
  return settingRef;
}

function watchWithEvent<K extends SettingKey, T extends SettingValueType[K], N>(
  key: SettingKey,
  settingRef: Ref<T | null | undefined>,
  callback: (value: T | null | undefined) => void,
  map?: (value: T | N) => T | N,
): void {
  let lastValue: T | null | undefined;
  watch(settingRef, () => {
    lastValue = toRaw(settingRef.value) as T;
    lastValue = (map ? map(lastValue) : lastValue) as T;
    callback(lastValue);
  });
  const { onEvent } = useMitt();
  onEvent(key, (newValue) => {
    let value = newValue as T;
    if (value === lastValue) {
      return;
    }
    value = (map ? map(value) : value) as T;
    lastValue = value;
    // eslint-disable-next-line
    settingRef.value = value;
  });
}

function saveOrDelete<K extends SettingKey, T extends SettingValueType[K]>(key: K, value: T | null | undefined): void {
  if (isNilOrEmpty(value)) {
    deleteSettingFromStorage(key);
    return;
  }
  saveSettingToStorage(key, value);
}
