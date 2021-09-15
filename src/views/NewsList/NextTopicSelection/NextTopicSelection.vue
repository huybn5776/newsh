<template>
  <div class="next-topic-selection">
    <h3 class="next-topic-header">Next topic to show</h3>
    <div class="topic-selections">
      <!--suppress RequiredAttributes -->
      <NButton
        v-for="topic of allTopicsInfo"
        :key="topic.id"
        class="next-topic-button"
        :disabled="loadedTopics[topic.id]"
        @click="emits('topicClick', topic.id)"
      >
        {{ topic.name }}
      </NButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NButton } from 'naive-ui';

import { SettingKey } from '@enums/setting-key';
import { NewsTopicInfo } from '@interfaces/news-topic-info';
import { getSettingFromStorage } from '@utils/storage-utils';

defineProps<{ loadedTopics: Record<string, true> }>();
const emits = defineEmits<{ (e: 'topicClick', value: string): void }>();

const allTopicsInfo = getSettingFromStorage<NewsTopicInfo[]>(SettingKey.AllTopicsInfo);
</script>

<style lang="scss" scoped>
@import './NextTopicSelection.scss';
</style>
