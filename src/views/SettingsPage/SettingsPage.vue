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
import { NSwitch, NTag, NDynamicTags } from 'naive-ui';

import { useSyncSetting, useSyncSettingMapUndefined, useSyncSettingMapNullArray } from '@compositions/use-sync-setting';
import { SettingKey } from '@enums/setting-key';

const filterOutYoutube = useSyncSettingMapUndefined<boolean>(SettingKey.FilterOutYoutube);
const hiddenSources = useSyncSetting<string[]>(SettingKey.HiddenSources);
const excludeTerms = useSyncSettingMapNullArray<string[]>(SettingKey.ExcludeTerms);

function deleteHiddenSite(source: string): void {
  hiddenSources.value = hiddenSources.value?.filter((s) => s !== source) || [];
}
</script>

<style lang="scss" scoped>
@import './SettingsPage.scss';
</style>
