<template>
  <div class="app">
    <NConfigProvider class="page-layout" :theme="darkTheme">
      <NMessageProvider placement="bottom-left">
        <SiteHeader />
        <div class="page-content-container">
          <router-view />
        </div>
      </NMessageProvider>
    </NConfigProvider>
  </div>
</template>

<script lang="ts" setup>
import { darkTheme, NConfigProvider, NMessageProvider } from 'naive-ui';

import SiteHeader from '@components/SiteHeader/SiteHeader.vue';
</script>

<style lang="scss">
@import 'App.scss';
</style>
