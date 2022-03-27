import mitt from 'mitt';

import { SettingValueType } from '@enums/setting-key';
import { NullableProps } from '@utils/type-utils';

export type EventTypes = Partial<NullableProps<SettingValueType>>;
export const emitter = mitt<EventTypes>();
