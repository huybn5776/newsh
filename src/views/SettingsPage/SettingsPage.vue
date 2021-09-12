<template>
  <div class="page-content settings-page">
    <h1 class="setting-page-title">Settings</h1>
    <div class="setting-section">
      <h3>General settings</h3>

      <div class="setting-row">
        <NSwitch v-model:value="filterOutYoutube" />
        <span class="setting-title">Filter out youtube news.</span>
      </div>

      <div class="setting-row">
        <NSwitch v-model:value="hideSeenNews" />
        <span class="setting-title">Gray out the news that seen within one day.</span>
      </div>

      <div class="setting-row">
        <p>Language & region: {{ languageAndRegionLabel }}</p>
        <router-link class="setting-link" :to="{ name: 'setup', query: { from: 'settings' } }">Update</router-link>
      </div>
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
import { watch, ref } from 'vue';

import { NSwitch, NDynamicTags } from 'naive-ui';

import { useSyncSettingMapUndefined, useSyncSettingMapNullArray } from '@compositions/use-sync-setting';
import { SettingKey } from '@enums/setting-key';
import { deleteSettingFromStorage, getSettingFromStorage } from '@utils/storage-utils';

const filterOutYoutube = useSyncSettingMapUndefined<boolean>(SettingKey.FilterOutYoutube);
const languageAndRegionLabel = ref(getSettingFromStorage<string>(SettingKey.LanguageAndRegionLabel));
const hideSeenNews = useSyncSettingMapUndefined<boolean>(SettingKey.HideSeenNews);
const hiddenSources = useSyncSettingMapNullArray<string[]>(SettingKey.HiddenSources);
const excludeTerms = useSyncSettingMapNullArray<string[]>(SettingKey.ExcludeTerms);

watch(
  () => hideSeenNews.value,
  () => {
    if (hideSeenNews.value === false) {
      deleteSettingFromStorage(SettingKey.SeenNewsItems);
    }
  },
);
</script>

<style lang="scss" scoped>
@import './SettingsPage.scss';
</style>
