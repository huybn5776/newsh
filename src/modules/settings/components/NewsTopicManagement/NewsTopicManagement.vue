<template>
  <ListDragSort
    v-slot="{ item }"
    class="news-topic-list"
    :items="allTopicRef"
    @update:items="onSortChanged(asTopicInfoList($event))"
  >
    <div class="news-topic-info-row">
      <input
        class="news-topic-name-input"
        :value="asTopicInfo(item).name"
        @change="onTopicInfoNameChange(asTopicInfo(item), $event)"
      />
      <i v-if="!asTopicInfo(item).isCustomTopic" class="pencil-icon" />
      <NButton
        v-if="asTopicInfo(item).isCustomTopic"
        class="remove-topic-button"
        circle
        quaternary
        aria-label="remove"
        @click="removeTopic(asTopicInfo(item))"
      />
    </div>
  </ListDragSort>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';
import { NButton } from 'naive-ui';

import ListDragSort from '@/components/ListDragSort/ListDragSort.vue';
import { NewsTopicInfo } from '@/interfaces/news-topic-info';

const props = defineProps<{ topicInfoList: NewsTopicInfo[] }>();
const emit = defineEmits<{
  (e: 'update:topicInfoList', value: NewsTopicInfo[]): void;
}>();
const allTopicRef = useVModel(props, 'topicInfoList', emit);

function onSortChanged(topicInfoList: NewsTopicInfo[]): void {
  allTopicRef.value = topicInfoList;
}

function onTopicInfoNameChange(topicInfo: NewsTopicInfo, event: Event): void {
  const index = props.topicInfoList.indexOf(topicInfo);
  const newTopicInfoList = [...props.topicInfoList];
  const newTopicInfo: NewsTopicInfo = { ...topicInfo };
  newTopicInfo.name = (event.target as HTMLInputElement).value;
  newTopicInfoList[index] = newTopicInfo;
  allTopicRef.value = newTopicInfoList;
}

function removeTopic(topicInfo: NewsTopicInfo): void {
  allTopicRef.value = allTopicRef.value.filter((topic) => topic.id !== topicInfo.id);
}

function asTopicInfoList(items: object[]): NewsTopicInfo[] {
  return items as NewsTopicInfo[];
}

function asTopicInfo(item: object): NewsTopicInfo {
  return item as NewsTopicInfo;
}
</script>

<style lang="scss" scoped>
@forward './NewsTopicManagement';
</style>
