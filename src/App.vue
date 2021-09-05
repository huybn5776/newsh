<template>
  <div class="app">
    <NConfigProvider :theme="darkTheme">
      <router-view />
    </NConfigProvider>
  </div>
</template>

<script lang="ts" setup>
import { darkTheme, NConfigProvider } from 'naive-ui';
</script>

<style lang="scss">
@import 'App.scss';
</style>
