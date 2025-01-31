<template>
  <header class="site-header">
    <div class="site-header-content-container">
      <router-link :to="{ name: 'home' }" class="site-logo-link">
        <h1 class="site-logo">Newsh</h1>
      </router-link>
      <NavBar />
    </div>
  </header>
</template>

<script lang="ts" setup>
import NavBar from '@/layouts/NavBar/NavBar.vue';
</script>

<style lang="scss" scoped>
@forward './SiteHeader';
</style>
