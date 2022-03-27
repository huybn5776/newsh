import { Ref, ref, watch, UnwrapRef, toRaw } from 'vue';

import { useMitt } from '@compositions/use-mitt';
import { SettingKey, SettingValueType } from '@enums/setting-key';
import { getSettingFromStorage, saveOrDelete } from '@services/setting-service';

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
  let lastValue: T | null | undefined = toRaw(settingRef.value);
  let pauseEvent = false;

  watch(settingRef, () => {
    const newValue = toRaw(settingRef.value);
    if (newValue === lastValue) {
      return;
    }
    lastValue = (map ? map(newValue as T) : lastValue) as T;
    pauseEvent = true;
    callback(lastValue);
    pauseEvent = false;
  });
  const { onEvent } = useMitt();
  onEvent(key, (eventValue) => {
    const newValue = eventValue as T;
    if (newValue === lastValue || pauseEvent) {
      return;
    }
    const value = (map ? map(newValue) : newValue) as T;
    lastValue = value;
    // eslint-disable-next-line
    settingRef.value = value;
  });
}
