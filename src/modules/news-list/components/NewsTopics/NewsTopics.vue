<template>
  <NCollapse
    class="news-topic-collapse"
    :defaultExpandedNames="topicsToShow"
    @itemHeaderClick="onNewsTopicToggleExpand"
  >
    <div v-for="topic of newsTopics" :key="topic.name" class="news-topic-collapse-item-container">
      <router-link
        v-if="showMoreLink"
        :to="{ name: 'newsTopic', params: { topicId: topic.id } }"
        class="more-news-link"
      >
        More
      </router-link>

      <NCollapseItem class="news-topic-section" :name="topic.id" :data-topic-id="topic.id">
        <template #header>
          <div class="news-topic-header">
            <h2 v-intersection="{ enter: () => emit('newsTopicEntered', topic.id) }" class="news-topic-title">
              {{ topic.name }}
            </h2>
          </div>
        </template>
        <NewsItemCard
          v-for="news of topic.newsItems"
          :key="news.url"
          :news="news"
          :relatedExpanded="expandedNews[`${topic.id}-${news.url}`]"
          :data-url="news.url"
          @update:relatedExpanded="onNewsExpandChanged(topic.id, news.url, $event)"
        />
        <div v-if="showMoreLink && topic.isPartial" class="news-topic-load-all-container">
          <NButton :disabled="loadingTopics[topic.id]" @click="emit('loadMore', topic.id)">
            Load all news of this topic
          </NButton>
        </div>
      </NCollapseItem>
    </div>
  </NCollapse>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';

import { NButton, NCollapse, NCollapseItem } from 'naive-ui';

import { intersectionDirectiveFactory } from '@/directives/IntersectionDirective';
import { SettingKey } from '@/enums/setting-key';
import { NewsTopicItem } from '@/interfaces/news-topic-item';
import NewsItemCard from '@/modules/news-list/components/NewsItemCard/NewsItemCard.vue';
import { useTopicsToShow } from '@/modules/news-list/compositions/use-topics-to-show';
import { getSettingFromStorage } from '@/services/setting-service';
import { listenForKeyUntilUnmounted } from '@/utils/keyboard-event-utils';

const vIntersection = intersectionDirectiveFactory();
const { topicsToShow, addTopicToShow, deleteTopicToShow } = useTopicsToShow();

function onNewsTopicToggleExpand({ name: topicId, expanded }: { name: string; expanded: boolean }): void {
  if (expanded) {
    addTopicToShow(topicId);
  } else {
    deleteTopicToShow(topicId);
  }
}

const props = defineProps<{
  newsTopics: NewsTopicItem[];
  showMoreLink: boolean;
  expandFirstNews: boolean;
  loadingTopics: Record<string, true>;
}>();
const emit = defineEmits<{
  (e: 'newsTopicEntered', id: string): void;
  (e: 'loadMore', id: string): void;
}>();

const expandedNews = ref<Record<string, boolean>>({});
const firstNewsExpanded = ref(false);

watch(
  () => props.newsTopics,
  () => {
    if (!props.expandFirstNews || firstNewsExpanded.value) {
      return;
    }
    const firstTopicId = props.newsTopics[0]?.id;
    const firstNewsUrlOfFirstTopic = props.newsTopics?.[0].newsItems[0]?.url;
    if (!firstTopicId || !firstNewsUrlOfFirstTopic) {
      return;
    }
    expandedNews.value = { ...expandedNews.value, [`${firstTopicId}-${firstNewsUrlOfFirstTopic}`]: true };
    firstNewsExpanded.value = true;
  },
);

onMounted(() => {
  if (getSettingFromStorage(SettingKey.SpaceKeyToExpandRelated)) {
    listenForKeyUntilUnmounted('Space', (event) => {
      const { topicId, url } = getHoveringNews();
      if (!topicId || !url) {
        return;
      }
      event.preventDefault();
      toggleNewsExpanded(topicId, url);
    });
  }
});

function getHoveringNews(): { topicId?: string; url?: string } {
  const hoveringSection = document.querySelector('[data-topic-id]:hover');
  const hoveringNewsItemCard = document.querySelector('[data-url]:hover');
  if (!hoveringSection || !hoveringNewsItemCard) {
    return {};
  }
  const topicId = hoveringSection.getAttribute('data-topic-id') || undefined;
  const url = hoveringNewsItemCard.getAttribute('data-url') || undefined;
  return { topicId, url };
}

function toggleNewsExpanded(topicId: string, url: string): void {
  const key = `${topicId}-${url}`;
  const orgExpanded = expandedNews.value[key] || false;
  expandedNews.value = { ...expandedNews.value, [`${topicId}-${url}`]: !orgExpanded };
}

function onNewsExpandChanged(topicId: string, newsUrl: string, expanded: boolean): void {
  expandedNews.value = { ...expandedNews.value, [`${topicId}-${newsUrl}`]: expanded };
}
</script>

<style lang="scss" scoped>
@forward './NewsTopics';
</style>
