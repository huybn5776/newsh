<template>
  <div class="action-message-container">
    {{ content }}
    <NButton color="#8ab4f8" quaternary @click="emit('click')">{{ action }}</NButton>
  </div>
</template>

<script lang="ts" setup>
import { NButton } from 'naive-ui';

defineProps<{ content: string; action: string }>();
const emit = defineEmits<{ (e: 'click'): void }>();
</script>

<style lang="scss" scoped>
@forward './ActionMessage';
</style>
