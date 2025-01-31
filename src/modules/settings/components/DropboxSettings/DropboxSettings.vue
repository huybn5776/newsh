<template>
  <div class="setting-section">
    <h3>Dropbox sync</h3>
    <SwitchRow v-model:value="autoSyncWithDropbox" :loading="autoSyncingSettings" @update:value="onToggleAutoSync">
      Auto sync setting with Dropbox.
    </SwitchRow>
    <SwitchRow v-model:value="syncUpdateNotify" :disabled="!autoSyncWithDropbox" @update:value="onToggleAutoSync">
      Notify when settings are updated during sync.
    </SwitchRow>
    <div class="setting-row setting-button-row">
      <DropboxConnectionState :dropboxToken="dropboxToken" :loading="dropboxTokenLoading" />
      <NButton v-if="!dropboxToken" @click="connectDropbox">Connect to dropbox</NButton>
      <NButton v-if="dropboxToken" @click="clearDropboxToken">Clear dropbox token</NButton>
    </div>
    <div class="setting-row">
      <NButton :disabled="!dropboxToken || dropboxLoading" :loading="uploadingSettings" @click="uploadSetting">
        Upload settings to Dropbox
      </NButton>
      <NButton :disabled="!dropboxToken || dropboxLoading" :loading="downloadingSettings" @click="loadSettings">
        Load settings from Dropbox
      </NButton>
      <NButton :disabled="!dropboxToken || dropboxLoading" :loading="syncingSettings" @click="syncSettingsWithDropbox">
        Sync settings with Dropbox
      </NButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';

import { useDebounceFn } from '@vueuse/core';
import { NButton } from 'naive-ui';
import { useRoute } from 'vue-router';

import DropboxConnectionState from '@/components/DropboxConnectionState/DropboxConnectionState.vue';
import { useCatchDropboxTokenFromUrl } from '@/compositions/use-catch-dropbox-token-from-url';
import { useMitt } from '@/compositions/use-mitt';
import { useSyncSetting, useSyncSettingMapUndefined } from '@/compositions/use-sync-setting';
import { SettingEventType } from '@/enums/setting-event-type';
import { SettingKey } from '@/enums/setting-key';
import { DropboxTokenInfo } from '@/interfaces/dropbox-token-info';
import SwitchRow from '@/modules/settings/components/SwitchRow/SwitchRow.vue';
import { createDropboxAuthUrl, refreshDropboxTokenIfNeeded } from '@/services/dropbox-service';
import { saveSeenNewsToDropbox } from '@/services/dropbox-sync-service';
import {
  getSettingValues,
  getSettingFromStorage,
  allowBackupSettingKeys,
  syncSettingValues,
  syncSeenNews,
  loadSeenNewsFromDropbox,
  loadSettingsFromDropbox,
  uploadSettingsToDropbox,
} from '@/services/setting-service';

const dropboxToken = useSyncSetting(SettingKey.DropboxToken);

const route = useRoute();
const { onEvent, unsubscribeAllEvents } = useMitt();
const { loading: loadingDropboxToken } = useCatchDropboxTokenFromUrl(onGotDropboxToken);

const autoSyncWithDropbox = useSyncSettingMapUndefined(SettingKey.AutoSyncWithDropbox);
const syncUpdateNotify = useSyncSettingMapUndefined(SettingKey.SyncUpdateNotify);
const refreshingDropboxToken = ref(false);
const autoSyncingSettings = ref(false);
const uploadingSettings = ref(false);
const downloadingSettings = ref(false);
const syncingSettings = ref(false);

const dropboxTokenLoading = computed(() => loadingDropboxToken.value || refreshingDropboxToken.value);
const dropboxLoading = computed(
  () => dropboxTokenLoading.value || uploadingSettings.value || downloadingSettings.value || syncingSettings.value,
);

onMounted(() => {
  if (dropboxToken.value) {
    refreshingDropboxToken.value = true;
    const newTokenInfo = refreshDropboxTokenIfNeeded();
    refreshingDropboxToken.value = false;
    if (newTokenInfo) {
      dropboxToken.value = newTokenInfo;
    }
  }
  if (dropboxToken.value && autoSyncWithDropbox.value) {
    subscribeOnChangeToSync();
  }
});

function subscribeOnChangeToSync(): void {
  const syncSettings = useDebounceFn(async () => {
    await syncSettingValues();
    autoSyncingSettings.value = false;
  }, 1500);
  allowBackupSettingKeys.forEach((key) =>
    onEvent(key, (event) => (event.type === SettingEventType.User ? syncSettings() : null)),
  );
}

async function onToggleAutoSync(): Promise<void> {
  if (!autoSyncWithDropbox.value) {
    unsubscribeAllEvents();
    return;
  }
  if (dropboxToken.value) {
    refreshingDropboxToken.value = true;
    refreshDropboxTokenIfNeeded();
    refreshingDropboxToken.value = false;
    subscribeOnChangeToSync();
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
  if (autoSyncWithDropbox.value) {
    subscribeOnChangeToSync();
  }
}

function clearDropboxToken(): void {
  unsubscribeAllEvents();
  dropboxToken.value = null;
  autoSyncWithDropbox.value = false;
}

async function uploadSetting(): Promise<void> {
  if (!dropboxToken.value) {
    return;
  }
  uploadingSettings.value = true;
  const settings = getSettingValues();
  const seenNews = getSettingFromStorage(SettingKey.SeenNewsItems);
  await Promise.all([
    uploadSettingsToDropbox(settings),
    seenNews ? saveSeenNewsToDropbox(seenNews) : Promise.resolve(),
  ]);
  uploadingSettings.value = false;
}

async function loadSettings(): Promise<void> {
  downloadingSettings.value = true;
  await Promise.all([loadSettingsFromDropbox(), loadSeenNewsFromDropbox()]);
  downloadingSettings.value = false;
}

async function syncSettingsWithDropbox(): Promise<void> {
  syncingSettings.value = true;
  await Promise.all([syncSettingValues(), syncSeenNews()]);
  syncingSettings.value = false;
}
</script>

<style lang="scss" scoped>
@forward '../../settings';
</style>
