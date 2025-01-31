import { useMessage } from 'naive-ui';

import { useInputDialog } from '@/compositions/use-input-dialog';
import { SettingEventType } from '@/enums/setting-event-type';
import { SettingValueType } from '@/enums/setting-key';
import { getSettingValues, validateSettings, saveSettingValues } from '@/services/setting-service';
import { saveDataToJsonFile, selectFile } from '@/utils/browser-utils';

export function useBackupSettings(): {
  downloadSettings: () => void;
  editSettingsInJson: () => void;
  importSettings: () => Promise<void>;
} {
  const message = useMessage();
  const settingJsonDialog = useInputDialog();

  async function importSettings(): Promise<void> {
    message.destroyAll();

    const jsonContent = await selectFile('json');
    if (!jsonContent) {
      return;
    }

    let settingsValue: Partial<SettingValueType>;
    try {
      settingsValue = JSON.parse(jsonContent);
    } catch (e) {
      showJsonParseError(e);
      return;
    }

    const errorSettings = validateSettings(settingsValue);
    if (errorSettings.length) {
      showValidationError(errorSettings);
      return;
    }
    saveSettingValues(settingsValue, SettingEventType.Backup);
  }

  function editSettingsInJson(): void {
    const settingValues = getSettingValues();
    settingJsonDialog.open({
      title: 'Edit settings in json',
      placeholder: 'json',
      value: JSON.stringify(settingValues, null, 2),
      inputType: 'textarea',
      positiveText: 'Save',
      beforeClose: (json) => {
        message.destroyAll();

        let newSettings: Partial<SettingValueType>;
        try {
          newSettings = JSON.parse(json);
        } catch (error) {
          showJsonParseError(error);
          return false;
        }
        const errorProps = validateSettings(newSettings);
        if (errorProps.length) {
          showValidationError(errorProps);
          return false;
        }
        saveSettingValues(newSettings, SettingEventType.Backup);
        return true;
      },
    });
  }

  function showJsonParseError(error: unknown): void {
    let content = 'Invalid settings';
    if (error instanceof Error) {
      content = `${content}: ${error.message}`;
    }
    message.error(content, { duration: 0, closable: true });
  }

  function showValidationError(errorSettings: string[]): void {
    const errorMessage = errorSettings.map((key) => `'${key}' is invalid`).join('\n');
    message.error(errorMessage, { duration: 0, closable: true });
  }

  return { importSettings, downloadSettings, editSettingsInJson };
}

function downloadSettings(): void {
  const settings = getSettingValues();
  saveDataToJsonFile(settings, 'newsh-settings');
}
