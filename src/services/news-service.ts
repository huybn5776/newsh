import { getMultiTopicNews } from '@api/google-news-api';
import { SettingKey } from '@enums/setting-key';
import { NewsTopicInfo } from '@interfaces/news-topic-info';
import { NewsTopicItem } from '@interfaces/news-topic-item';
import { getSettingFromStorage, updateSettingFromStorage, saveSettingToStorage } from '@utils/storage-utils';

export function getSeenNewsUrlMap(
  seenNewsItemsUrl: string[],
  newsTopicItems: NewsTopicItem[],
): Record<string, boolean> {
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

  updateSettingFromStorage(
    SettingKey.SeenNewsItems,
    (seenNewsItems) => seenNewsItems?.filter((news) => now - news.seenAt < millisecondsPerDay) || [],
  );
}

export async function prepareNewsInfo(languageAndRegion: string): Promise<void> {
  const topicItems: NewsTopicItem[] = (
    await Promise.all([
      await getMultiTopicNews('topStories', languageAndRegion),
      await getMultiTopicNews('worldAndNation', languageAndRegion),
      await getMultiTopicNews('others', languageAndRegion),
    ])
  ).flatMap((topics) => topics);

  const allTopicsInfo: NewsTopicInfo[] = topicItems.map((topicItem) => ({ id: topicItem.id, name: topicItem.name }));
  saveSettingToStorage(SettingKey.AllTopicsInfo, allTopicsInfo);

  const [headlineTopic] = topicItems;
  saveSettingToStorage(SettingKey.HeadlineTopicId, headlineTopic.id);
}

export function validateIsNewsInfoSettings(): boolean {
  const languageAndRegion = getSettingFromStorage(SettingKey.LanguageAndRegion);
  const allTopicsInfo = getSettingFromStorage(SettingKey.AllTopicsInfo);
  const headlineTopicId = getSettingFromStorage(SettingKey.HeadlineTopicId);

  return !(
    !languageAndRegion ||
    !allTopicsInfo?.length ||
    !headlineTopicId ||
    languageAndRegion.length < 4 ||
    !languageAndRegion.includes(':')
  );
}
