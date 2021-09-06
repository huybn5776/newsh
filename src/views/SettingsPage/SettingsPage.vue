<template>
  <div class="page-content">
    <h1 class="setting-page-title">Settings</h1>
    <div class="setting-section">
      <h3>General settings</h3>

      <p class="setting-row">
        <NSwitch v-model:value="filterOutYoutube" />
        <span class="setting-title">Filter out youtube news.</span>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NSwitch } from 'naive-ui';

import { useSyncSettingMapUndefined } from '@compositions/use-sync-setting';
import { SettingKey } from '@enums/setting-key';

const filterOutYoutube = useSyncSettingMapUndefined<boolean>(SettingKey.FilterOutYoutube);
</script>

<style lang="scss" scoped>
@import './SettingsPage.scss';
</style>
