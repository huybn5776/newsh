<template>
  <NRadioGroup v-model:value="selectedFilterType" class="news-filter-type">
    <NRadio v-for="t in types" :key="t.value" :value="t.value">{{ t.label }}</NRadio>
  </NRadioGroup>
  <NInput v-model:value="filterValue" class="news-filter-input" type="textarea" autosize />
  <div class="error-message-container" :style="{ visibility: errorMessage ? undefined : 'collapse' }">
    <i class="error-icon" />
    <span>{{ errorMessage }}</span>
  </div>
</template>

<script lang="ts" setup>
import { watch, onMounted, ref } from 'vue';

import { NRadio, NRadioGroup, NInput } from 'naive-ui';

import { NewsFilterType } from '@/enums/news-filter-type';
import { NewsItem } from '@/interfaces/news-item';

const props = defineProps<{ news: NewsItem; type: NewsFilterType; value: string; errorMessage: string }>();
const emit = defineEmits<{
  (e: 'update:type', value: NewsFilterType): void;
  (e: 'update:value', value: string): void;
}>();

const types: { value: NewsFilterType; label: string }[] = [
  { value: NewsFilterType.Term, label: 'Exclude term' },
  { value: NewsFilterType.Domain, label: 'Domain' },
  { value: NewsFilterType.Publication, label: 'Publication' },
];
const selectedFilterType = ref(props.type);
const filterValue = ref(props.value);

onMounted(updateFilterValue);
watch(
  () => selectedFilterType.value,
  () => {
    updateFilterValue();
    emit('update:type', selectedFilterType.value);
  },
);
watch(
  () => filterValue.value,
  () => emit('update:value', filterValue.value),
);

function updateFilterValue(): void {
  filterValue.value = getFilterValueByType();
}

function getFilterValueByType(): string {
  switch (selectedFilterType.value) {
    case NewsFilterType.Domain:
      return new URL(props.news.url)?.host;
    case NewsFilterType.Publication:
      return props.news.publication;
    case NewsFilterType.Term:
      return props.news.title;
    default:
      return '';
  }
}
</script>

<style lang="scss" scoped>
@forward './AddNewsFilter';
</style>
