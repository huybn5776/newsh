import { DropboxTokenInfo } from '@/interfaces/dropbox-token-info';
import { NewsTopicInfo } from '@/interfaces/news-topic-info';
import { SeenNewsItem } from '@/interfaces/seen-news-item';

export enum SettingKey {
  CollapsedTopics = 'collapsedTopics',
  FilterOutYoutube = 'filterOutYoutube',
  HideSeenNews = 'hideSeenNews',
  HideSeenNewsInDays = 'hideSeenNewsInDays',
  SpaceKeyToExpandRelated = 'spaceKeyToExpandRelated',
  SeenNewsItems = 'seenNewsItems',
  HideShortTitleNews = 'hideShortTitleNews',
  HideShortTitleNewsInChars = 'hideShortTitleNewsInChars',
  /**
   * publication name
   */
  HiddenSources = 'hiddenSources',
  HiddenUrlMatches = 'hiddenUrlMatches',
  ExcludeTerms = 'excludeTerms',
  LanguageAndRegion = 'languageAndRegion',
  LanguageAndRegionLabel = 'languageAndRegionLabel',
  AllTopicsInfo = 'allTopicsInfo',
  HeadlineTopicId = 'headlineTopicId',
  NewsTopicsAfterTopStories = 'newsTopicsAfterTopStories',
  DropboxToken = 'dropboxToken',
  AutoSyncWithDropbox = 'autoSyncWithDropbox',
  SyncUpdateNotify = 'syncUpdateNotify',
  LastModifyTimes = 'lastModifyTimes',
  RemoteSettingsSnapshot = 'remoteSettingsSnapshot',
  RemoteSeenNewsSnapshot = 'remoteSeenNewsSnapshot',
}

export type SettingValueType = {
  [SettingKey.CollapsedTopics]: string[];
  [SettingKey.FilterOutYoutube]: boolean;
  [SettingKey.HideSeenNews]: boolean;
  [SettingKey.HideSeenNewsInDays]: number;
  [SettingKey.SpaceKeyToExpandRelated]: boolean;
  [SettingKey.SeenNewsItems]: SeenNewsItem[];
  [SettingKey.HideShortTitleNews]: boolean;
  [SettingKey.HideShortTitleNewsInChars]: number;
  [SettingKey.HiddenSources]: string[];
  [SettingKey.HiddenUrlMatches]: string[];
  [SettingKey.ExcludeTerms]: string[];
  [SettingKey.LanguageAndRegion]: string;
  [SettingKey.LanguageAndRegionLabel]: string;
  [SettingKey.AllTopicsInfo]: NewsTopicInfo[];
  [SettingKey.HeadlineTopicId]: string;
  [SettingKey.NewsTopicsAfterTopStories]: string[];
  [SettingKey.DropboxToken]: DropboxTokenInfo;
  [SettingKey.AutoSyncWithDropbox]: boolean;
  [SettingKey.SyncUpdateNotify]: boolean;
  [SettingKey.LastModifyTimes]: Partial<Record<keyof AllowBackupSettings, number>>;
  [SettingKey.RemoteSettingsSnapshot]: Partial<AllowBackupSettings>;
  [SettingKey.RemoteSeenNewsSnapshot]: SeenNewsItem[];
};

export type AllowBackupSettings = Omit<
  SettingValueType,
  | SettingKey.SeenNewsItems
  | SettingKey.LanguageAndRegion
  | SettingKey.LanguageAndRegionLabel
  | SettingKey.HeadlineTopicId
  | SettingKey.RemoteSettingsSnapshot
  | SettingKey.RemoteSeenNewsSnapshot
>;
