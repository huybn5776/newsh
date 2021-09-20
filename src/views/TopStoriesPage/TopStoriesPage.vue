<template>
  <div class="page-content news-list">
    <NewsTopics
      showMoreLink
      :newsTopics="newsTopicList"
      :expandFirstNews="!isMobile"
      :fullLoadedTopics="fullLoadedTopics"
      :loadingTopics="loadingTopics"
      @newsTopicEntered="onNewsTopicEnter"
      @loadMore="loadMore"
    />
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

import NewsTopics from '@components/NewsTopics/NewsTopics.vue';
import { useIsMobile } from '@compositions/use-is-mobile';
import { useProvideSeenNews } from '@compositions/use-provide-seen-news';
import { SettingKey } from '@enums/setting-key';
import { NewsItem } from '@interfaces/news-item';
import { NewsTopicItem } from '@interfaces/news-topic-item';
import { removeYoutubeNews, removeByNewsSource, removeByTerms } from '@services/news-filter';
import { getSettingFromStorage } from '@utils/storage-utils';
import NextTopicSelection from '@views/TopStoriesPage/NextTopicSelection/NextTopicSelection.vue';
import { useNewsRequest } from '@views/TopStoriesPage/use-news-request';

const newsTopics = ref<NewsTopicItem[]>([]);
const fullLoadedTopics = ref<string[]>([]);
const newsLoaders = ref<(() => Promise<NewsTopicItem[]>)[]>([]);
const loadedTopics = ref<Record<string, true>>({});

const newsTopicList = computed(() => {
  let newsTopicItems = newsTopics.value;
  if (getSettingFromStorage(SettingKey.FilterOutYoutube)) {
    newsTopicItems = newsTopicItems.map(removeYoutubeNews());
  }
  const hiddenSources = getSettingFromStorage(SettingKey.HiddenSources);
  if (hiddenSources?.length) {
    newsTopicItems = newsTopicItems.map(removeByNewsSource(hiddenSources));
  }
  const excludedTerms = getSettingFromStorage(SettingKey.ExcludeTerms);
  if (excludedTerms?.length) {
    newsTopicItems = newsTopicItems.map(removeByTerms(excludedTerms));
  }
  return newsTopicItems;
});
const completeLoaded = ref(false);

const isMobile = useIsMobile();
useProvideSeenNews(newsTopics);
const { getSingleTopicNews, getMultiTopicNews, loadingTopics, isLoading } = useNewsRequest();

onMounted(async () => {
  await loadNews();
});

async function loadNews(): Promise<void> {
  const allTopicsInfo = getSettingFromStorage(SettingKey.AllTopicsInfo);
  const headlineTopicId = getSettingFromStorage(SettingKey.HeadlineTopicId);
  if (!allTopicsInfo?.length || !headlineTopicId) {
    throw new Error('News info is not ready.');
  }

  const newsTopicsAfterTopStories = getSettingFromStorage(SettingKey.NewsTopicsAfterTopStories);
  newsLoaders.value = [
    () => getMultiTopicNews('topStories'),
    () => getMultiTopicNews('worldAndNation'),
    () => getMultiTopicNews('others'),
    ...(newsTopicsAfterTopStories?.map((topic) => async () => {
      loadedTopics.value = { ...loadedTopics.value, [topic]: true };
      return [await getNonDuplicatedNewsTopic(topic)];
    }) || []),
  ];
  await loadNextTopic();
}

async function loadNextTopic(): Promise<void> {
  const newsLoader = newsLoaders.value.shift();
  if (newsLoader) {
    newsTopics.value = [...newsTopics.value, ...(await newsLoader())];
    completeLoaded.value = newsLoaders.value.length === 0 && !isLoading.value;
  }
}

async function getNonDuplicatedNewsTopic(topicId: string): Promise<NewsTopicItem> {
  const allNewsUrl = newsTopics.value.flatMap((topic) => [
    ...topic.newsItems.map((news) => news.url),
    ...topic.newsItems.flatMap((news) =>
      ((news.relatedNewsItems || []) as NewsItem[]).map((relatedNews) => relatedNews.url),
    ),
  ]);

  const newsTopicItem = await getSingleTopicNews(topicId);
  newsTopicItem.newsItems = newsTopicItem.newsItems.filter((news) => !allNewsUrl.includes(news.url));
  return newsTopicItem;
}

function onNewsTopicEnter(id: string): void {
  const loadThreshold = 2;
  const noNextTopicToLoad = newsLoaders.value.length === 0;
  if (noNextTopicToLoad) {
    return;
  }
  const index = newsTopicList.value.findIndex((newsTopic) => newsTopic.id === id);
  if (index + loadThreshold >= newsTopicList.value.length) {
    loadNextTopic();
  }
}

async function loadMore(topicId: string): Promise<void> {
  const indexToAppend = newsTopics.value.findIndex((newsTopic) => newsTopic.id === topicId);
  const originalNewsTopicItem: NewsTopicItem = newsTopics.value[indexToAppend];
  if (!originalNewsTopicItem) {
    return;
  }
  const newsItemsToAppend: NewsItem[] = (await getNonDuplicatedNewsTopic(topicId)).newsItems;

  const newTopicItems = [...newsTopics.value];
  newTopicItems[indexToAppend] = {
    ...originalNewsTopicItem,
    newsItems: [...originalNewsTopicItem.newsItems, ...newsItemsToAppend],
  };
  newsTopics.value = newTopicItems;
  fullLoadedTopics.value = [...fullLoadedTopics.value, topicId];
}

async function appendTopic(topicId: string): Promise<void> {
  loadedTopics.value = { ...loadedTopics.value, [topicId]: true };
  const topicItem = await getNonDuplicatedNewsTopic(topicId);
  newsTopics.value = [...newsTopics.value, topicItem];
}
</script>

<style lang="scss" scoped>
@import 'TopStoriesPage.scss';
</style>
