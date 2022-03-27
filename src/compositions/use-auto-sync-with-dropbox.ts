import { onMounted } from 'vue';

import { useMessage } from 'naive-ui';

import { SettingKey } from '@enums/setting-key';
import { refreshDropboxTokenIfNeeded } from '@services/dropbox-service';
import { getSettingFromStorage, syncSettingValues, syncSeenNews } from '@services/setting-service';

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

  onMounted(async () => {
    await refreshDropboxTokenIfNeeded();
    await Promise.all([syncSettingValues(), syncSeenNews()]);
  });
}
