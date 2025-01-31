<template>
  <div class="next-topic-selection">
    <h3 class="next-topic-header">{{ title }}</h3>
    <div class="topic-selections">
      <!--suppress RequiredAttributes -->
      <NButton
        v-for="topic of allTopicsInfo"
        :key="topic.id"
        class="next-topic-button"
        :disabled="disabledTopics[topic.id]"
        @click="emit('topicClick', topic.id)"
      >
        {{ topic.name }}
      </NButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NButton } from 'naive-ui';

import { SettingKey } from '@/enums/setting-key';
import { getSettingFromStorage } from '@/services/setting-service';

defineProps<{ title: string; disabledTopics: Record<string, true> }>();
const emit = defineEmits<{ (e: 'topicClick', value: string): void }>();

const allTopicsInfo = getSettingFromStorage(SettingKey.AllTopicsInfo);
</script>

<style lang="scss" scoped>
@forward './NextTopicSelection';
</style>
