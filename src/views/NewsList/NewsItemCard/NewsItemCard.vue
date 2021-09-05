<template>
  <div class="news-item-card">
    <div class="news-item">
      <a :href="news.url" class="news-link" target="_blank">
        <h3 class="news-title">{{ news.title }}</h3>
        <NewsInfoBar :news="news" />
      </a>

      <div v-if="news.relatedNewsItems?.length" class="related-news-list">
        <a
            v-for="relatedNews of news.relatedNewsItems"
            :key="relatedNews.url"
            class="related-news-link"
            target="_blank"
            :href="relatedNews.url"
        >
          <div class="related-news-container">
            <h4 class="related-news-title">{{ relatedNews.title }}</h4>
            <NewsInfoBar :news="relatedNews" />
          </div>
        </a>
      </div>
    </div>

    <img class="news-image" :src="news.image" :alt="news.excerpt" />
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

import NewsInfoBar from '@views/NewsList/NewsInfoBar/NewsInfoBar.vue';

import { NewsItem } from '@interfaces/news-item';

defineProps<{ news: NewsItem }>();
</script>

<style lang="scss" scoped>
@import 'NewsItemCard.scss';
</style>
