<template>
  <NConfigProvider id="page-layout" class="page-layout" :theme="darkTheme">
    <NMessageProvider
      placement="top-right"
      to=".page-content-container"
      keepAliveOnHover
      :containerStyle="{ position: 'sticky', order: -1, width: '100%', transform: 'translate(-12px, 12px)' }"
    >
      <NDialogProvider>
        <NLoadingBarProvider>
          <NNotificationProvider>
            <slot />
          </NNotificationProvider>
        </NLoadingBarProvider>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script lang="ts" setup>
import {
  darkTheme,
  NConfigProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
} from 'naive-ui';
</script>
