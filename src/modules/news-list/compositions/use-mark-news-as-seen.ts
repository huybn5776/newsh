import { ref, onUnmounted, Ref } from 'vue';

import { SettingEventType } from '@/enums/setting-event-type';
import { SettingKey } from '@/enums/setting-key';
import { NewsIndex } from '@/interfaces/news-index';
import { NewsItem } from '@/interfaces/news-item';
import { trimNewsTitle } from '@/services/news-service';
import { updateSettingFromStorage } from '@/services/setting-service';

type Timeout = ReturnType<typeof setTimeout>;
const markAsSeenTime = 2000;

export function useMarkNewsAsSeen(seenNewsIndex: Ref<NewsIndex>): {
  onNewsEnter: (newsItem: NewsItem) => void;
  onNewsLeave: (newsItem: NewsItem) => void;
} {
  const newsItemIntersectionTimeout = ref<Record<string, Timeout>>({});
  const currentSeenNewsIndex: NewsIndex = { titles: new Set(), urls: new Set() };

  function onNewsEnter(newsItem: NewsItem): void {
    const { title, url } = newsItem;
    const trimmedTitle = trimNewsTitle(title);
    if (
      seenNewsIndex.value.titles.has(trimmedTitle) ||
      seenNewsIndex.value.urls.has(newsItem.url) ||
      currentSeenNewsIndex.titles.has(trimmedTitle) ||
      currentSeenNewsIndex.urls.has(url)
    ) {
      return;
    }

    newsItemIntersectionTimeout.value[url] = setTimeout(() => {
      updateSettingFromStorage(
        SettingKey.SeenNewsItems,
        (newsItems) => [...(newsItems?.filter((news) => news.url !== url) ?? []), { seenAt: Date.now(), title, url }],
        SettingEventType.User,
      );
      delete newsItemIntersectionTimeout.value[url];
      currentSeenNewsIndex.titles.add(trimmedTitle);
      currentSeenNewsIndex.urls.add(url);
    }, markAsSeenTime);
  }

  function onNewsLeave(newsItem: NewsItem): void {
    const newsUrl = newsItem.url;
    const timeout = newsItemIntersectionTimeout.value[newsUrl];
    clearTimeout(timeout);
    delete newsItemIntersectionTimeout.value[newsUrl];
  }

  onUnmounted(() => {
    Object.values(newsItemIntersectionTimeout.value).forEach(clearTimeout);
  });

  return { onNewsEnter, onNewsLeave };
}
