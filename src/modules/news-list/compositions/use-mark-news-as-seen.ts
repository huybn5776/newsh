import { ref, onUnmounted, Ref } from 'vue';

import { SettingEventType } from '@enums/setting-event-type';
import { SettingKey } from '@enums/setting-key';
import { NewsItem } from '@interfaces/news-item';
import { updateSettingFromStorage } from '@services/setting-service';

type Timeout = ReturnType<typeof setTimeout>;
const markAsSeenTime = 2000;

export function useMarkNewsAsSeen(seenNewsUrlMap: Ref<Record<string, boolean>>): {
  onNewsEnter: (newsItem: NewsItem) => void;
  onNewsLeave: (newsItem: NewsItem) => void;
} {
  const newsItemIntersectionTimeout = ref<Record<string, Timeout>>({});
  const hasSeenNewsItemsUrl = ref<string[]>([]);

  function onNewsEnter(newsItem: NewsItem): void {
    const newsUrl = newsItem.url;
    if (seenNewsUrlMap.value[newsItem.url] || hasSeenNewsItemsUrl.value.includes(newsUrl)) {
      return;
    }

    newsItemIntersectionTimeout.value[newsUrl] = setTimeout(() => {
      updateSettingFromStorage(
        SettingKey.SeenNewsItems,
        (newsItems) => [
          ...(newsItems?.filter((news) => news.url !== newsUrl) || []),
          { seenAt: Date.now(), title: newsItem.title, url: newsUrl },
        ],
        SettingEventType.User,
      );
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
