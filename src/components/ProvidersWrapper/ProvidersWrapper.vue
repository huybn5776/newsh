<template>
  <NConfigProvider class="page-layout" :theme="darkTheme">
    <NMessageProvider placement="bottom-left">
      <NDialogProvider>
        <slot />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script lang="ts" setup>
import { darkTheme, NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui';
</script>
