import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { TaskEither } from 'fp-ts/TaskEither';

import { getMultiTopicNews, getSectionTopicNews, getTopicInfo, getSingleTopicNews } from '@/api/google-news-api';
import { NewsTopicType } from '@/enums/news-topic-type';
import { SettingEventType } from '@/enums/setting-event-type';
import { SettingKey } from '@/enums/setting-key';
import { NewsTopicInfo } from '@/interfaces/news-topic-info';
import { NewsTopicItem } from '@/interfaces/news-topic-item';
import { saveSettingToStorage, getSettingFromStorage } from '@/services/setting-service';

export async function prepareNewsInfo(languageAndRegion: string): Promise<void> {
  const topicItems: NewsTopicItem[] = (
    await Promise.all([
      await getMultiTopicNews('topStories', languageAndRegion),
      await getMultiTopicNews('worldAndNation', languageAndRegion),
      await getMultiTopicNews('others', languageAndRegion),
    ])
  ).flatMap((topics) => topics);

  const allTopicsInfo: NewsTopicInfo[] = topicItems.map((topicItem) => ({
    id: topicItem.id,
    name: topicItem.name,
    type: NewsTopicType.SingleTopic,
  }));
  saveSettingToStorage(SettingKey.AllTopicsInfo, allTopicsInfo, SettingEventType.Program);

  const [headlineTopic] = topicItems;
  saveSettingToStorage(SettingKey.HeadlineTopicId, headlineTopic.id, SettingEventType.Program);
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

export function getPublicationIdAndSectionIdFromUrl(
  urlString: string,
): E.Either<string, { publicationId: string; sectionId: string; region: string | null }> {
  const url = tryParseUrl(urlString);
  if (!url) {
    return E.left('Invalid URL.');
  }
  const urlSplits = url.pathname.split('/').filter((s) => s);
  const [publicationPrefix, publicationId, , sectionId] = urlSplits;
  if (urlSplits.length < 2 || publicationPrefix !== 'publications') {
    return E.left(`Publication topic should start with '/publications'.`);
  }
  const topicId = sectionId || publicationId;
  const allTopics = getSettingFromStorage(SettingKey.AllTopicsInfo) ?? [];
  const existingTopic = allTopics.find((topic) => topic.id === topicId);
  if (existingTopic) {
    return E.left(`Topic '${existingTopic.name}' is already exists.`);
  }
  const region = url.searchParams.get('ceid');
  return E.right({ publicationId, sectionId, region });
}

export function tryGetNewsItem(
  publicationId: string,
  sectionId: string,
  region: string,
): TaskEither<string, NewsTopicInfo> {
  return TE.tryCatch(
    async () =>
      (sectionId && (await fetchSectionTopicInfo(publicationId, sectionId, region))) ||
      (publicationId && (await fetchSingleTopicInfo(publicationId, region))) ||
      Promise.reject(new Error('Fail to get news from this url.')),
    () => 'Fail to get news from this url.',
  );
}

export function trimNewsTitle(title: string): string {
  let separatorIndex = title.indexOf('|');
  if (separatorIndex === -1) {
    separatorIndex = title.indexOf('｜');
  }
  if (separatorIndex === -1) {
    return title.trim();
  }
  return title.substring(0, separatorIndex).trim();
}

async function fetchSingleTopicInfo(publicationId: string, region: string): Promise<NewsTopicInfo> {
  const newsTopicItem = await getSingleTopicNews(publicationId, region);
  return {
    id: publicationId,
    type: NewsTopicType.SingleTopic,
    name: newsTopicItem.name,
    isCustomTopic: true,
  };
}

async function fetchSectionTopicInfo(publicationId: string, sectionId: string, region: string): Promise<NewsTopicInfo> {
  const sectionTopic = await getSectionTopicNews(sectionId, region);
  const publicationTopicInfo = await getTopicInfo(publicationId, region);
  return {
    id: sectionId,
    type: NewsTopicType.SectionTopic,
    name: `${publicationTopicInfo.name} - ${sectionTopic.name}`,
    sectionName: sectionTopic.name,
    isCustomTopic: true,
  };
}

function tryParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}
