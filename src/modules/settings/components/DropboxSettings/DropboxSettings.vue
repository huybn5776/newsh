<template>
  <div class="setting-section">
    <h3>Dropbox sync</h3>
    <div class="setting-row">
      <NSwitch v-model:value="autoSyncWithDropbox" @update-value="onToggleAutoSync" />
      <span class="setting-title">Auto sync setting with Dropbox.</span>
    </div>
    <div class="setting-row setting-button-row">
      <DropboxConnectionState :dropboxToken="dropboxToken" :loading="dropboxTokenLoading" />
      <NButton v-if="!dropboxToken" @click="connectDropbox">Connect to dropbox</NButton>
      <NButton v-if="dropboxToken" @click="clearDropboxToken">Clear dropbox token</NButton>
    </div>
    <div class="setting-row">
      <NButton :disabled="!dropboxToken || dropboxLoading" :loading="uploadingSettings" @click="uploadSettingToDropbox">
        Upload settings to Dropbox
      </NButton>
      <NButton
        :disabled="!dropboxToken || dropboxLoading"
        :loading="downloadingSettings"
        @click="loadSettingsFromDropbox"
      >
        Load settings from Dropbox
      </NButton>
      <NButton :disabled="!dropboxToken || dropboxLoading" :loading="mergingSettings" @click="mergeSettingsFromDropbox">
        Merge settings with Dropbox
      </NButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';

import { useMessage, NButton, NSwitch } from 'naive-ui';
import { useRoute } from 'vue-router';

import DropboxConnectionState from '@components/DropboxConnectionState/DropboxConnectionState.vue';
import { useCatchDropboxTokenFromUrl } from '@compositions/use-catch-dropbox-token-from-url';
import { useSyncSetting, useSyncSettingMapUndefined } from '@compositions/use-sync-setting';
import { SettingKey, SettingValueType } from '@enums/setting-key';
import { DropboxApiError } from '@interfaces/dropbox-api-error';
import { DropboxTokenInfo } from '@interfaces/dropbox-token-info';
import { SeenNewsItem } from '@interfaces/seen-news-item';
import { createDropboxAuthUrl, refreshDropboxTokenIfNeeded } from '@services/dropbox-service';
import {
  getSeenNewsFromDropbox,
  getSettingValuesFromDropbox,
  saveSeenNewsToDropbox,
  saveSettingsToDropbox,
} from '@services/dropbox-sync-service';
import {
  getSettingValues,
  mergeSeenNews,
  mergeSettings,
  validateSettings,
  updateSettingFromStorage,
  saveSettingToStorage,
  getSettingFromStorage,
  saveSettingValues,
} from '@services/setting-service';

const dropboxToken = useSyncSetting(SettingKey.DropboxToken);

const route = useRoute();
const message = useMessage();
const { onEvent } = useMitt();
const { loading: loadingDropboxToken } = useCatchDropboxTokenFromUrl(onGotDropboxToken);

const autoSyncWithDropbox = useSyncSettingMapUndefined(SettingKey.AutoSyncWithDropbox);
const refreshingDropboxToken = ref(false);
const uploadingSettings = ref(false);
const downloadingSettings = ref(false);
const mergingSettings = ref(false);

const dropboxTokenLoading = computed(() => loadingDropboxToken.value || refreshingDropboxToken.value);
const dropboxLoading = computed(
  () => dropboxTokenLoading.value || uploadingSettings.value || downloadingSettings.value || mergingSettings.value,
);

onMounted(async () => {
  if (dropboxToken.value) {
    refreshingDropboxToken.value = true;
    const newTokenInfo = await refreshDropboxTokenIfNeeded();
    refreshingDropboxToken.value = false;
    if (newTokenInfo) {
      dropboxToken.value = newTokenInfo;
    }
  }
});

async function onToggleAutoSync(): Promise<void> {
  if (!autoSyncWithDropbox.value) {
    return;
  }
  if (dropboxToken.value) {
    refreshingDropboxToken.value = true;
    await refreshDropboxTokenIfNeeded();
    refreshingDropboxToken.value = false;
  } else {
    await connectDropbox();
  }
}

async function connectDropbox(): Promise<void> {
  const redirectUri = `${window.location.origin}${route.path}`;
  window.location.href = await createDropboxAuthUrl(redirectUri);
}

function onGotDropboxToken(token: DropboxTokenInfo): void {
  dropboxToken.value = token;
}

function clearDropboxToken(): void {
  dropboxToken.value = null;
  autoSyncWithDropbox.value = false;
}

async function uploadSettingToDropbox(): Promise<void> {
  if (!dropboxToken.value) {
    return;
  }
  uploadingSettings.value = true;
  const settings = getSettingValues();
  const seenNews = getSettingFromStorage(SettingKey.SeenNewsItems);
  await Promise.all([saveSettingsToDropbox(settings), seenNews ? saveSeenNewsToDropbox(seenNews) : Promise.resolve()]);
  uploadingSettings.value = false;
}

async function loadSettingsFromDropbox(): Promise<void> {
  downloadingSettings.value = true;
  await getSettingsFromDropbox(
    (settings) => saveSettingValues(settings),
    (seenNews) => {
      saveSettingToStorage(SettingKey.SeenNewsItems, seenNews);
    },
  );
  downloadingSettings.value = false;
}

async function mergeSettingsFromDropbox(): Promise<void> {
  mergingSettings.value = true;
  await getSettingsFromDropbox(
    (settings) => {
      const originalSettings = getSettingValues();
      const updatedSettings = mergeSettings(originalSettings, settings);
      saveSettingValues(updatedSettings);
    },
    (seenNews) => {
      updateSettingFromStorage(SettingKey.SeenNewsItems, (s) => mergeSeenNews(s || [], seenNews));
    },
  );
  mergingSettings.value = false;
}

async function getSettingsFromDropbox(
  settingsCallback: (settings: Partial<SettingValueType>) => void,
  seenNewsCallback: (seenNews: SeenNewsItem[]) => void,
): Promise<void> {
  if (!dropboxToken.value) {
    return;
  }
  await Promise.all([
    getSettingValuesFromDropbox()
      .catch(showDropboxError)
      .then((settings) => {
        if (!settings) {
          return;
        }
        const errorProps = validateSettings(settings);
        if (errorProps.length) {
          const errorMessage = errorProps.map((key) => `Setting key: '${key}' is invalid`).join('\n');
          message.error(errorMessage, { duration: 0, closable: true });
        } else {
          settingsCallback(settings);
        }
      }),
    getSeenNewsFromDropbox()
      .catch(showDropboxError)
      .then((seenNews) => {
        if (!seenNews) {
          return;
        }
        seenNewsCallback(seenNews);
      }),
  ]);
}

function showDropboxError(e: DropboxApiError): void {
  message.error(`Error when download file from dropbox: ${e.error.error_summary}`);
}
</script>

<style lang="scss" scoped>
@import '../../settings';
</style>
