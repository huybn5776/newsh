<template>
  <div class="page-content settings-page">
    <h1 class="setting-page-title">Settings</h1>
    <div class="setting-section">
      <h3>General settings</h3>

      <SwitchRow v-model:value="filterOutYoutube">Filter out youtube news.</SwitchRow>
      <SwitchRow v-model:value="hideSeenNews">Gray out the news that seen within two days.</SwitchRow>
      <SwitchRow v-model:value="spaceKeyToExpandRelated">
        Use space key to expand currently hovered related news.
      </SwitchRow>

      <div class="setting-row setting-select-row">
        <span>News topics after top stories:</span>
        <NSelect
          class="setting-select"
          multiple
          placeholder="Topics"
          :options="allTopicsSelection"
          v-model:value="newsTopicsAfterTopStories"
        />
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
        <span>Url matches: </span>
        <NDynamicTags v-model:value="hiddenUrlMatches" />
      </div>

      <div class="setting-row">
        <span>Terms: </span>
        <div class="setting-hidden-site-list">
          <NDynamicTags v-model:value="excludeTerms" />
        </div>
      </div>
    </div>

    <div class="setting-section">
      <h3>Backup</h3>
      <div class="setting-row">
        <NButton @click="downloadSettings">Download settings</NButton>
        <NButton @click="importSettings">Import settings</NButton>
        <NButton @click="editSettingsInJson">Edit settings in JSON</NButton>
      </div>
    </div>

    <DropboxSettings />

    <a class="github-logo" href="https://github.com/huybn5776/newsh" target="_blank">GitHub</a>
  </div>
</template>

<script lang="ts" setup>
import { watch, ref } from 'vue';

import { NButton, NDynamicTags, NSelect } from 'naive-ui';

import { useBackupSettings } from '@compositions/use-backup-settings';
import { useSyncSettingMapUndefined, useSyncSettingMapNullArray } from '@compositions/use-sync-setting';
import { SettingEventType } from '@enums/setting-event-type';
import { SettingKey } from '@enums/setting-key';
import DropboxSettings from '@modules/settings/components/DropboxSettings/DropboxSettings.vue';
import SwitchRow from '@modules/settings/components/SwitchRow/SwitchRow.vue';
import { deleteSettingFromStorage, getSettingFromStorage } from '@services/setting-service';
import { distinctArray } from '@utils/array-utils';

const allTopicsSelection = ref(
  getSettingFromStorage(SettingKey.AllTopicsInfo)?.map((topic) => ({ label: topic.name, value: topic.id })),
);

const filterOutYoutube = useSyncSettingMapUndefined(SettingKey.FilterOutYoutube);
const newsTopicsAfterTopStories = useSyncSettingMapNullArray(SettingKey.NewsTopicsAfterTopStories);
const languageAndRegionLabel = ref(getSettingFromStorage(SettingKey.LanguageAndRegionLabel));
const hideSeenNews = useSyncSettingMapUndefined(SettingKey.HideSeenNews);
const spaceKeyToExpandRelated = useSyncSettingMapUndefined(SettingKey.SpaceKeyToExpandRelated);
const hiddenSources = useSyncSettingMapNullArray(SettingKey.HiddenSources, mapArrayValue);
const hiddenUrlMatches = useSyncSettingMapNullArray(SettingKey.HiddenUrlMatches, mapArrayValue);
const excludeTerms = useSyncSettingMapNullArray(SettingKey.ExcludeTerms, mapArrayValue);
const { downloadSettings, importSettings, editSettingsInJson } = useBackupSettings();

watch(
  () => hideSeenNews.value,
  () => {
    if (hideSeenNews.value === false) {
      deleteSettingFromStorage(SettingKey.SeenNewsItems, SettingEventType.User);
    }
  },
);

function mapArrayValue(array: string[] | undefined): string[] {
  return distinctArray(array?.map((value) => value.trim()).filter((value) => !!value));
}
</script>

<style lang="scss" scoped>
@import './SettingsPage';
@import './settings';
</style>
