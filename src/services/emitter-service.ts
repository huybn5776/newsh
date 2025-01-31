import mitt from 'mitt';

import { EventValueType } from '@/enums/event-key';
import { SettingEventType } from '@/enums/setting-event-type';
import { SettingValueType, SettingKey } from '@/enums/setting-key';

type WrapSettingKey<T extends SettingValueType> = {
  [K in keyof SettingValueType]: { type: SettingEventType; key: SettingKey; value: T[K] | null | undefined };
};
export type SettingKeyEvent = WrapSettingKey<SettingValueType>;

export type EventTypes = SettingKeyEvent & EventValueType;
export const emitter = mitt<EventTypes>();
