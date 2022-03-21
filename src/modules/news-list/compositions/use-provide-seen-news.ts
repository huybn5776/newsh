import { onMounted, provide } from 'vue';

import { provideHiddenSeenNewsSettingKey, provideSeenNewsInjectKey } from '@/symbols';
import { SettingKey } from '@enums/setting-key';
import { trimSeenNewsItems } from '@services/news-service';
import { getSettingFromStorage } from '@utils/storage-utils';

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

  provide(provideHiddenSeenNewsSettingKey, hideSeenNewsEnabled);
  provide(provideSeenNewsInjectKey, seenNewsUrlMap);
}
