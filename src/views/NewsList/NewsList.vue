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
import { NewsTopicItem } from '@interfaces/news-topic-item';

const newsTopics = ref<NewsTopicItem[]>([]);

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const topic = route.params.topic as string;
  if (!topic) {
    newsTopics.value = await getNews('topStories');
  } else if ((topics as string[]).includes(topic)) {
    newsTopics.value = await getNews(topic as typeof topics[number]);
  } else {
    await router.push({ name: 'news' });
  }
});
</script>

<style lang="scss" scoped>
@import './NewsList.scss';
</style>
