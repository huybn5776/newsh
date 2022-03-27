import { onMounted, provide, ref } from 'vue';

import { provideHiddenSeenNewsSettingKey, provideSeenNewsInjectKey } from '@/symbols';
import { useMitt } from '@compositions/use-mitt';
import { EventKey } from '@enums/event-key';
import { SettingKey } from '@enums/setting-key';
import { SeenNewsItem } from '@interfaces/seen-news-item';
import {
  trimSeenNewsItems,
  updateSettingFromStorage,
  getSettingFromStorage,
  mergeSeenNews,
} from '@services/setting-service';

export function useProvideSeenNews(): void {
  const { onEvent } = useMitt();

  const hideSeenNewsEnabled = getSettingFromStorage(SettingKey.HideSeenNews);
  const seenNewsItems = getSettingFromStorage(SettingKey.SeenNewsItems);
  const seenNewsUrlMap = ref<Record<string, boolean>>(seenNewsItemsToMap(seenNewsItems || []));

  onEvent(EventKey.RemoteSeenNews, (items) => {
    const mergedSeenNewsItems = mergeSeenNews(seenNewsItems || [], items);
    seenNewsUrlMap.value = seenNewsItemsToMap(mergedSeenNewsItems);
  });

  onMounted(() => {
    if (hideSeenNewsEnabled) {
      updateSettingFromStorage(SettingKey.SeenNewsItems, trimSeenNewsItems);
    }
  });

  provide(provideHiddenSeenNewsSettingKey, hideSeenNewsEnabled);
  provide(provideSeenNewsInjectKey, seenNewsUrlMap);
}

function seenNewsItemsToMap(seenNewsItems: SeenNewsItem[]): Record<string, boolean> {
  const seenUrlMap: Record<string, boolean> = {};
  seenNewsItems.forEach((newsItem) => (seenUrlMap[newsItem.url] = true));
  return seenUrlMap;
}
