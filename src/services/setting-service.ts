import { diff } from 'fast-array-diff';
import equal from 'fast-deep-equal';
import { isNil, evolve, groupBy, sortBy, omit } from 'ramda';
import { ValuesType } from 'utility-types';

import { EventKey } from '@enums/event-key';
import { SettingEventType } from '@enums/setting-event-type';
import { SettingValueType, SettingKey, AllowBackupSettings } from '@enums/setting-key';
import { DropboxTokenInfo } from '@interfaces/dropbox-token-info';
import { SeenNewsItem } from '@interfaces/seen-news-item';
import {
  getSettingValuesFromDropbox,
  saveSettingsToDropbox,
  getSeenNewsFromDropbox,
  saveSeenNewsToDropbox,
} from '@services/dropbox-sync-service';
import { emitter } from '@services/emitter-service';
import { distinctArray } from '@utils/array-utils';
import { deleteNilProperties, isNilOrEmpty } from '@utils/object-utils';
import { saveToStorage, getFromStorage, updateFromStorage, deleteFromStorage } from '@utils/storage-utils';
import { NullableProps } from '@utils/type-utils';

export function getSettingFromStorage<K extends SettingKey, T extends SettingValueType[K]>(key: K): T | null {
  return getFromStorage<T>(key);
}

export function saveSettingToStorage<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
  value: T | null | undefined,
  type: SettingEventType,
): void {
  saveToStorage(key, value);
  updateLastModify();
  emitter.emit(key, { type, key, value: value as never });
}

export function updateSettingFromStorage<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
  updater: (value: T | null) => T | null,
  type: SettingEventType,
): void {
  const { updated, value } = updateFromStorage<T>(key, updater);
  if (updated) {
    updateLastModify();
    emitter.emit(key, { type, key, value: value as never });
  }
}

export function deleteSettingFromStorage(key: SettingKey, type: SettingEventType): void {
  deleteFromStorage(key);
  updateLastModify();
  emitter.emit(key, { type, key, value: null });
}

export function saveOrDelete<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
  value: T | null | undefined,
  type: SettingEventType,
): void {
  if (isNilOrEmpty(value)) {
    deleteSettingFromStorage(key, type);
    return;
  }
  saveSettingToStorage(key, value, type);
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

export function saveSettingValues(setting: Partial<AllowBackupSettings>, type: SettingEventType): void {
  (Object.entries(setting) as [SettingKey, unknown][])
    .filter(([key]) => allowBackupSettingKeys.includes(key))
    .forEach(([key, value]) => saveSettingToStorage(key, value as SettingValueType[typeof key], type));
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
  localSettings: Partial<SettingValueType>,
  remoteSettings: Partial<SettingValueType>,
): Partial<SettingValueType> {
  const settingsSnapshot = getSettingFromStorage(SettingKey.RemoteSettingsSnapshot);
  const mergedSettings: Partial<SettingValueType> =
    (localSettings.lastModify || 0) > (remoteSettings.lastModify || 0)
      ? { ...remoteSettings, ...localSettings }
      : { ...localSettings, ...remoteSettings };

  const patcher = createArrayDiffPatcher(localSettings, remoteSettings, settingsSnapshot);
  mergedSettings.hiddenSources = patcher(SettingKey.HiddenSources);
  mergedSettings.hiddenUrlMatches = patcher(SettingKey.HiddenUrlMatches);
  mergedSettings.excludeTerms = patcher(SettingKey.ExcludeTerms);
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

function createArrayDiffPatcher(
  localSettings: Partial<SettingValueType>,
  remoteSettings: Partial<SettingValueType>,
  remoteSnapshot: Partial<SettingValueType> | undefined | null,
) {
  return <
    K extends SettingValueType[K] extends Array<unknown> ? SettingKey : never,
    T extends SettingValueType[K] extends Array<unknown> ? SettingValueType[K] : never,
    E extends ValuesType<T>,
  >(
    key: K,
  ): E[] => {
    const local = localSettings[key] as E[];
    const remote = remoteSettings[key] as E[];
    const snapshot = remoteSnapshot?.[key] as E[];
    const arrayDiff = diff<E>(snapshot || [], remote || []);
    let patchedArray = (local || []).filter((entry) => !arrayDiff.removed.includes(entry));
    patchedArray = [...patchedArray, ...arrayDiff.added];
    return distinctArray(patchedArray);
  };
}

export async function syncSettingValues(): Promise<void> {
  const remoteSettings = await getSettingValuesFromDropbox();
  if (!remoteSettings) {
    return;
  }
  const localSettings = getSettingValues();
  delete localSettings.dropboxToken;
  const mergedSettings = mergeSettings(localSettings, remoteSettings);

  const needUploadToRemote = !equal(toSettingsCompare(mergedSettings), toSettingsCompare(remoteSettings));
  const settingsChanged = !equal(toSettingsCompare(mergedSettings), toSettingsCompare(localSettings));
  const needOverrideToLocal = (remoteSettings.lastModify || 0) > (localSettings.lastModify || 0) && settingsChanged;
  if (needUploadToRemote) {
    mergedSettings.lastModify = Date.now();
    await saveSettingsToDropbox(mergedSettings);
    saveSettingToStorage(SettingKey.RemoteSettingsSnapshot, mergedSettings, SettingEventType.Sync);
  } else {
    saveSettingToStorage(SettingKey.RemoteSettingsSnapshot, remoteSettings, SettingEventType.Sync);
  }
  if (needOverrideToLocal) {
    saveSettingValues(mergedSettings);
  } else if (settingsChanged) {
    saveOrDelete(SettingKey.HiddenSources, mergedSettings.hiddenSources, SettingEventType.Sync);
    saveOrDelete(SettingKey.HiddenUrlMatches, mergedSettings.hiddenUrlMatches, SettingEventType.Sync);
    saveOrDelete(SettingKey.ExcludeTerms, mergedSettings.excludeTerms, SettingEventType.Sync);
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

  const needToUploadToRemote = !equal(mergedSeenNews, remoteSeenNews);
  const needToSaveToLocal = !equal(mergedSeenNews, localSeenNews);
  if (needToUploadToRemote) {
    await saveSeenNewsToDropbox(mergedSeenNews);
  }
  if (needToSaveToLocal) {
    saveSettingToStorage(SettingKey.SeenNewsItems, mergedSeenNews, SettingEventType.Sync);
    emitter.emit(EventKey.RemoteSeenNews, remoteSeenNews);
  }
}

export async function loadSettingsFromDropbox(): Promise<void> {
  const remoteSettings = await getSettingValuesFromDropbox();
  if (!remoteSettings) {
    return;
  }
  saveSettingToStorage(SettingKey.RemoteSettingsSnapshot, remoteSettings, SettingEventType.Sync);
  const localSettings = getSettingValues();
  delete localSettings.dropboxToken;

  const settingsChanged = !equal(toSettingsCompare(localSettings), toSettingsCompare(remoteSettings));
  if (settingsChanged) {
    saveSettingValues(remoteSettings, SettingEventType.Sync);
  }
}

export async function loadSeenNewsFromDropbox(): Promise<void> {
  let remoteSeenNews = await getSeenNewsFromDropbox();
  if (!remoteSeenNews) {
    return;
  }
  remoteSeenNews = trimSeenNewsItems(remoteSeenNews);
  saveSettingToStorage(SettingKey.SeenNewsItems, remoteSeenNews, SettingEventType.User);
}

export async function uploadSettingsToDropbox(settings: Partial<SettingValueType>): Promise<void> {
  await saveSettingsToDropbox(settings);
  saveSettingToStorage(SettingKey.RemoteSettingsSnapshot, settings, SettingEventType.User);
}

function toSettingsCompare(
  settings: Partial<SettingValueType>,
): Omit<
  Partial<SettingValueType>,
  SettingKey.LastModify | SettingKey.RemoteSettingsSnapshot | SettingKey.RemoteSeenNewsSnapshot
> {
  return deleteNilProperties(
    omit([SettingKey.LastModify, SettingKey.RemoteSettingsSnapshot, SettingKey.RemoteSeenNewsSnapshot], settings),
  );
}
