<template>
  <div class="page-content news-list">
    <div v-for="topic of newsTopics" :key="topic.name" class="news-topic-section">
      <h2 class="news-topic-title">{{ topic.name }}</h2>
      <NewsItemCard v-for="news of topic.newsItems" :key="news.url" :news="news" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';

import NewsItemCard from '@views/NewsList/NewsItemCard/NewsItemCard.vue';
import { useRoute, useRouter } from 'vue-router';

import { getNews, topics } from '@api/google-news-api';
import { NewsItem } from '@interfaces/news-item';
import { NewsTopicItem } from '@interfaces/news-topic-item';

const newsTopics = ref<NewsTopicItem[]>([]);

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const topic = route.params.topic as string;
  if (!topic) {
    await fetchTopStories();
  } else if ((topics as string[]).includes(topic)) {
    newsTopics.value = await getNews(topic as typeof topics[number]);
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
