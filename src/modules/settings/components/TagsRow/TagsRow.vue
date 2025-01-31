<template>
  <div class="setting-row">
    <span>{{ title }}: </span>
    <NDynamicTags v-model:value="tagsRef" @update:value="onTagsUpdate" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { NDynamicTags, useMessage } from 'naive-ui';

const props = defineProps<{ title: string; value?: string[] }>();
const emit = defineEmits<{ (e: 'update:value', value: string[]): void }>();

const message = useMessage();
const tagsRef = ref(props.value);

function onTagsUpdate(newTags: string[]): void {
  const isAddingTag = newTags.length > (tagsRef.value?.length ?? 0);
  if (!isAddingTag) {
    tagsRef.value = newTags;
    emit('update:value', newTags);
    return;
  }
  const lastIndex = newTags.length - 1;
  const newTag = newTags[lastIndex].trim();
  if (tagsRef.value?.includes(newTag)) {
    message.error(`'${newTag}' is already exists.`);
    return;
  }
  tagsRef.value = newTag.split('').splice(lastIndex, lastIndex, newTag);
  emit('update:value', newTags);
}
</script>

<style lang="scss" scoped>
@forward '../../settings';
</style>
