import { onMounted, provide } from 'vue';

import { SettingKey } from '@enums/setting-key';
import { trimSeenNewsItems } from '@services/news-service';
import { getSettingFromStorage } from '@utils/storage-utils';

export const provideHiddenSeenNewsSetting = SettingKey.HideSeenNews;
export const provideSeenNewsUrlMap = 'seenNewsUrlMap';

export function useProvideSeenNews(): void {
  const hideSeenNewsEnabled = getSettingFromStorage(SettingKey.HideSeenNews);
  const seenNewsItems = getSettingFromStorage(SettingKey.SeenNewsItems);

  const seenNewsUrlMap: Record<string, boolean> = {};
  (seenNewsItems || []).forEach((newsItem) => (seenNewsUrlMap[newsItem.url] = true));

  onMounted(() => {
    if (hideSeenNewsEnabled) {
      trimSeenNewsItems();
    }
  });

  provide(SettingKey.HideSeenNews, hideSeenNewsEnabled);
  provide('seenNewsUrlMap', seenNewsUrlMap);
}
