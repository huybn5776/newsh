<template>
  <button ref="switchRowRef" class="setting-row switch-row" @click="onSwitchRowClick">
    <NSwitch ref="switchRef" v-model:value="checked" :disabled="disabled" :loading="loading" />
    <span><slot /></span>
  </button>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { useVModel } from '@vueuse/core';
import { NSwitch } from 'naive-ui';

const props = defineProps<{ value?: boolean | undefined; loading?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'update:value', value: boolean): void }>();

const checked = useVModel(props, 'value', emit);
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
@forward './SwitchRow';
@forward '../../settings';
</style>
