import { InjectionKey } from 'vue';

export const provideHiddenSeenNewsSettingKey: InjectionKey<boolean> = Symbol('hideSeenNews');
export const provideSeenNewsInjectKey: InjectionKey<Record<string, boolean>> = Symbol('seenNewsInjectKey');
