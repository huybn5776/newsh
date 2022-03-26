import { getMultiTopicNews } from '@api/google-news-api';
import { SettingKey } from '@enums/setting-key';
import { NewsTopicInfo } from '@interfaces/news-topic-info';
import { NewsTopicItem } from '@interfaces/news-topic-item';
import { getSettingFromStorage, saveSettingToStorage } from '@utils/storage-utils';

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
