<template>
  <div class="page-content">
    <h2 class="news-topic-title">
      <router-link class="back-icon" :to="{ name: 'topStories' }"></router-link>
      {{ newsTopic?.name || newsTopicName }}
    </h2>
    <NewsItemCard
      v-for="(news, newsIndex) of newsTopic?.newsItems"
      :key="news.url"
      :news="news"
      :related-expanded="!isMobile && newsIndex === 0"
    />
    <DotsLoader v-if="isLoading" />
    <NextTopicSelection
      v-if="!isLoading"
      title="Go to topic"
      :disabledTopics="{ [newsTopic?.id || '']: true }"
      @topicClick="goToTopic"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import DotsLoader from '@components/DotsLoader/DotsLoader.vue';
import NewsItemCard from '@components/NewsItemCard/NewsItemCard.vue';
import { useIsMobile } from '@compositions/use-is-mobile';
import { useProvideSeenNews } from '@compositions/use-provide-seen-news';
import { SettingKey } from '@enums/setting-key';
import { NewsTopicItem } from '@interfaces/news-topic-item';
import { getSettingFromStorage } from '@utils/storage-utils';
import NextTopicSelection from '@views/TopStoriesPage/NextTopicSelection/NextTopicSelection.vue';
import { useNewsRequest } from '@views/TopStoriesPage/use-news-request';

const allTopicsInfo = ref(getSettingFromStorage(SettingKey.AllTopicsInfo) || []);
const newsTopicName = ref<string>();
const newsTopic = ref<NewsTopicItem>();

const route = useRoute();
const router = useRouter();
const isMobile = useIsMobile();
const { getSingleTopicNews, isLoading } = useNewsRequest();
useProvideSeenNews();

onMounted(() => loadNews());

watch(route, () => loadNews(), { flush: 'post' });

async function loadNews(): Promise<void> {
  newsTopic.value = undefined;
  const topicId = route.params.topicId as string;
  newsTopicName.value = allTopicsInfo.value.find((topic) => topic.id === topicId)?.name;

  if (allTopicsInfo.value.some((topic) => topic.id === topicId)) {
    newsTopic.value = await getSingleTopicNews(topicId);
  } else {
    await router.push({ name: 'topStories' });
  }
}

function goToTopic(topicId: string): void {
  router.push({ name: 'newsTopic', params: { topicId } });
}
</script>

<style lang="scss" scoped>
@import './NewsTopicPage.scss';
</style>
