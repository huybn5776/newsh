<template>
  <div class="app">
    <NConfigProvider class="page-layout" :theme="darkTheme">
      <NMessageProvider placement="bottom-left">
        <NavBar />
        <router-view />
      </NMessageProvider>
    </NConfigProvider>
  </div>
</template>

<script lang="ts" setup>
import { darkTheme, NConfigProvider, NMessageProvider } from 'naive-ui';

import NavBar from '@components/NavBar/NavBar.vue';
</script>

<style lang="scss">
@import 'App.scss';
</style>
