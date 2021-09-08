import { ref, onUnmounted } from 'vue';

import { SettingKey } from '@enums/setting-key';
import { NewsItem } from '@interfaces/news-item';
import { SeenNewsItem } from '@interfaces/seen-news-item';
import { updateSettingFromStorage } from '@utils/storage-utils';

type Timeout = ReturnType<typeof setTimeout>;
const markAsSeenTime = 3000;

export function useMarkNewsAsSeen(seenNewsUrlMap: Record<string, boolean>): {
  onNewsEnter: (newsItem: NewsItem) => void;
  onNewsLeave: (newsItem: NewsItem) => void;
} {
  const newsItemIntersectionTimeout = ref<Record<string, Timeout>>({});
  const hasSeenNewsItemsUrl = ref<string[]>([]);

  function onNewsEnter(newsItem: NewsItem): void {
    const newsUrl = newsItem.url;
    if (seenNewsUrlMap[newsItem.url] || hasSeenNewsItemsUrl.value.includes(newsUrl)) {
      return;
    }

    newsItemIntersectionTimeout.value[newsUrl] = setTimeout(() => {
      updateSettingFromStorage<SeenNewsItem[]>(SettingKey.SeenNewsItems, (newsItems) => [
        ...(newsItems || []),
        { seenAt: Date.now(), title: newsItem.title, url: newsUrl },
      ]);
      delete newsItemIntersectionTimeout.value[newsUrl];
      hasSeenNewsItemsUrl.value = [...hasSeenNewsItemsUrl.value, newsUrl];
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
