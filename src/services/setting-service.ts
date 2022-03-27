import { isNil, evolve, groupBy, sortBy, omit } from 'ramda';

import { EventKey } from '@enums/event-key';
import { SettingValueType, SettingKey } from '@enums/setting-key';
import { DropboxTokenInfo } from '@interfaces/dropbox-token-info';
import { SeenNewsItem } from '@interfaces/seen-news-item';
import {
  getSettingValuesFromDropbox,
  saveSettingsToDropbox,
  getSeenNewsFromDropbox,
  saveSeenNewsToDropbox,
} from '@services/dropbox-sync-service';
import { emitter, EventTypes } from '@services/emitter-service';
import { distinctArray } from '@utils/array-utils';
import { deleteNilProperties, isNilOrEmpty } from '@utils/object-utils';
import { saveToStorage, getFromStorage, updateFromStorage, deleteFromStorage } from '@utils/storage-utils';
import { NullableProps } from '@utils/type-utils';

type AllowBackupSettings = Omit<
  SettingValueType,
  | SettingKey.SeenNewsItems
  | SettingKey.LanguageAndRegion
  | SettingKey.LanguageAndRegionLabel
  | SettingKey.AllTopicsInfo
  | SettingKey.HeadlineTopicId
>;

export function getSettingFromStorage<K extends SettingKey, T extends SettingValueType[K]>(key: K): T | null {
  return getFromStorage<T>(key);
}

export function saveSettingToStorage<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
  value: T | null | undefined,
): void {
  saveToStorage(key, value);
  updateLastModify();
  emitter.emit(key, value as EventTypes[K]);
}

export function updateSettingFromStorage<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
  updater: (value: T | null) => T | null,
): void {
  const { updated, value } = updateFromStorage<T>(key, updater);
  if (updated) {
    updateLastModify();
    emitter.emit(key, value as EventTypes[K]);
  }
}

export function deleteSettingFromStorage(key: SettingKey): void {
  deleteFromStorage(key);
  updateLastModify();
  emitter.emit(key, null);
}

export function saveOrDelete<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
  value: T | null | undefined,
): void {
  if (isNilOrEmpty(value)) {
    deleteSettingFromStorage(key);
    return;
  }
  saveSettingToStorage(key, value);
}

function updateLastModify(): void {
  saveToStorage(SettingKey.LastModify, Date.now());
}

export function getSettingValues(): Partial<AllowBackupSettings> {
  const settingValues: NullableProps<AllowBackupSettings> = {
    collapsedTopics: getSettingFromStorage(SettingKey.CollapsedTopics),
    filterOutYoutube: getSettingFromStorage(SettingKey.FilterOutYoutube),
    hideSeenNews: getSettingFromStorage(SettingKey.HideSeenNews),
    spaceKeyToExpandRelated: getSettingFromStorage(SettingKey.SpaceKeyToExpandRelated),
    hiddenSources: getSettingFromStorage(SettingKey.HiddenSources),
    hiddenUrlMatches: getSettingFromStorage(SettingKey.HiddenUrlMatches),
    excludeTerms: getSettingFromStorage(SettingKey.ExcludeTerms),
    newsTopicsAfterTopStories: getSettingFromStorage(SettingKey.NewsTopicsAfterTopStories),
    dropboxToken: getSettingFromStorage(SettingKey.DropboxToken),
    autoSyncWithDropbox: getSettingFromStorage(SettingKey.AutoSyncWithDropbox),
    lastModify: getSettingFromStorage(SettingKey.LastModify),
  };
  return deleteNilProperties(settingValues);
}

const allowBackupSettingsObject: { [key in keyof AllowBackupSettings]: true } = {
  [SettingKey.CollapsedTopics]: true,
  [SettingKey.FilterOutYoutube]: true,
  [SettingKey.HideSeenNews]: true,
  [SettingKey.SpaceKeyToExpandRelated]: true,
  [SettingKey.HiddenSources]: true,
  [SettingKey.HiddenUrlMatches]: true,
  [SettingKey.ExcludeTerms]: true,
  [SettingKey.NewsTopicsAfterTopStories]: true,
  [SettingKey.DropboxToken]: true,
  [SettingKey.AutoSyncWithDropbox]: true,
  [SettingKey.LastModify]: true,
};
export const allowBackupSettingKeys = Object.keys(allowBackupSettingsObject) as SettingKey[];

export function saveSettingValues(setting: Partial<AllowBackupSettings>): void {
  (Object.entries(setting) as [SettingKey, unknown][])
    .filter(([key]) => allowBackupSettingKeys.includes(key))
    .forEach(([key, value]) => saveSettingToStorage(key, value as SettingValueType[typeof key]));
}

export function trimSeenNewsItems(seenNewsItems: SeenNewsItem[] | undefined | null): SeenNewsItem[] {
  if (!seenNewsItems) {
    return [];
  }
  const now = Date.now();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return seenNewsItems?.filter((seenNews) => now - seenNews.seenAt < millisecondsPerDay * 2);
}

type SettingEvolve = Record<keyof AllowBackupSettings, (v: unknown) => object | undefined>;

export function validateSettings(settingValue: Partial<AllowBackupSettings>): SettingKey[] {
  const invalidMark = {};
  const validate = (predicate: (v: unknown) => boolean) => {
    return (v: unknown) => (isNil(v) || predicate(v) ? undefined : invalidMark);
  };

  const transformations: SettingEvolve = {
    collapsedTopics: validate((v) => Array.isArray(v)),
    filterOutYoutube: validate((v) => typeof v === 'boolean'),
    hideSeenNews: validate((v) => typeof v === 'boolean'),
    spaceKeyToExpandRelated: validate((v) => typeof v === 'boolean'),
    hiddenSources: validate((v) => Array.isArray(v)),
    hiddenUrlMatches: validate((v) => Array.isArray(v)),
    excludeTerms: validate((v) => Array.isArray(v)),
    newsTopicsAfterTopStories: validate((v) => Array.isArray(v)),
    dropboxToken: validate((v) => typeof (v as Partial<DropboxTokenInfo>).accessToken === 'string'),
    autoSyncWithDropbox: validate((v) => typeof v === 'boolean'),
    lastModify: validate((v) => typeof v === 'number'),
  };
  const errors = evolve(transformations, settingValue);
  return Object.entries(errors)
    .filter(([, value]) => value === invalidMark)
    .map(([key]) => key as SettingKey);
}

export function mergeSettings(
  settingValues1: Partial<SettingValueType>,
  settingValues2: Partial<SettingValueType>,
): Partial<SettingValueType> {
  const mergedSettings: Partial<SettingValueType> =
    (settingValues1.lastModify || 0) > (settingValues2.lastModify || 0)
      ? { ...settingValues2, ...settingValues1 }
      : { ...settingValues1, ...settingValues2 };
  mergedSettings.hiddenSources = distinctArray(settingValues1.hiddenSources, settingValues2.hiddenSources);
  mergedSettings.hiddenUrlMatches = distinctArray(settingValues1.hiddenUrlMatches, settingValues2.hiddenUrlMatches);
  mergedSettings.excludeTerms = distinctArray(settingValues1.excludeTerms, settingValues2.excludeTerms);
  return mergedSettings;
}

export function mergeSeenNews(seenNews1: SeenNewsItem[], seenNews2: SeenNewsItem[]): SeenNewsItem[] {
  const seenNewsGroupings = groupBy((seenNews) => seenNews.url, [...seenNews1, ...seenNews2]);
  return Object.entries(seenNewsGroupings).map(([, seenNewsItems]) => {
    if (seenNewsItems.length === 1) {
      return seenNewsItems[0];
    }
    const sortedItems = sortBy((seenNews) => seenNews.seenAt, seenNewsItems);
    return sortedItems[sortedItems.length - 1];
  });
}

export async function syncSettingValues(): Promise<void> {
  const remoteSettings = await getSettingValuesFromDropbox();
  if (!remoteSettings) {
    return;
  }
  const localSettings = getSettingValues();
  delete localSettings.dropboxToken;
  const mergedSettings = mergeSettings(localSettings, remoteSettings);

  const needUploadToRemote = settingsToJson(mergedSettings) !== settingsToJson(remoteSettings);
  const settingsChanged = settingsToJson(mergedSettings) !== settingsToJson(localSettings);
  const needOverrideToLocal = (remoteSettings.lastModify || 0) > (localSettings.lastModify || 0) && settingsChanged;
  if (needUploadToRemote) {
    mergedSettings.lastModify = Date.now();
    await saveSettingsToDropbox(mergedSettings);
  }
  if (needOverrideToLocal) {
    saveSettingValues(mergedSettings);
  } else if (settingsChanged) {
    saveOrDelete(SettingKey.HiddenSources, mergedSettings.hiddenSources);
    saveOrDelete(SettingKey.HiddenUrlMatches, mergedSettings.hiddenUrlMatches);
    saveOrDelete(SettingKey.ExcludeTerms, mergedSettings.excludeTerms);
  }
}

export async function syncSeenNews(): Promise<void> {
  let remoteSeenNews = await getSeenNewsFromDropbox();
  if (!remoteSeenNews) {
    return;
  }
  remoteSeenNews = trimSeenNewsItems(remoteSeenNews);

  let localSeenNews = getSettingFromStorage(SettingKey.SeenNewsItems) || [];
  localSeenNews = trimSeenNewsItems(localSeenNews);
  const mergedSeenNews = mergeSeenNews(localSeenNews, remoteSeenNews);

  const needToUploadToRemote = JSON.stringify(mergedSeenNews) !== JSON.stringify(remoteSeenNews);
  const needToSaveToLocal = JSON.stringify(mergedSeenNews) !== JSON.stringify(localSeenNews);
  if (needToUploadToRemote) {
    await saveSeenNewsToDropbox(mergedSeenNews);
  }
  if (needToSaveToLocal) {
    saveSettingToStorage(SettingKey.SeenNewsItems, mergedSeenNews);
    emitter.emit(EventKey.RemoteSeenNews, remoteSeenNews);
  }
}

function settingsToJson(settings: Partial<SettingValueType>): string {
  return JSON.stringify(omit([SettingKey.LastModify], deleteNilProperties(settings)));
}
