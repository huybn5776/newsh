<template>
  <div class="action-message-container">
    {{ content }}
    <NButton color="#8ab4f8" quaternary @click="emits('click')">{{ action }}</NButton>
  </div>
</template>

<script lang="ts" setup>
import { NButton } from 'naive-ui';

defineProps<{ content: string; action: string }>();
const emits = defineEmits<{ (e: 'click'): void }>();
</script>

<style lang="scss" scoped>
@import './ActionMessage';
</style>
