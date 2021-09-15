import { NewsTopicInfo } from '@interfaces/news-topic-info';
import { SeenNewsItem } from '@interfaces/seen-news-item';

export enum SettingKey {
  CollapsedTopics = 'collapsedTopics',
  FilterOutYoutube = 'filterOutYoutube',
  HideSeenNews = 'hideSeenNews',
  SeenNewsItems = 'seenNewsItems',
  HiddenSources = 'hiddenSources',
  ExcludeTerms = 'excludeTerms',
  LanguageAndRegion = 'languageAndRegion',
  LanguageAndRegionLabel = 'languageAndRegionLabel',
  AllTopicsInfo = 'allTopicsInfo',
  HeadlineTopicId = 'headlineTopicId',
}

export type SettingValueType = {
  [SettingKey.CollapsedTopics]: string[];
  [SettingKey.FilterOutYoutube]: boolean;
  [SettingKey.HideSeenNews]: boolean;
  [SettingKey.SeenNewsItems]: SeenNewsItem[];
  [SettingKey.HiddenSources]: string[];
  [SettingKey.ExcludeTerms]: string[];
  [SettingKey.LanguageAndRegion]: string;
  [SettingKey.LanguageAndRegionLabel]: string;
  [SettingKey.AllTopicsInfo]: NewsTopicInfo[];
  [SettingKey.HeadlineTopicId]: string;
};
