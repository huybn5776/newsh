<template>
  <div class="full-size-select">
    <h3 class="full-size-select-title">{{ title }}</h3>
    <p class="full-size-select-subtitle">{{ subtitle }}</p>
    <!--suppress RequiredAttributes -->
    <NInput
      class="region-search-input"
      placeholder="Search for language or region"
      clearable
      v-model:value="searchTerm"
    />
    <!--suppress RequiredAttributes -->
    <NRadioGroup
      class="selections-container"
      v-model:value="selectedValue"
      @update-value="emits('update:modelValue', $event)"
    >
      <!--suppress RequiredAttributes -->
      <NRadio v-for="item of filteredItems" :key="item.key" class="selection" :value="item.key">
        {{ item.label }}
      </NRadio>
    </NRadioGroup>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

import { NInput, NRadio, NRadioGroup } from 'naive-ui';

import { useDebounce } from '@compositions/use-debounce';
import { SelectionItem } from '@interfaces/selection-item';

const props = defineProps<{ modelValue?: string; items: SelectionItem[]; title: string; subtitle: string }>();
const emits = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const selectedValue = ref(props.modelValue);
const searchTerm = ref('');
const debouncedSearchTerm = useDebounce(searchTerm, { immediatelyClear: true });

const filteredItems = computed(() => {
  if (debouncedSearchTerm.value) {
    const term = debouncedSearchTerm.value.toLowerCase();
    return props.items.filter(
      (item) => item.key.toLowerCase().includes(term) || item.label.toLowerCase().includes(term),
    );
  }
  return props.items;
});
</script>

<style lang="scss" scoped>
@import './FullSizeSelect.scss';
</style>
