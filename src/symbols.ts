import { InjectionKey, Ref } from 'vue';

import { NewsIndex } from '@/interfaces/news-index';

export const provideHiddenSeenNewsSettingKey: InjectionKey<boolean> = Symbol('hideSeenNews');
export const provideSeenNewsInjectKey: InjectionKey<Ref<NewsIndex>> = Symbol('seenNewsInjectKey');
