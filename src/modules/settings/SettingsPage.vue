<template>
  <div class="page-content settings-page">
    <h1 class="setting-page-title">Settings</h1>
    <div class="setting-section">
      <h3>General settings</h3>

      <SwitchRow v-model:value="filterOutYoutube">Filter out youtube news.</SwitchRow>
      <SwitchRow v-model:value="hideSeenNews">
        Gray out the news that seen within days:
        <SettingDaysInput v-model="hideSeenNewsInDays" placeholder="2" :disabled="!hideSeenNews" />
      </SwitchRow>
      <SwitchRow v-model:value="spaceKeyToExpandRelated">
        Use space key to expand currently hovered related news.
      </SwitchRow>

      <div class="setting-row">
        <span>News topics after top stories:</span>
        <NSelect
          v-model:value="newsTopicsAfterTopStories"
          class="setting-select"
          multiple
          placeholder="Topics"
          :options="allTopicsSelection"
        />
        <div class="setting-select-actions">
          <NButton @click="openAddTopicDialog">Add</NButton>
          <NButton @click="openManagementDialog">Management</NButton>
        </div>
      </div>

      <div class="setting-row">
        <span>Language & region: {{ languageAndRegionLabel }}</span>
        <router-link class="setting-link" :to="{ name: 'setup', query: { from: 'settings' } }">Update</router-link>
      </div>
    </div>

    <div class="setting-section">
      <h3>Hide news rules</h3>
      <SwitchRow v-model:value="hideShortTitleNews">
        Title shorter than
        <SettingDaysInput v-model="hideShortTitleNewsInChars" placeholder="10" :disabled="!hideShortTitleNews" /> chars
      </SwitchRow>
      <TagsRow v-model:value="hiddenSources" title="Sources" />
      <TagsRow v-model:value="hiddenUrlMatches" title="Url matches" />
      <TagsRow v-model:value="excludeTerms" title="Terms" />
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
import { watch, ref, computed } from 'vue';

import { NButton, NSelect } from 'naive-ui';

import { useBackupSettings } from '@/compositions/use-backup-settings';
import { useSyncSettingMapUndefined, useSyncSettingMapNullArray } from '@/compositions/use-sync-setting';
import { SettingEventType } from '@/enums/setting-event-type';
import { SettingKey } from '@/enums/setting-key';
import DropboxSettings from '@/modules/settings/components/DropboxSettings/DropboxSettings.vue';
import SettingDaysInput from '@/modules/settings/components/SettingDaysInput/SettingDaysInput.vue';
import SwitchRow from '@/modules/settings/components/SwitchRow/SwitchRow.vue';
import TagsRow from '@/modules/settings/components/TagsRow/TagsRow.vue';
import { useNewsTopicManagement } from '@/modules/settings/compositions/use-news-topic-management';
import { deleteSettingFromStorage, getSettingFromStorage } from '@/services/setting-service';
import { distinctArray } from '@/utils/array-utils';

const allTopicInfo = useSyncSettingMapUndefined(SettingKey.AllTopicsInfo);
const allTopicsSelection = computed(() => allTopicInfo.value?.map((topic) => ({ label: topic.name, value: topic.id })));
const { openAddTopicDialog, openManagementDialog } = useNewsTopicManagement();

const filterOutYoutube = useSyncSettingMapUndefined(SettingKey.FilterOutYoutube);
const newsTopicsAfterTopStories = useSyncSettingMapNullArray(SettingKey.NewsTopicsAfterTopStories);
const languageAndRegionLabel = ref(getSettingFromStorage(SettingKey.LanguageAndRegionLabel));
const hideSeenNews = useSyncSettingMapUndefined(SettingKey.HideSeenNews);
const hideSeenNewsInDays = useSyncSettingMapUndefined(SettingKey.HideSeenNewsInDays);
const spaceKeyToExpandRelated = useSyncSettingMapUndefined(SettingKey.SpaceKeyToExpandRelated);
const hideShortTitleNews = useSyncSettingMapUndefined(SettingKey.HideShortTitleNews);
const hideShortTitleNewsInChars = useSyncSettingMapUndefined(SettingKey.HideShortTitleNewsInChars);
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
@forward './SettingsPage';
@forward './settings';
</style>
