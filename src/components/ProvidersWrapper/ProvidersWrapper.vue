<template>
  <NConfigProvider class="page-layout" :theme="darkTheme">
    <NMessageProvider placement="bottom-left">
      <slot />
    </NMessageProvider>
  </NConfigProvider>
</template>

<script lang="ts" setup>
import { darkTheme, NConfigProvider, NMessageProvider } from 'naive-ui';
</script>
