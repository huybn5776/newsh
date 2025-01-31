<template>
  <div class="news-item-card">
    <ImageView class="news-image" :src="news.image" :alt="news.excerpt" />

    <div class="news-item">
      <a
        v-intersection="{ enter: () => onNewsEnter(news), leave: () => onNewsLeave(news) }"
        :href="news.url"
        class="news-link main-news-link"
        target="_blank"
        :class="{ 'seen-news': newsItemSeen, 'single-news': !hasRelatedNews }"
      >
        <h3 class="news-title">{{ news.title }}</h3>
        <NewsInfoBar :news="news" />
      </a>

      <div v-if="hasRelatedNews" class="related-news-list">
        <a
          v-for="(relatedNews, index) of news.relatedNewsItems"
          v-show="expanded || (!isMobile && index === 0)"
          :key="relatedNews.url"
          v-intersection="{
            disabled: !hideSeenNewsEnabled,
            enter: () => onNewsEnter(relatedNews),
            leave: () => onNewsLeave(relatedNews),
          }"
          class="news-link related-news-link"
          target="_blank"
          :href="relatedNews.url"
          :class="{ 'seen-news': relatedNewsItemSeen[index] }"
        >
          <div class="related-news-container">
            <h4 class="related-news-title">{{ relatedNews.title }}</h4>
            <NewsInfoBar :news="relatedNews" />
          </div>
        </a>
      </div>
    </div>

    <!--suppress RequiredAttributes -->
    <ChevronArrow
      v-if="expandable"
      class="news-expand-arrow"
      :direction="expandedDirection"
      @update:direction="onExpandDirectionChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, inject, watch } from 'vue';

import ChevronArrow from '@/components/ChevronArrow/ChevronArrow.vue';
import { useIsMobile } from '@/compositions/use-is-mobile';
import { intersectionDirectiveFactory } from '@/directives/IntersectionDirective';
import { NewsItem } from '@/interfaces/news-item';
import ImageView from '@/modules/news-list/components/ImageView/ImageView.vue';
import NewsInfoBar from '@/modules/news-list/components/NewsInfoBar/NewsInfoBar.vue';
import { useMarkNewsAsSeen } from '@/modules/news-list/compositions/use-mark-news-as-seen';
import { isNewsItemExists } from '@/modules/news-list/services/news-filter-service';
import { provideSeenNewsInjectKey, provideHiddenSeenNewsSettingKey } from '@/symbols';
import { injectStrict } from '@/utils/inject-utils';

const props = defineProps<{ news: NewsItem; relatedExpanded?: boolean }>();
const emit = defineEmits<{ (direction: 'update:relatedExpanded', value: boolean): void }>();
const vIntersection = intersectionDirectiveFactory({ threshold: 1 });

const hideSeenNewsEnabled = inject(provideHiddenSeenNewsSettingKey);
const seenNewsIndex = injectStrict(provideSeenNewsInjectKey);

const expanded = ref(props.relatedExpanded || false);
const expandedDirection = computed<'up' | 'down'>(() => (expanded.value ? 'up' : 'down'));
const hasRelatedNews = computed(() => props.news.relatedNewsItems?.length);
const isMobile = useIsMobile();
const expandable = computed(
  () => hasRelatedNews.value && ((props.news.relatedNewsItems?.length ?? 0) > 1 || isMobile.value),
);

const newsItemSeen = computed(() => isNewsItemExists(seenNewsIndex.value, props.news));
const relatedNewsItemSeen = computed(() =>
  (props.news.relatedNewsItems ?? []).map((news) => isNewsItemExists(seenNewsIndex.value, news)),
);

const markNewsSeenCallback = useMarkNewsAsSeen(seenNewsIndex);

watch(
  () => props.relatedExpanded,
  () => (expanded.value = props.relatedExpanded || false),
);

function onNewsEnter(newsItem: NewsItem): void {
  markNewsSeenCallback.onNewsEnter(newsItem);
}

function onNewsLeave(newsItem: NewsItem): void {
  markNewsSeenCallback.onNewsLeave(newsItem);
}

function onExpandDirectionChange(direction: 'up' | 'down'): void {
  expanded.value = direction === 'up';
  emit('update:relatedExpanded', expanded.value);
}
</script>

<style lang="scss" scoped>
@forward './NewsItemCard';
</style>
