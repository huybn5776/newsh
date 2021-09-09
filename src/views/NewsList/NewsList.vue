<template>
  <div class="page-content news-list">
    <NCollapse class="news-topic-collapse" @item-header-click="onNewsTopicToggleExpand" :default-expanded-names="topicsToShow">
      <div v-for="(topic, topicIndex) of newsTopicList" :key="topic.name" class="news-topic-collapse-item-container">
        <router-link v-if="!isSingleTopic" class="more-news-link" :to="{ name: 'news', params: { topic: topic.type } }">
          More
        </router-link>

        <NCollapseItem class="news-topic-section" :name="topic.type">
          <!--suppress HtmlUnknownAttribute -->
          <template #header>
            <div class="news-topic-header">
              <h2 class="news-topic-title" v-intersection="{ enter: () => onNewsTopicEnter(topic.type) }">
                {{ topic.name }}
              </h2>
            </div>
          </template>
          <NewsItemCard
            v-for="(news, newsIndex) of topic.newsItems"
            :key="news.url"
            :news="news"
            :related-expanded="!isMobile && topicIndex === 0 && newsIndex === 0"
          />
          <div v-if="!isSingleTopic && !fullLoadedTopics.includes(topic.type)" class="news-topic-load-all-container">
            <NButton :disabled="loadingTopics[topic.type]" @click="loadMore(topic.type)">
              Load all news of this topic
            </NButton>
          </div>
        </NCollapseItem>
      </div>
    </NCollapse>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';

import { NButton, NCollapse, NCollapseItem } from 'naive-ui';
import { useRoute, useRouter } from 'vue-router';

import { useIsMobile } from '@compositions/use-is-mobile';
import { intersectionDirectiveFactory } from '@directives/IntersectionDirective';
import { NewsTopicType } from '@enums/news-topic-type';
import { SettingKey } from '@enums/setting-key';
import { NewsItem } from '@interfaces/news-item';
import { NewsTopicItem } from '@interfaces/news-topic-item';
import { collapseRelatedNewsExcept, removeYoutubeNews, removeByNewsSource, removeByTerms } from '@services/news-filter';
import { getSettingFromStorage } from '@utils/storage-utils';
import NewsItemCard from '@views/NewsList/NewsItemCard/NewsItemCard.vue';
import { useNewsRequest } from '@views/NewsList/use-news-request';
import { useProvideSeenNews } from '@views/NewsList/use-provide-seen-news';
import { useTopicsToShow } from '@views/NewsList/use-topics-to-show';

const vIntersection = intersectionDirectiveFactory();

const newsTopics = ref<NewsTopicItem[]>([]);
const fullLoadedTopics = ref<NewsTopicType[]>([]);

const newsTopicList = computed(() => {
  let newsTopicItems = newsTopics.value.map(collapseRelatedNewsExcept(topicsToShow.value));
  if (getSettingFromStorage(SettingKey.FilterOutYoutube)) {
    newsTopicItems = newsTopicItems.map(removeYoutubeNews());
  }
  const hiddenSources = getSettingFromStorage<string[]>(SettingKey.HiddenSources);
  if (hiddenSources?.length) {
    newsTopicItems = newsTopicItems.map(removeByNewsSource(hiddenSources));
  }
  const excludedTerms = getSettingFromStorage<string[]>(SettingKey.ExcludeTerms);
  if (excludedTerms?.length) {
    newsTopicItems = newsTopicItems.map(removeByTerms(excludedTerms));
  }
  return newsTopicItems;
});
const isSingleTopic = computed(() => !!route.params.topic);

const route = useRoute();
const router = useRouter();
const isMobile = useIsMobile();
const { topicsToShow, addTopicToShow, deleteTopicToShow } = useTopicsToShow();
useProvideSeenNews(newsTopics);
const { getSingleTopicNews, getMultiTopicNews, loadingTopics } = useNewsRequest();

onMounted(() => {
  loadNews();
});

watch(
  route,
  () => {
    newsTopics.value = [];
    loadedNewsTopicIndex.value = -1;
    loadNews();
  },
  { flush: 'post' },
);

function onNewsTopicToggleExpand({ name: topicType, expanded }: { name: NewsTopicType; expanded: boolean }): void {
  if (expanded) {
    addTopicToShow(topicType as NewsTopicType);
  } else {
    deleteTopicToShow(topicType as NewsTopicType);
  }
}

async function loadNews(): Promise<void> {
  const topic = route.params.topic as string;
  if (!topic) {
    newsLoaders.value = [
      () => getMultiTopicNews('topStories'),
      () => getMultiTopicNews('worldAndNation'),
      () => getMultiTopicNews('others'),
      async () => [await getNonDuplicatedNewsTopic(NewsTopicType.Headline)],
    ];
    await loadNextTopic();
  } else if (Object.values(NewsTopicType).includes(topic as NewsTopicType)) {
    newsLoaders.value = [async () => [await getSingleTopicNews(topic as NewsTopicType)]];
    await loadNextTopic();
    fullLoadedTopics.value = newsTopics.value.map((newsTopic) => newsTopic.type);
  } else {
    await router.push({ name: 'news' });
  }
}

const loadedNewsTopicIndex = ref(-1);
const newsLoaders = ref<(() => Promise<NewsTopicItem[]>)[]>([]);

async function loadNextTopic(): Promise<void> {
  loadedNewsTopicIndex.value++;
  const newsLoader = newsLoaders.value[loadedNewsTopicIndex.value];
  if (newsLoader) {
    newsTopics.value = [...newsTopics.value, ...(await newsLoader())];
  }
}

async function getNonDuplicatedNewsTopic(topicType: NewsTopicType): Promise<NewsTopicItem> {
  const allNewsUrl = newsTopics.value.flatMap((topic) => [
    ...topic.newsItems.map((news) => news.url),
    ...topic.newsItems.flatMap((news) =>
      ((news.relatedNewsItems || []) as NewsItem[]).map((relatedNews) => relatedNews.url),
    ),
  ]);

  const newsTopicItem = await getSingleTopicNews(topicType);
  newsTopicItem.newsItems = newsTopicItem.newsItems.filter((news) => !allNewsUrl.includes(news.url));
  return newsTopicItem;
}

function onNewsTopicEnter(topicType: string): void {
  const loadThreshold = 2;
  const completeLoaded = loadedNewsTopicIndex.value === newsLoaders.value.length - 1;
  if (completeLoaded) {
    return;
  }
  const index = newsTopicList.value.findIndex((newsTopic) => newsTopic.type === topicType);
  if (index + loadThreshold >= newsTopicList.value.length) {
    loadNextTopic();
  }
}

async function loadMore(topicType: NewsTopicType): Promise<void> {
  const indexToAppend = newsTopics.value.findIndex((newsTopic) => newsTopic.type === topicType);
  const originalNewsTopicItem: NewsTopicItem = newsTopics.value[indexToAppend];
  if (!originalNewsTopicItem) {
    return;
  }
  const newsItemsToAppend: NewsItem[] = (await getNonDuplicatedNewsTopic(topicType)).newsItems;

  const newTopicItems = [...newsTopics.value];
  newTopicItems[indexToAppend] = {
    ...originalNewsTopicItem,
    newsItems: [...originalNewsTopicItem.newsItems, ...newsItemsToAppend],
  };
  newsTopics.value = newTopicItems;
  fullLoadedTopics.value = [...fullLoadedTopics.value, topicType];
}
</script>

<style lang="scss" scoped>
@import './NewsList.scss';
</style>
