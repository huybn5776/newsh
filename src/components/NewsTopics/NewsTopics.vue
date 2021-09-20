<template>
  <NCollapse
    class="news-topic-collapse"
    @item-header-click="onNewsTopicToggleExpand"
    :default-expanded-names="topicsToShow"
  >
    <div v-for="(topic, topicIndex) of newsTopics" :key="topic.name" class="news-topic-collapse-item-container">
      <router-link
        v-if="showMoreLink"
        class="more-news-link"
        :to="{ name: 'newsTopic', params: { topicId: topic.id } }"
      >
        More
      </router-link>

      <NCollapseItem class="news-topic-section" :name="topic.id">
        <!--suppress HtmlUnknownAttribute -->
        <template #header>
          <div class="news-topic-header">
            <h2 class="news-topic-title" v-intersection="{ enter: () => emits('newsTopicEntered', topic.id) }">
              {{ topic.name }}
            </h2>
          </div>
        </template>
        <NewsItemCard
          v-for="(news, newsIndex) of topic.newsItems"
          :key="news.url"
          :news="news"
          :related-expanded="expandFirstNews && topicIndex === 0 && newsIndex === 0"
        />
        <div v-if="showMoreLink && !fullLoadedTopics.includes(topic.id)" class="news-topic-load-all-container">
          <NButton :disabled="loadingTopics[topic.id]" @click="emits('loadMore', topic.id)">
            Load all news of this topic
          </NButton>
        </div>
      </NCollapseItem>
    </div>
  </NCollapse>
</template>

<script lang="ts" setup>
import { NButton, NCollapse, NCollapseItem } from 'naive-ui';

import NewsItemCard from '@components/NewsItemCard/NewsItemCard.vue';
import { useTopicsToShow } from '@components/NewsTopics/use-topics-to-show';
import { intersectionDirectiveFactory } from '@directives/IntersectionDirective';
import { NewsTopicItem } from '@interfaces/news-topic-item';

const vIntersection = intersectionDirectiveFactory();
const { topicsToShow, addTopicToShow, deleteTopicToShow } = useTopicsToShow();

function onNewsTopicToggleExpand({ name: topicId, expanded }: { name: string; expanded: boolean }): void {
  if (expanded) {
    addTopicToShow(topicId);
  } else {
    deleteTopicToShow(topicId);
  }
}

defineProps<{
  newsTopics: NewsTopicItem[];
  showMoreLink: boolean;
  expandFirstNews: boolean;
  fullLoadedTopics: string[];
  loadingTopics: Record<string, true>;
}>();
const emits = defineEmits<{
  (e: 'newsTopicEntered', id: string): void;
  (e: 'loadMore', id: string): void;
}>();
</script>

<style lang="scss" scoped>
@import './NewsTopics.scss';
</style>
