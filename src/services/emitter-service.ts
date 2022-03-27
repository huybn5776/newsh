import mitt from 'mitt';

import { EventValueType } from '@enums/event-key';
import { SettingValueType } from '@enums/setting-key';
import { NullableProps } from '@utils/type-utils';

export type EventTypes = Partial<NullableProps<SettingValueType>> & EventValueType;
export const emitter = mitt<EventTypes>();
