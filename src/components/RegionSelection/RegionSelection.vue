<!--suppress RequiredAttributes -->
<template>
  <div class="region-selection">
    <FullSizeSelect
      title="Language & region of interest"
      subtitle="See news from the selected language and region pair"
      :items="regionSelections"
      v-model="selectedRegion"
      @update:modelValue="emits('update:modelValue', $event)"
    />
    <footer class="region-selection-footer">
      <NButton v-if="modelValue" @click="emits('negativeClick')">Cancel</NButton>
      <NButton type="primary" :disabled="!selectedRegion" @click="emits('positiveClick')">Ok</NButton>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { NButton } from 'naive-ui';

import FullSizeSelect from '@components/FullSizeSelect/FullSizeSelect.vue';
import { SelectionItem } from '@interfaces/selection-item';

const props = defineProps<{ modelValue?: string; regionSelections: SelectionItem[] }>();
const emits =
  defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'negativeClick'): void;
    (e: 'positiveClick'): void;
  }>();

const selectedRegion = ref(props.modelValue);
</script>

<style lang="scss" scoped>
@import './RegionSelection.scss';
</style>
