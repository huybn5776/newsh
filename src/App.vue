<template>
  <div class="app">
    <NConfigProvider class="page-layout" :theme="darkTheme">
      <NavBar />
      <router-view />
    </NConfigProvider>
  </div>
</template>

<script lang="ts" setup>
import { darkTheme, NConfigProvider } from 'naive-ui';

import NavBar from '@components/NavBar/NavBar.vue';
</script>

<style lang="scss">
@import 'App.scss';
</style>
