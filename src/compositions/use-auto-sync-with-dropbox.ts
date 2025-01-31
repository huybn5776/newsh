import { onMounted } from 'vue';

import { useDebounceFn } from '@vueuse/core';
import { useNotification, useMessage } from 'naive-ui';

import { useMitt } from '@/compositions/use-mitt';
import { SettingKey } from '@/enums/setting-key';
import { refreshDropboxTokenIfNeeded } from '@/services/dropbox-service';
import { saveSeenNewsToDropbox } from '@/services/dropbox-sync-service';
import {
  getSettingFromStorage,
  syncSettingValues,
  syncSeenNews,
  getSettingValues,
  uploadSettingsToDropbox,
  calcChangedSettings,
  calcAddedSeenNews,
} from '@/services/setting-service';
import { isNotNilOrEmpty } from '@/utils/object-utils';

const settingKeysToUpdateSettings: SettingKey[] = [
  SettingKey.HiddenSources,
  SettingKey.HiddenUrlMatches,
  SettingKey.ExcludeTerms,
];

export function useAutoSyncWithDropbox(): void {
  const message = useMessage();
  const notification = useNotification();
  const syncUpdateNotify = getSettingFromStorage(SettingKey.SyncUpdateNotify);

  if (!getSettingFromStorage(SettingKey.AutoSyncWithDropbox)) {
    return;
  }
  if (!getSettingFromStorage(SettingKey.DropboxToken)) {
    message.warning('Missing Dropbox token, please re-connect to Dropbox in settings page to perform auto sync.', {
      duration: 10000,
      closable: true,
    });
    return;
  }
  const { onEvent } = useMitt();

  onMounted(async () => {
    refreshDropboxTokenIfNeeded();
    const [syncSettingsResult, syncSeenNewsResult] = await Promise.all([syncSettingValues(), syncSeenNews()]);
    if (syncUpdateNotify && (syncSettingsResult || syncSeenNewsResult)) {
      const updatedSettingsCount = syncSettingsResult
        ? calcChangedSettings(syncSettingsResult.localSettings, syncSettingsResult.mergedSettings)
        : 0;
      const newSeenNewsCount = syncSeenNewsResult
        ? calcAddedSeenNews(syncSeenNewsResult.localSeenNews, syncSeenNewsResult.mergedSeenNews)
        : 0;
      showUpdatedMessage(updatedSettingsCount, newSeenNewsCount);
    }
    syncSettingsOnChange();
    syncSeenNewsOnChange();
  });

  function showUpdatedMessage(updatedSettingsCount: number, newSeenNewsCount: number): void {
    const updatedMessage = [
      updatedSettingsCount ? `${updatedSettingsCount} settings` : '',
      newSeenNewsCount ? `${newSeenNewsCount} seen news` : '',
    ]
      .filter(isNotNilOrEmpty)
      .join(' and ');
    if (updatedMessage) {
      notification.success({
        title: 'Auto sync completed.',
        content: `${updatedMessage} updated.`,
        duration: 5000,
      });
    }
  }

  function syncSettingsOnChange(): void {
    settingKeysToUpdateSettings.forEach((key) => onEvent(key, () => uploadSettingsToDropbox(getSettingValues())));
  }

  function syncSeenNewsOnChange(): void {
    const debouncedSyncSeenNewsOnChange = useDebounceFn(() => {
      saveSeenNewsToDropbox(getSettingFromStorage(SettingKey.SeenNewsItems) ?? []);
    }, 10000);
    onEvent(SettingKey.SeenNewsItems, () => {
      debouncedSyncSeenNewsOnChange();
    });
  }
}
