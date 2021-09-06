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

    <div class="setting-section">
      <h3>Hidden news sources</h3>
      <div class="setting-hidden-site-list">
        <NTag
          v-for="source of hiddenSources"
          :key="source"
          closable
          class="hidden-source-tag"
          @close="deleteHiddenSite(source)"
        >
          {{ source }}
        </NTag>
        <p v-if="!hiddenSources?.length">(Empty)</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NSwitch, NTag } from 'naive-ui';

import { useSyncSetting, useSyncSettingMapUndefined } from '@compositions/use-sync-setting';
import { SettingKey } from '@enums/setting-key';

const filterOutYoutube = useSyncSettingMapUndefined<boolean>(SettingKey.FilterOutYoutube);
const hiddenSources = useSyncSetting<string[]>(SettingKey.HiddenSources);

function deleteHiddenSite(source: string): void {
  hiddenSources.value = hiddenSources.value?.filter((s) => s !== source) || [];
}
</script>

<style lang="scss" scoped>
@import './SettingsPage.scss';
</style>
