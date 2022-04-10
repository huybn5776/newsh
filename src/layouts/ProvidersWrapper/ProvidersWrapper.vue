<template>
  <NConfigProvider id="page-layout" class="page-layout" :theme="darkTheme">
    <NMessageProvider
      placement="top-right"
      to=".page-content-container"
      keepAliveOnHover
      :container-style="{ position: 'sticky', order: -1, width: '100%', transform: 'translate(-12px, 12px)' }"
    >
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
