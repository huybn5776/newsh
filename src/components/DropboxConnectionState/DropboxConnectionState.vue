<template>
  <p>
    State:
    <span>{{ loading ? 'loading...' : dropboxState }}</span>
  </p>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { DropboxTokenInfo } from '@/interfaces/dropbox-token-info';

const props = defineProps<{ dropboxToken: DropboxTokenInfo | null; loading?: boolean }>();

const dropboxState = computed(() => {
  if (props.dropboxToken) {
    if (props.dropboxToken.expiresAt > Date.now()) {
      return 'connected';
    }
    return 'expired';
  }
  return 'not connected';
});
</script>
