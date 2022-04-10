<template>
  <div class="setting-row">
    <span>{{ title }}: </span>
    <NDynamicTags v-model:value="tagsRef" />
  </div>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';
import { NDynamicTags } from 'naive-ui';

const props = defineProps<{ title: string; value?: string[] }>();
const emits = defineEmits<{ (e: 'update:value', value: string[]): void }>();

const tagsRef = useVModel(props, 'value', emits);
</script>

<style lang="scss" scoped>
@import '../../settings';
</style>
