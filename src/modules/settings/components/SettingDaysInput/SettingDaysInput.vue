<template>
  <input
    v-model="days"
    class="setting-row-input"
    type="number"
    placeholder="2"
    maxlength="2"
    min="1"
    max="99"
    :disabled="disabled"
    @click.stop
    @focus="selectAll"
    @change="onHiddenDaysChange"
  />
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';

const props = defineProps<{ modelValue?: number | string | undefined; disabled: boolean | undefined }>();
const emits = defineEmits<{ (e: 'update:modelValue', value: number | undefined): void }>();

const days = useVModel(props, 'modelValue', emits);

function selectAll(event: Event): void {
  (event.target as HTMLInputElement).select();
}

function onHiddenDaysChange(): void {
  if (!days.value || (typeof days.value === 'number' && days.value <= 0)) {
    days.value = undefined;
  }
}
</script>

<style lang="scss" scoped>
@import './SettingDaysInput';
</style>
