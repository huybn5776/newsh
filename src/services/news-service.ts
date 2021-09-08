import { SettingKey } from '@enums/setting-key';
import { NewsTopicItem } from '@interfaces/news-topic-item';
import { SeenNewsItem } from '@interfaces/seen-news-item';
import { getSettingFromStorage, updateSettingFromStorage } from '@utils/storage-utils';

export function getSeenNewsUrlMap(newsTopicItems: NewsTopicItem[]): Record<string, boolean> {
  const seenNewsItems = getSettingFromStorage<SeenNewsItem[]>(SettingKey.SeenNewsItems);
  const seenNewsItemsUrl = (seenNewsItems || []).map((news) => news.url);

  const seenNewsUrlMap: Record<string, boolean> = {};
  const allNewsItems = newsTopicItems
    .flatMap((newsTopic) => newsTopic.newsItems)
    .flatMap((newsItem) => [newsItem, ...(newsItem.relatedNewsItems || [])]);
  allNewsItems.forEach((newsItem) => {
    seenNewsUrlMap[newsItem.url] = seenNewsItemsUrl.includes(newsItem.url);
  });

  return seenNewsUrlMap;
}

export function trimSeenNewsItems(): void {
  const now = Date.now();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  updateSettingFromStorage<SeenNewsItem[]>(
    SettingKey.SeenNewsItems,
    (seenNewsItems) => seenNewsItems?.filter((news) => now - news.seenAt < millisecondsPerDay) || [],
  );
}
