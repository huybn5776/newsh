<template>
  <div class="news-item-card">
    <a :href="news.url" target="_blank">
      <h3 class="news-title">{{ news.title }}</h3>
    </a>

    <div v-if="news.relatedNewsItems?.length" class="related-news-container">
      <a v-for="relatedNews of news.relatedNewsItems" :key="relatedNews.url" :href="relatedNews.url" target="_blank">
        <h4 class="related-news-title">{{ relatedNews.title }}</h4>
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, PropType } from 'vue';

import { NewsItem } from '@interfaces/news-item';

defineProps({
  news: { type: Object as PropType<NewsItem>, required: true },
});
</script>

<style lang="scss" scoped>
@import 'NewsItemCard.scss';
</style>
