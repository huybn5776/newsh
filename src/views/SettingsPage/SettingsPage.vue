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

      <div class="setting-row setting-select-row">
        <span>News topics after top stories:</span>
        <NSelect class="setting-select" multiple placeholder="Topics" :options="allTopicsSelection" v-model:value="newsTopicsAfterTopStories" />
      </div>

      <div class="setting-row">
        <span>Language & region: {{ languageAndRegionLabel }}</span>
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

import { NSelect, NSwitch, NDynamicTags } from 'naive-ui';

import { useSyncSettingMapUndefined, useSyncSettingMapNullArray } from '@compositions/use-sync-setting';
import { SettingKey } from '@enums/setting-key';
import { deleteSettingFromStorage, getSettingFromStorage } from '@utils/storage-utils';

const allTopicsSelection = ref(
  getSettingFromStorage(SettingKey.AllTopicsInfo)?.map((topic) => ({ label: topic.name, value: topic.id })),
);

const filterOutYoutube = useSyncSettingMapUndefined(SettingKey.FilterOutYoutube);
const newsTopicsAfterTopStories = useSyncSettingMapNullArray(SettingKey.NewsTopicsAfterTopStories);
const languageAndRegionLabel = ref(getSettingFromStorage(SettingKey.LanguageAndRegionLabel));
const hideSeenNews = useSyncSettingMapUndefined(SettingKey.HideSeenNews);
const hiddenSources = useSyncSettingMapNullArray(SettingKey.HiddenSources);
const excludeTerms = useSyncSettingMapNullArray(SettingKey.ExcludeTerms);

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
