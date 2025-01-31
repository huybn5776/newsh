import { Ref, ref, watch, UnwrapRef, toRaw } from 'vue';

import equal from 'fast-deep-equal';

import { useMitt } from '@/compositions/use-mitt';
import { SettingEventType } from '@/enums/setting-event-type';
import { SettingKey, SettingValueType } from '@/enums/setting-key';
import { getSettingFromStorage, saveOrDelete } from '@/services/setting-service';

export function useSyncSetting<K extends SettingKey>(key: K): Ref<UnwrapRef<SettingValueType[K] | null>> {
  const settingRef = ref(getSettingFromStorage<K>(key));
  watchWithEvent(key, settingRef, (value) => saveOrDelete(key, value as SettingValueType[K], SettingEventType.User));
  return settingRef as Ref<UnwrapRef<SettingValueType[K] | null>>;
}

export function useSyncSettingMapUndefined<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
): Ref<UnwrapRef<T | undefined>> {
  const settingValue = getSettingFromStorage<K>(key);
  const settingRef = ref(settingValue ?? undefined);
  watchWithEvent(
    key,
    settingRef,
    (value) => saveOrDelete(key, value as T, SettingEventType.User),
    (value) => (value === undefined ? null : (value as T)),
  );
  return settingRef as Ref<UnwrapRef<T | undefined>>;
}

export function useSyncSettingMapNullArray<
  K extends SettingValueType[K] extends unknown[] ? SettingKey : never,
  T extends SettingValueType[K] extends unknown[] ? SettingValueType[K] : never,
  V extends T,
  RT extends V extends never ? T | undefined : V,
>(key: K, map?: (value: T | V | UnwrapRef<RT> | undefined) => T | V): Ref<UnwrapRef<RT>> {
  let settingValue = getSettingFromStorage<K>(key) as T | undefined;
  settingValue = settingValue ?? ([] as unknown[] as T & unknown[]);

  const refValue = (map ? map(settingValue) : settingValue) as unknown as RT;
  const settingRef = ref<RT>(refValue);

  watchWithEvent(key, settingRef, (value) => saveOrDelete<K>(key, value as unknown as T, SettingEventType.User), map);
  return settingRef as Ref<UnwrapRef<RT>>;
}

function watchWithEvent<T extends SettingValueType[SettingKey], N>(
  key: SettingKey,
  settingRef: Ref<T | null | undefined>,
  callback: (value: T | null | undefined) => void,
  map?: (value: T | N) => T | N,
): void {
  let lastValue: T | null | undefined = toRaw(settingRef.value);
  let pauseEvent = false;

  watch(settingRef, () => {
    const newValue = toRaw(settingRef.value) as T | N;
    if (equal(newValue, lastValue)) {
      return;
    }
    lastValue = (map ? map(newValue) : newValue) as T;
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
