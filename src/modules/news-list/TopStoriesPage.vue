<template>
  <div class="page-content news-list">
    <NewsTopics
      showMoreLink
      :newsTopics="newsTopicList"
      :expandFirstNews="!isMobile"
      :loadingTopics="loadingTopics"
      @newsTopicEntered="onNewsTopicEnter"
      @loadMore="loadMore"
    />
    <DotsLoader v-if="!completeLoaded" />
    <NextTopicSelection
      v-if="completeLoaded"
      title="Next topic to show"
      :disabledTopics="loadedTopics"
      @topicClick="appendTopic"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';

import DotsLoader from '@components/DotsLoader/DotsLoader.vue';
import { useAutoSyncWithDropbox } from '@compositions/use-auto-sync-with-dropbox';
import { useIsMobile } from '@compositions/use-is-mobile';
import { SettingKey } from '@enums/setting-key';
import { NewsItem } from '@interfaces/news-item';
import { NewsTopicInfo } from '@interfaces/news-topic-info';
import { NewsTopicItem } from '@interfaces/news-topic-item';
import NewsTopics from '@modules/news-list/components/NewsTopics/NewsTopics.vue';
import NextTopicSelection from '@modules/news-list/components/NextTopicSelection/NextTopicSelection.vue';
import { useNewsRequest } from '@modules/news-list/compositions/use-news-request';
import { useProvideSeenNews } from '@modules/news-list/compositions/use-provide-seen-news';
import {
  removeByNewsSource,
  removeByNewsUrlMatch,
  removeByTerms,
  removeYoutubeNews,
} from '@modules/news-list/services/news-filter';
import { getSettingFromStorage } from '@services/setting-service';
import { isNotNilOrEmpty } from '@utils/object-utils';

const newsTopics = ref<NewsTopicItem[]>([]);
const newsLoaders = ref<(() => Promise<NewsTopicItem[]>)[]>([]);
const loadedTopics = ref<Record<string, true>>({});
const pendingRequest = ref<Promise<NewsTopicItem[]>>();

const newsTopicList = computed(() => {
  let newsTopicItems = newsTopics.value;
  if (getSettingFromStorage(SettingKey.FilterOutYoutube)) {
    newsTopicItems = newsTopicItems.map(removeYoutubeNews());
  }
  const hiddenSources = getSettingFromStorage(SettingKey.HiddenSources);
  if (hiddenSources?.length) {
    newsTopicItems = newsTopicItems.map(removeByNewsSource(hiddenSources));
  }
  const hiddenUrlMatches = getSettingFromStorage(SettingKey.HiddenUrlMatches);
  if (hiddenUrlMatches?.length) {
    newsTopicItems = newsTopicItems.map(removeByNewsUrlMatch(hiddenUrlMatches));
  }
  const excludedTerms = getSettingFromStorage(SettingKey.ExcludeTerms);
  if (excludedTerms?.length) {
    newsTopicItems = newsTopicItems.map(removeByTerms(excludedTerms));
  }
  return newsTopicItems;
});
const completeLoaded = ref(false);

const allNewsTopicInfo = getSettingFromStorage(SettingKey.AllTopicsInfo);
const isMobile = useIsMobile();
useProvideSeenNews();
const { getNews, getMultiTopicNews, loadingTopics, isLoading } = useNewsRequest();
useAutoSyncWithDropbox();

onMounted(async () => {
  await loadNews();
});

async function loadNews(): Promise<void> {
  const allTopicsInfo = getSettingFromStorage(SettingKey.AllTopicsInfo);
  const headlineTopicId = getSettingFromStorage(SettingKey.HeadlineTopicId);
  if (!allTopicsInfo?.length || !headlineTopicId) {
    throw new Error('News info is not ready.');
  }

  const newsTopicsAfterTopStories = getSettingFromStorage(SettingKey.NewsTopicsAfterTopStories)
    ?.map((topicId) => allNewsTopicInfo?.find((topic) => topic.id === topicId))
    .filter(isNotNilOrEmpty);

  newsLoaders.value = [
    () => getNonDuplicatedMultiNewsTopic('topStories'),
    () => getNonDuplicatedMultiNewsTopic('worldAndNation'),
    () => getNonDuplicatedMultiNewsTopic('others'),
    ...(newsTopicsAfterTopStories?.map((topic) => async () => {
      loadedTopics.value = { ...loadedTopics.value, [topic.id]: true };
      return [await getNonDuplicatedNewsTopic(topic)];
    }) || []),
  ];
  await loadNextTopic();
}

async function loadNextTopic(): Promise<void> {
  const newsLoader = newsLoaders.value.shift();
  if (newsLoader) {
    const loadNewsRequest = newsLoader();
    pendingRequest.value = loadNewsRequest;
    const newsTopicItems = await loadNewsRequest;
    pendingRequest.value = undefined;
    newsTopics.value = [...newsTopics.value, ...newsTopicItems];
    completeLoaded.value = newsLoaders.value.length === 0 && !isLoading.value;
  }
}

async function getNonDuplicatedMultiNewsTopic(
  topicId: Parameters<typeof getMultiTopicNews>[0],
): Promise<NewsTopicItem[]> {
  const newsTopicItems = await getMultiTopicNews(topicId);
  const allNewsUrl = getAllNewsUrl(newsTopics.value);

  return newsTopicItems.map((newsTopicItem) => {
    const filteredTopicItem = {
      ...newsTopicItem,
      newsItems: newsTopicItem.newsItems.filter((news) => !allNewsUrl.has(news.url)),
    };
    newsTopicItem.newsItems.forEach((news) => {
      // eslint-disable-next-line no-param-reassign
      news.relatedNewsItems = news.relatedNewsItems?.filter((n) => !allNewsUrl.has(n.url)) || undefined;
    });
    getAllNewsUrl([newsTopicItem]).forEach((url) => allNewsUrl.add(url));
    return filteredTopicItem;
  });
}

async function getNonDuplicatedNewsTopic(topic: NewsTopicInfo): Promise<NewsTopicItem> {
  let newsTopicItem = await getNews(topic);
  const allNewsUrl = getAllNewsUrl(newsTopics.value);
  newsTopicItem = { ...newsTopicItem, newsItems: newsTopicItem.newsItems.filter((news) => !allNewsUrl.has(news.url)) };
  newsTopicItem.newsItems.forEach((news) => {
    // eslint-disable-next-line no-param-reassign
    news.relatedNewsItems = news.relatedNewsItems?.filter((n) => !allNewsUrl.has(n.url)) || undefined;
  });
  return newsTopicItem;
}

function getAllNewsUrl(newsTopicItems: NewsTopicItem[]): Set<string> {
  return new Set<string>(
    newsTopicItems.flatMap((topic) => [
      ...topic.newsItems.map((news) => news.url),
      ...topic.newsItems.flatMap((news) =>
        ((news.relatedNewsItems || []) as NewsItem[]).map((relatedNews) => relatedNews.url),
      ),
    ]),
  );
}

async function onNewsTopicEnter(id: string): Promise<void> {
  const loadThreshold = 2;
  const noNextTopicToLoad = newsLoaders.value.length === 0;
  if (noNextTopicToLoad) {
    return;
  }
  const index = newsTopicList.value.findIndex((newsTopic) => newsTopic.id === id);
  if (index + loadThreshold >= newsTopicList.value.length) {
    if (pendingRequest.value) {
      await pendingRequest.value;
    }
    await loadNextTopic();
  }
}

async function loadMore(topicId: string): Promise<void> {
  const indexToAppend = newsTopics.value.findIndex((newsTopic) => newsTopic.id === topicId);
  const originalNewsTopicItem: NewsTopicItem = newsTopics.value[indexToAppend];
  if (!originalNewsTopicItem) {
    return;
  }
  const topic = allNewsTopicInfo?.find((t) => t.id === topicId);
  if (!topic) {
    return;
  }
  const newsItemsToAppend: NewsItem[] = (await getNonDuplicatedNewsTopic(topic)).newsItems;

  const newTopicItems = [...newsTopics.value];
  newTopicItems[indexToAppend] = {
    ...originalNewsTopicItem,
    newsItems: [...originalNewsTopicItem.newsItems, ...newsItemsToAppend],
    isPartial: false,
  };
  newsTopics.value = newTopicItems;
}

async function appendTopic(topicId: string): Promise<void> {
  const topic = allNewsTopicInfo?.find((t) => t.id === topicId);
  if (!topic) {
    return;
  }
  loadedTopics.value = { ...loadedTopics.value, [topicId]: true };
  const topicItem = await getNonDuplicatedNewsTopic(topic);
  newsTopics.value = [...newsTopics.value, topicItem];
}
</script>
