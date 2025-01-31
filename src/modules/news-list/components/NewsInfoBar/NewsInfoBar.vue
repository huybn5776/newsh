<template>
  <div class="news-info-bar-container">
    <i v-if="isYoutube" class="youtube-icon" />
    <img class="news-info-publication-icon" :src="news.publicationIcon" :alt="news.publication" />
    <span class="news-info-publication">{{ news.publication }}．</span>
    <span class="news-info-time-ago">{{ timeAgo }}</span>
    <NewsDropdown class="news-info-dropdown" :news="news" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { NewsItem } from '@/interfaces/news-item';
import NewsDropdown from '@/modules/news-list/components/NewsDropdown/NewsDropdown.vue';
import { formatToTimeAgo } from '@/utils/time-ago';

const props = defineProps<{ news: NewsItem }>();

const isYoutube = computed(() => props.news.url.includes('youtube'));
const timeAgo = computed(() => formatToTimeAgo(props.news.timestamp));
</script>

<style lang="scss" scoped>
@forward './NewsInfoBar';
</style>
