<template>
  <div class="page-content settings-page">
    <h1 class="setting-page-title">Settings</h1>
    <div class="setting-section">
      <h3>General settings</h3>

      <p class="setting-row">
        <NSwitch v-model:value="filterOutYoutube" />
        <span class="setting-title">Filter out youtube news.</span>
      </p>
    </div>

    <div class="setting-section">
      <h3>Hidden news</h3>
      <div class="setting-row">
        <span>Sources: </span>
        <NDynamicTags v-model:value="hiddenSources" />
      </div>

      <div class="setting-row">
        <span>Terms: </span>
        <div class="setting-hidden-site-list">
          <NDynamicTags v-model:value="excludeTerms" />
        </div>
      </div>
    </div>

    <a class="github-logo" href="https://github.com/huybn5776/newsh" target="_blank">GitHub</a>
  </div>
</template>

<script lang="ts" setup>
import { NSwitch, NDynamicTags } from 'naive-ui';

import { useSyncSettingMapUndefined, useSyncSettingMapNullArray } from '@compositions/use-sync-setting';
import { SettingKey } from '@enums/setting-key';

const filterOutYoutube = useSyncSettingMapUndefined<boolean>(SettingKey.FilterOutYoutube);
const hiddenSources = useSyncSettingMapNullArray<string[]>(SettingKey.HiddenSources);
const excludeTerms = useSyncSettingMapNullArray<string[]>(SettingKey.ExcludeTerms);
</script>

<style lang="scss" scoped>
@import './SettingsPage.scss';
</style>
