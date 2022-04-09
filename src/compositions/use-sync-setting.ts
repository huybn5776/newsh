import { Ref, ref, watch, UnwrapRef, toRaw } from 'vue';

import equal from 'fast-deep-equal';

import { useMitt } from '@compositions/use-mitt';
import { SettingEventType } from '@enums/setting-event-type';
import { SettingKey, SettingValueType } from '@enums/setting-key';
import { getSettingFromStorage, saveOrDelete } from '@services/setting-service';

export function useSyncSetting<K extends SettingKey>(key: K): Ref<UnwrapRef<SettingValueType[K] | null>> {
  const settingRef = ref(getSettingFromStorage<K, SettingValueType[K]>(key));
  watchWithEvent(key, settingRef, (value) => saveOrDelete(key, value as SettingValueType[K], SettingEventType.User));
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
    (value) => saveOrDelete(key, value as T, SettingEventType.User),
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
  watchWithEvent(key, settingRef, (value) => saveOrDelete<K, T>(key, value, SettingEventType.User), map);
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
    if (equal(newValue, lastValue)) {
      return;
    }
    lastValue = (map ? map(newValue as T) : newValue) as T;
    pauseEvent = true;
    callback(lastValue);
    pauseEvent = false;
  });
  const { onEvent } = useMitt();
  onEvent(key, (event) => {
    const { value } = event;
    const newValue = (map ? map(value as T) : value) as T;
    if (equal(newValue, lastValue) || pauseEvent) {
      return;
    }
    lastValue = newValue;
    // eslint-disable-next-line
    settingRef.value = newValue;
  });
}
