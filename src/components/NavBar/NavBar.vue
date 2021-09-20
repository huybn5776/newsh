<template>
  <nav class="nav-bar">
    <router-link :to="{ name: 'topStories' }" class="nav-bar-link">News</router-link>
    <router-link :to="{ name: 'settings' }" class="nav-bar-link">Settings</router-link>
  </nav>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" scoped>
@import './NavBar.scss';
</style>
