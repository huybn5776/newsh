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
  if (type === SettingEventType.User) {
    updateLastModifyTimes(key);
  }
  emitter.emit(key, { type, key, value: value as never });
}

export function updateSettingFromStorage<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
  updater: (value: T | null) => T | null,
  type: SettingEventType,
): void {
  const { updated, value } = updateFromStorage<T>(key, updater);
  if (updated) {
    updateLastModifyTimes(key);
    emitter.emit(key, { type, key, value: value as never });
  }
}

export function deleteSettingFromStorage(key: SettingKey, type: SettingEventType): void {
  deleteFromStorage(key);
  updateLastModifyTimes(key);
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

export function saveOrDeleteIfChanged<K extends SettingKey, T extends SettingValueType[K]>(
  key: K,
  value: T | null | undefined,
  type: SettingEventType,
): void {
  const orgValue = getSettingFromStorage(key);
  const isEmpty = isNilOrEmpty(value);
  const processedValue = isEmpty ? null : value;
  if ((orgValue == null && processedValue == null) || equal(orgValue, processedValue)) {
    return;
  }
  if (isEmpty) {
    deleteSettingFromStorage(key, type);
  } else {
    saveSettingToStorage(key, value, type);
  }
}

function updateLastModifyTimes(key: SettingKey, modifyTime?: number): void {
  switch (key) {
    case SettingKey.DropboxToken:
    case SettingKey.LastModifyTimes:
    case SettingKey.RemoteSettingsSnapshot:
    case SettingKey.RemoteSeenNewsSnapshot:
      break;
    default:
      updateFromStorage<SettingValueType[SettingKey.LastModifyTimes]>(SettingKey.LastModifyTimes, (modifyTimes) => ({
        ...(modifyTimes || {}),
        [key]: modifyTime ?? Date.now(),
      }));
  }
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
    allTopicsInfo: getSettingFromStorage(SettingKey.AllTopicsInfo),
    newsTopicsAfterTopStories: getSettingFromStorage(SettingKey.NewsTopicsAfterTopStories),
    dropboxToken: getSettingFromStorage(SettingKey.DropboxToken),
    autoSyncWithDropbox: getSettingFromStorage(SettingKey.AutoSyncWithDropbox),
    lastModifyTimes: getSettingFromStorage(SettingKey.LastModifyTimes),
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
  [SettingKey.AllTopicsInfo]: true,
  [SettingKey.NewsTopicsAfterTopStories]: true,
  [SettingKey.DropboxToken]: true,
  [SettingKey.AutoSyncWithDropbox]: true,
  [SettingKey.LastModifyTimes]: true,
};
export const allowBackupSettingKeys = Object.keys(allowBackupSettingsObject) as SettingKey[];

export function saveSettingValues(setting: Partial<AllowBackupSettings>, type: SettingEventType): void {
  (Object.entries(setting) as [SettingKey, unknown][])
    .filter(([key]) => allowBackupSettingKeys.includes(key))
    .forEach(([key, value]) => saveOrDeleteIfChanged(key, value as SettingValueType[typeof key], type));
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
    allTopicsInfo: validate((v) => Array.isArray(v)),
    newsTopicsAfterTopStories: validate((v) => Array.isArray(v)),
    dropboxToken: validate((v) => typeof (v as Partial<DropboxTokenInfo>).accessToken === 'string'),
    autoSyncWithDropbox: validate((v) => typeof v === 'boolean'),
    lastModifyTimes: validate((v) => typeof v === 'object'),
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
  const remoteLastModifyTimes = remoteSettings.lastModifyTimes || {};

  const mergedSettings: Partial<SettingValueType> = { ...localSettings };
  const mergedLastModifyTimes = mergedSettings.lastModifyTimes || {};
  Object.entries(remoteSettings.lastModifyTimes || {})
    .filter(
      ([key]) =>
        ![
          SettingKey.LastModifyTimes,
          SettingKey.RemoteSettingsSnapshot,
          SettingKey.RemoteSeenNewsSnapshot,
          SettingKey.HiddenSources,
          SettingKey.HiddenUrlMatches,
          SettingKey.ExcludeTerms,
        ].includes(key as SettingKey),
    )
    .forEach(([k, remoteModifyTime]) => {
      const key = k as keyof SettingValueType[SettingKey.LastModifyTimes];
      const localModifyTime = localSettings.lastModifyTimes?.[key] || 0;
      if (remoteModifyTime > localModifyTime) {
        mergedSettings[key] = remoteSettings[key] as never;
        mergedLastModifyTimes[key] = remoteLastModifyTimes[key] ?? Date.now();
      }
    });

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
  const localSettings = omit([SettingKey.DropboxToken], getSettingValues());
  const mergedSettings = mergeSettings(localSettings, remoteSettings);
  saveSettingValues(mergedSettings, SettingEventType.Sync);

  const needUploadToRemote = !equal(toSettingsCompare(mergedSettings), toSettingsCompare(remoteSettings));
  if (needUploadToRemote) {
    await saveSettingsToDropbox(mergedSettings);
    saveSettingToStorage(SettingKey.RemoteSettingsSnapshot, mergedSettings, SettingEventType.Sync);
  } else {
    saveSettingToStorage(SettingKey.RemoteSettingsSnapshot, remoteSettings, SettingEventType.Sync);
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
  const settingsWithoutDropboxToken = omit([SettingKey.DropboxToken], settings);
  await saveSettingsToDropbox(settingsWithoutDropboxToken);
  saveSettingToStorage(SettingKey.RemoteSettingsSnapshot, settingsWithoutDropboxToken, SettingEventType.User);
}

function toSettingsCompare(
  settings: Partial<SettingValueType>,
): Omit<
  Partial<SettingValueType>,
  SettingKey.LastModifyTimes | SettingKey.RemoteSettingsSnapshot | SettingKey.RemoteSeenNewsSnapshot
> {
  return deleteNilProperties(
    omit(
      [
        SettingKey.DropboxToken,
        SettingKey.LastModifyTimes,
        SettingKey.RemoteSettingsSnapshot,
        SettingKey.RemoteSeenNewsSnapshot,
      ],
      settings,
    ),
  );
}
