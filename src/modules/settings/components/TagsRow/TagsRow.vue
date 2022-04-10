<template>
  <div class="setting-row">
    <span>{{ title }}: </span>
    <NDynamicTags :value="tagsRef" @update:value="onTagsUpdate" />
  </div>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';
import { NDynamicTags, useMessage } from 'naive-ui';

const props = defineProps<{ title: string; value?: string[] }>();
const emits = defineEmits<{ (e: 'update:value', value: string[]): void }>();

const message = useMessage();
const tagsRef = useVModel(props, 'value', emits);

function onTagsUpdate(newTags: string[]): void {
  const isAddingTag = newTags.length > (tagsRef.value?.length || 0);
  if (!isAddingTag) {
    tagsRef.value = newTags;
    return;
  }
  const lastIndex = newTags.length - 1;
  const newTag = newTags[lastIndex].trim();
  if (tagsRef.value?.includes(newTag)) {
    message.error(`'${newTag}' is already exists.`);
    return;
  }
  tagsRef.value = [...newTag].splice(lastIndex, lastIndex, newTag);
}
</script>

<style lang="scss" scoped>
@import '../../settings';
</style>
