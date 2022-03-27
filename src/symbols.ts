import { InjectionKey, Ref } from 'vue';

export const provideHiddenSeenNewsSettingKey: InjectionKey<boolean> = Symbol('hideSeenNews');
export const provideSeenNewsInjectKey: InjectionKey<Ref<Record<string, boolean>>> = Symbol('seenNewsInjectKey');
