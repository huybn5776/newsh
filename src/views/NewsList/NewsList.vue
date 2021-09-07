<template>
  <div class="page-content news-list">
    <NCollapse @item-header-click="onNewsTopicToggleExpand" :default-expanded-names="topicsToShow">
      <NCollapseItem
        v-for="(topic, topicIndex) of newsTopicList"
        :key="topic.name"
        class="news-topic-section"
        :name="topic.type"
      >
        <!--suppress HtmlUnknownAttribute -->
        <template #header>
          <h2 class="news-topic-title">{{ topic.name }}</h2>
        </template>
        <NewsItemCard
          v-for="(news, newsIndex) of topic.newsItems"
          :key="news.url"
          :news="news"
          :related-expanded="!isMobile && topicIndex === 0 && newsIndex === 0"
        />
      </NCollapseItem>
    </NCollapse>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';

import NewsItemCard from '@views/NewsList/NewsItemCard/NewsItemCard.vue';
import { useTopicsToShow } from '@views/NewsList/use-topics-to-show';
import { NCollapse, NCollapseItem } from 'naive-ui';
import { useRoute, useRouter } from 'vue-router';

import { getNews, requestTopics } from '@api/google-news-api';
import { useIsMobile } from '@compositions/use-is-mobile';
import { NewsTopicType } from '@enums/news-topic-type';
import { SettingKey } from '@enums/setting-key';
import { NewsItem } from '@interfaces/news-item';
import { NewsTopicItem } from '@interfaces/news-topic-item';
import { collapseRelatedNewsExcept, removeYoutubeNews, removeByNewsSource, removeByTerms } from '@services/news-filter';
import { getSettingFromStorage } from '@utils/storage-utils';

const newsTopics = ref<NewsTopicItem[]>([]);
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

const route = useRoute();
const router = useRouter();
const isMobile = useIsMobile();
const { topicsToShow, addTopicToShow, deleteTopicToShow } = useTopicsToShow();

function onNewsTopicToggleExpand({ name: topicType, expanded }: { name: NewsTopicType; expanded: boolean }): void {
  if (expanded) {
    addTopicToShow(topicType as NewsTopicType);
  } else {
    deleteTopicToShow(topicType as NewsTopicType);
  }
}

onMounted(async () => {
  const topic = route.params.topic as string;
  if (!topic) {
    await fetchTopStories();
  } else if ((requestTopics as string[]).includes(topic)) {
    newsTopics.value = await getNews(topic as typeof requestTopics[number]);
  } else {
    await router.push({ name: 'news' });
  }
});

async function fetchTopStories(): Promise<void> {
  newsTopics.value = await getNews('topStories');
  newsTopics.value = [
    ...newsTopics.value,
    ...(await Promise.all([await getNews('worldAndNation'), await getNews('others')])).flatMap(
      (newsTopicArray) => newsTopicArray,
    ),
  ];

  const allNewsUrl = newsTopics.value.flatMap((topic) => [
    ...topic.newsItems.map((news) => news.url),
    ...topic.newsItems.flatMap((news) =>
      ((news.relatedNewsItems || []) as NewsItem[]).map((relatedNews) => relatedNews.url),
    ),
  ]);

  const headlineNewsTopic = (await getNews('headline'))[0];
  headlineNewsTopic.newsItems = headlineNewsTopic.newsItems.filter((news) => !allNewsUrl.includes(news.url));
  newsTopics.value = [...newsTopics.value, headlineNewsTopic];
}
</script>

<style lang="scss" scoped>
@import './NewsList.scss';
</style>
