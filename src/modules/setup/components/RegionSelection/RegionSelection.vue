<!--suppress RequiredAttributes -->
<template>
  <div class="region-selection">
    <FullSizeSelect
      v-model="selectedRegion"
      title="Language & region of interest"
      subtitle="See news from the selected language and region pair"
      :items="regionSelections"
      @update:modelValue="emit('update:modelValue', $event)"
    />
    <footer class="region-selection-footer">
      <NButton v-if="cancelable" @click="emit('negativeClick')">Cancel</NButton>
      <NButton type="primary" :disabled="disableOkButton || !selectedRegion" @click="emit('positiveClick')">
        Ok
      </NButton>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { NButton } from 'naive-ui';

import { SelectionItem } from '@/interfaces/selection-item';
import FullSizeSelect from '@/modules/setup/components/FullSizeSelect/FullSizeSelect.vue';

const props = defineProps<{
  modelValue?: string;
  regionSelections: SelectionItem[];
  cancelable: boolean;
  disableOkButton: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'negativeClick'): void;
  (e: 'positiveClick'): void;
}>();

const selectedRegion = ref(props.modelValue);
</script>

<style lang="scss" scoped>
@forward './RegionSelection';
</style>
