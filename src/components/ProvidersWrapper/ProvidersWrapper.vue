<template>
  <NConfigProvider class="page-layout" :theme="darkTheme">
    <NMessageProvider placement="bottom-left">
      <NDialogProvider>
        <NLoadingBarProvider>
          <slot />
        </NLoadingBarProvider>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script lang="ts" setup>
import { darkTheme, NConfigProvider, NMessageProvider, NDialogProvider, NLoadingBarProvider } from 'naive-ui';
</script>
