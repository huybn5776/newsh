import { useMessage } from 'naive-ui';
import { isNil, evolve } from 'ramda';

import { useInputDialog } from '@compositions/use-input-dialog';
import { SettingValueType, SettingKey } from '@enums/setting-key';
import { saveDataToJsonFile, selectFile } from '@utils/browser-utils';
import { deleteNilProperties } from '@utils/object-utils';
import { getSettingFromStorage } from '@utils/storage-utils';

export function useBackupSettings(reloadSettings: (settingsValue: Partial<SettingValueType>) => void): {
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
    reloadSettings(settingsValue);
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
        reloadSettings(newSettings);
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

  function validateSettings(settingValue: Partial<SettingValueType>): SettingKey[] {
    const invalidMark = {};
    const validate = (predicate: (v: unknown) => boolean) => {
      return (v: unknown) => (isNil(v) || predicate(v) ? undefined : invalidMark);
    };

    const errors = evolve(
      {
        filterOutYoutube: validate((v) => typeof v === 'boolean'),
        hideSeenNews: validate((v) => typeof v === 'boolean'),
        newsTopicsAfterTopStories: validate((v) => Array.isArray(v)),
        hiddenSources: validate((v) => Array.isArray(v)),
        hiddenUrlMatches: validate((v) => Array.isArray(v)),
        excludeTerms: validate((v) => Array.isArray(v)),
      },
      settingValue,
    );
    return Object.entries(errors)
      .filter(([, value]) => value === invalidMark)
      .map(([key]) => key as SettingKey);
  }

  return { importSettings, downloadSettings, editSettingsInJson };
}

function getSettingValues(): Partial<SettingValueType> {
  const settingValues: Partial<SettingValueType> = {
    filterOutYoutube: getSettingFromStorage(SettingKey.FilterOutYoutube) || undefined,
    hideSeenNews: getSettingFromStorage(SettingKey.HideSeenNews) || undefined,
    newsTopicsAfterTopStories: getSettingFromStorage(SettingKey.NewsTopicsAfterTopStories) || undefined,
    hiddenSources: getSettingFromStorage(SettingKey.HiddenSources) || undefined,
    hiddenUrlMatches: getSettingFromStorage(SettingKey.HiddenUrlMatches) || undefined,
    excludeTerms: getSettingFromStorage(SettingKey.ExcludeTerms) || undefined,
  };
  return deleteNilProperties(settingValues);
}

function downloadSettings(): void {
  const settings = getSettingValues();
  saveDataToJsonFile(settings, 'newsh-settings');
}
