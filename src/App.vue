<template>
  <div class="app">
    <ProvidersWrapper>
      <SiteHeader />
      <div class="page-content-container">
        <router-view />
      </div>
    </ProvidersWrapper>
  </div>
</template>

<script lang="ts" setup>
import ProvidersWrapper from '@/layouts/ProvidersWrapper/ProvidersWrapper.vue';
import SiteHeader from '@/layouts/SiteHeader/SiteHeader.vue';
</script>

<style lang="scss">
@forward './App';
</style>
