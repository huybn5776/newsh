<template>
  <div class="full-size-select">
    <h3 class="full-size-select-title">{{ title }}</h3>
    <p class="full-size-select-subtitle">{{ subtitle }}</p>
    <!--suppress RequiredAttributes -->
    <NInput
      v-model:value="searchTerm"
      class="region-search-input"
      placeholder="Search for language or region"
      clearable
    />
    <!--suppress RequiredAttributes -->
    <NRadioGroup
      v-model:value="selectedValue"
      class="selections-container"
      @updateValue="emit('update:modelValue', $event)"
    >
      <template v-for="item of filteredItems" :key="item.key">
        <p v-if="item.type === 'separator'" class="selection-separator">{{ item.label }}</p>
        <!--suppress RequiredAttributes -->
        <NRadio v-else class="selection" :value="item.key">
          {{ item.label }}
        </NRadio>
      </template>
    </NRadioGroup>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

import { NInput, NRadio, NRadioGroup } from 'naive-ui';

import { useDebounce } from '@/compositions/use-debounce';
import { SelectionItem } from '@/interfaces/selection-item';

const props = defineProps<{ modelValue?: string; items: SelectionItem[]; title: string; subtitle: string }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

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
@forward './FullSizeSelect';
</style>
