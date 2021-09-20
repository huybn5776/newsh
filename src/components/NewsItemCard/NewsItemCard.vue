<template>
  <div class="news-item-card">
    <Image class="news-image" :src="news.image" :alt="news.excerpt" />

    <div class="news-item">
      <a
        :href="news.url"
        class="news-link"
        target="_blank"
        v-intersection="{ enter: () => onNewsEnter(news), leave: () => onNewsLeave(news) }"
        :class="seenNewsUrlMap[news.url] ? 'seen-news' : ''"
      >
        <h3 class="news-title">{{ news.title }}</h3>
        <NewsInfoBar :news="news" />
      </a>

      <div v-if="hasRelatedNews" class="related-news-list">
        <a
          v-for="(relatedNews, index) of news.relatedNewsItems"
          :key="relatedNews.url"
          v-show="expanded || (!isMobile && index === 0)"
          class="related-news-link"
          target="_blank"
          v-intersection="{ enter: () => onNewsEnter(relatedNews), leave: () => onNewsLeave(relatedNews) }"
          :href="relatedNews.url"
          :class="seenNewsUrlMap[relatedNews.url] ? 'seen-news' : ''"
        >
          <div class="related-news-container">
            <h4 class="related-news-title">{{ relatedNews.title }}</h4>
            <NewsInfoBar :news="relatedNews" />
          </div>
        </a>
      </div>
    </div>

    <!--suppress RequiredAttributes -->
    <ChevronArrow v-if="expandable" class="news-expand-arrow" v-model:direction="expandedDirection" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onUpdated, inject } from 'vue';

import ChevronArrow from '@components/ChevronArrow/ChevronArrow.vue';
import Image from '@components/Image/Image.vue';
import NewsInfoBar from '@components/NewsInfoBar/NewsInfoBar.vue';
import { useIsMobile } from '@compositions/use-is-mobile';
import { useMarkNewsAsSeen } from '@compositions/use-mark-news-as-seen';
import { provideSeenNewsUrlMap, provideHiddenSeenNewsSetting } from '@compositions/use-provide-seen-news';
import { intersectionDirectiveFactory } from '@directives/IntersectionDirective';
import { NewsItem } from '@interfaces/news-item';

const props = defineProps<{ news: NewsItem; relatedExpanded?: boolean }>();
const emits = defineEmits<{ (direction: 'update:relatedExpanded', value: boolean): void }>();
const vIntersection = intersectionDirectiveFactory({ threshold: 1 });

const expandedDirection = ref<'up' | 'down'>(props.relatedExpanded ? 'up' : 'down');
const hideSeenNewsEnabled = inject(provideHiddenSeenNewsSetting);
const seenNewsUrlMap = inject(provideSeenNewsUrlMap) as Record<string, boolean>;

const expanded = computed(() => expandedDirection.value === 'up');
const hasRelatedNews = computed(() => props.news.relatedNewsItems?.length);
const isMobile = useIsMobile();
const expandable = computed(
  () => hasRelatedNews.value && ((props.news.relatedNewsItems?.length || 0) > 1 || isMobile.value),
);

const markNewsSeenCallback = useMarkNewsAsSeen(seenNewsUrlMap);

function onNewsEnter(newsItem: NewsItem): void {
  if (hideSeenNewsEnabled) {
    markNewsSeenCallback.onNewsEnter(newsItem);
  }
}

function onNewsLeave(newsItem: NewsItem): void {
  if (hideSeenNewsEnabled) {
    markNewsSeenCallback.onNewsLeave(newsItem);
  }
}

onUpdated(() => {
  emits('update:relatedExpanded', expanded.value);
});
</script>

<style lang="scss" scoped>
@import 'NewsItemCard.scss';
</style>
