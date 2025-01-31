import { files as DropboxFiles } from 'dropbox/types/dropbox_types';
import { omit } from 'ramda';

import { SettingValueType, SettingKey } from '@/enums/setting-key';
import { SeenNewsItem } from '@/interfaces/seen-news-item';
import { getJsonFromDropbox, saveJsonToDropbox } from '@/services/dropbox-service';

const settingValuesFilename = 'settings.json';
const seenNewsFilename = 'seenNews.json';

export function getSettingValuesFromDropbox(): Promise<Partial<SettingValueType> | null> {
  return getJsonFromDropbox<Partial<SettingValueType>>(settingValuesFilename);
}

export function getSeenNewsFromDropbox(): Promise<SeenNewsItem[] | null> {
  return getJsonFromDropbox<SeenNewsItem[]>(seenNewsFilename);
}

export function saveSettingsToDropbox(settings: Partial<SettingValueType>): Promise<DropboxFiles.FileMetadata> {
  const settingsWithoutToken = omit([SettingKey.DropboxToken], settings);
  return saveJsonToDropbox(settingValuesFilename, settingsWithoutToken);
}

export function saveSeenNewsToDropbox(seenNews: SeenNewsItem[]): Promise<DropboxFiles.FileMetadata> {
  return saveJsonToDropbox(seenNewsFilename, seenNews);
}
