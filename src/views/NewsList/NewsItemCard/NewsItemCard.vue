<template>
  <div class="news-item-card">
    <img class="news-image" :src="news.image" :alt="news.excerpt" />

    <div class="news-item">
      <a :href="news.url" class="news-link" target="_blank">
        <h3 class="news-title">{{ news.title }}</h3>
        <NewsInfoBar :news="news" />
      </a>

      <div v-if="hasRelatedNews" class="related-news-list">
        <a
          v-for="relatedNews of news.relatedNewsItems"
          :key="relatedNews.url"
          v-show="expanded"
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

    <ChevronArrow v-if="hasRelatedNews" class="news-expand-arrow" v-model:direction="expandedDirection" />
  </div>
</template>

<script lang="ts" setup>
import { defineProps, ref, computed } from 'vue';

import NewsInfoBar from '@views/NewsList/NewsInfoBar/NewsInfoBar.vue';

import ChevronArrow from '@components/ChevronArrow/ChevronArrow.vue';
import { NewsItem } from '@interfaces/news-item';

const props = defineProps<{ news: NewsItem }>();

const expandedDirection = ref<'up' | 'down'>(props.relatedExpanded ? 'up' : 'down');

const expanded = computed(() => expandedDirection.value === 'up');
const hasRelatedNews = computed(() => props.news.relatedNewsItems?.length);
</script>

<style lang="scss" scoped>
@import 'NewsItemCard.scss';
</style>
