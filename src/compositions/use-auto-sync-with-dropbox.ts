import { onMounted } from 'vue';

import { useDebounceFn } from '@vueuse/core';
import { useMessage } from 'naive-ui';

import { useMitt } from '@compositions/use-mitt';
import { SettingKey } from '@enums/setting-key';
import { refreshDropboxTokenIfNeeded } from '@services/dropbox-service';
import { saveSettingsToDropbox, saveSeenNewsToDropbox } from '@services/dropbox-sync-service';
import { getSettingFromStorage, syncSettingValues, syncSeenNews, getSettingValues } from '@services/setting-service';

const settingKeysToUpdateSettings: SettingKey[] = [
  SettingKey.HiddenSources,
  SettingKey.HiddenUrlMatches,
  SettingKey.ExcludeTerms,
];

export function useAutoSyncWithDropbox(): void {
  const message = useMessage();
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
    await refreshDropboxTokenIfNeeded();
    await Promise.all([syncSettingValues(), syncSeenNews()]);
    syncSettingsOnChange();
    syncSeenNewsOnChange();
  });

  function syncSettingsOnChange(): void {
    settingKeysToUpdateSettings.forEach((key) => onEvent(key, () => saveSettingsToDropbox(getSettingValues())));
  }

  function syncSeenNewsOnChange(): void {
    const debouncedSyncSeenNewsOnChange = useDebounceFn(() => {
      saveSeenNewsToDropbox(getSettingFromStorage(SettingKey.SeenNewsItems) || []);
    }, 10000);
    onEvent(SettingKey.SeenNewsItems, () => {
      debouncedSyncSeenNewsOnChange();
    });
  }
}
