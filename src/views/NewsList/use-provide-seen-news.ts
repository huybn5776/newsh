import { onMounted, provide, computed, Ref, UnwrapRef } from 'vue';

import { SettingKey } from '@enums/setting-key';
import { NewsTopicItem } from '@interfaces/news-topic-item';
import { trimSeenNewsItems, getSeenNewsUrlMap } from '@services/news-service';
import { getSettingFromStorage } from '@utils/storage-utils';

export const provideHiddenSeenNewsSetting = SettingKey.HideSeenNews;
export const provideSeenNewsUrlMap = 'seenNewsUrlMap';

export function useProvideSeenNews(newsTopicsRef: Ref<UnwrapRef<NewsTopicItem[]>>): void {
  const hideSeenNewsEnabled = getSettingFromStorage(SettingKey.HideSeenNews);
  const seenNewsItems = getSettingFromStorage(SettingKey.SeenNewsItems);
  const seenNewsItemsUrl = (seenNewsItems || []).map((news) => news.url);

  const seenNewsUrlMap = computed(() =>
    hideSeenNewsEnabled ? getSeenNewsUrlMap(seenNewsItemsUrl, newsTopicsRef.value) : {},
  );

  onMounted(() => {
    if (hideSeenNewsEnabled) {
      trimSeenNewsItems();
    }
  });

  provide(SettingKey.HideSeenNews, hideSeenNewsEnabled);
  provide('seenNewsUrlMap', seenNewsUrlMap);
}
