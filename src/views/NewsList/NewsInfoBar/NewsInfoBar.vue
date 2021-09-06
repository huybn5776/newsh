<template>
  <div class="news-info-bar-container">
    <i v-if="isYoutube" class="youtube-icon" />
    <span class="news-info-publication">{{ news.publication }}．</span>
    <span class="news-info-time-ago">{{ timeAgo }}</span>
    <NewsDropdown class="news-info-dropdown" :news="news" />
  </div>
</template>

<script lang="ts" setup>
import { defineProps, computed } from 'vue';

import NewsDropdown from '@views/NewsList/NewsDropdown/NewsDropdown.vue';

import { NewsItem } from '@interfaces/news-item';
import { formatToTimeAgo } from '@utils/time-ago';

const props = defineProps<{ news: NewsItem }>();

const isYoutube = computed(() => props.news.url.includes('youtube'));
const timeAgo = computed(() => formatToTimeAgo(props.news.timestamp));
</script>

<style lang="scss" scoped>
@import './NewsInfoBar.scss';
</style>
