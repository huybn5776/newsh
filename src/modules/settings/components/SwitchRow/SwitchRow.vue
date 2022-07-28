<template>
  <button class="setting-row switch-row" ref="switchRowRef" @click="onSwitchRowClick">
    <NSwitch v-model:value="checked" :disabled="disabled" :loading="loading" ref="switchRef" />
    <span><slot /></span>
  </button>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { useVModel } from '@vueuse/core';
import { NSwitch } from 'naive-ui';

const props = defineProps<{ value?: boolean | undefined; loading?: boolean; disabled?: boolean }>();
const emits = defineEmits<{ (e: 'update:value', value: boolean): void }>();

const checked = useVModel(props, 'value', emits);
const switchRowRef = ref<HTMLElement>();

function onSwitchRowClick(event: MouseEvent): void {
  if (isClickOnSwitch(event)) {
    return;
  }
  checked.value = !checked.value;
}

function isClickOnSwitch(event: MouseEvent): boolean {
  let element = event.target as HTMLElement | null;
  while (element && element !== switchRowRef.value) {
    if (element.getAttribute('role') === 'switch') {
      return true;
    }
    element = element.parentElement;
  }
  return false;
}
</script>

<style lang="scss" scoped>
@import './SwitchRow';
@import '../../settings';
</style>
