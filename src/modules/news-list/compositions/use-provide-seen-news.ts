import { onMounted, provide, ref } from 'vue';

import { useMitt } from '@/compositions/use-mitt';
import { EventKey } from '@/enums/event-key';
import { SettingEventType } from '@/enums/setting-event-type';
import { SettingKey } from '@/enums/setting-key';
import { NewsIndex } from '@/interfaces/news-index';
import { createNewsIndex } from '@/modules/news-list/services/news-filter-service';
import {
  trimSeenNewsItems,
  updateSettingFromStorage,
  getSettingFromStorage,
  mergeSeenNews,
} from '@/services/setting-service';
import { provideHiddenSeenNewsSettingKey, provideSeenNewsInjectKey } from '@/symbols';

export function useProvideSeenNews(): void {
  const { onEvent } = useMitt();

  const hideSeenNewsEnabled = getSettingFromStorage(SettingKey.HideSeenNews);
  const seenNewsItems = getSettingFromStorage(SettingKey.SeenNewsItems);
  const seenNewsIndex = ref<NewsIndex>(createNewsIndex(seenNewsItems ?? []));

  onEvent(EventKey.RemoteSeenNews, (items) => {
    const mergedSeenNewsItems = mergeSeenNews(seenNewsItems ?? [], items);
    seenNewsIndex.value = createNewsIndex(mergedSeenNewsItems);
  });

  onMounted(() => {
    if (hideSeenNewsEnabled) {
      updateSettingFromStorage(SettingKey.SeenNewsItems, trimSeenNewsItems, SettingEventType.User);
    }
  });

  provide(provideHiddenSeenNewsSettingKey, !!hideSeenNewsEnabled);
  provide(provideSeenNewsInjectKey, seenNewsIndex);
}
