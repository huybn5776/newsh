import { NewsTopicInfo } from '@interfaces/news-topic-info';
import { SeenNewsItem } from '@interfaces/seen-news-item';

export enum SettingKey {
  CollapsedTopics = 'collapsedTopics',
  FilterOutYoutube = 'filterOutYoutube',
  HideSeenNews = 'hideSeenNews',
  SeenNewsItems = 'seenNewsItems',
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
}

export type SettingValueType = {
  [SettingKey.CollapsedTopics]: string[];
  [SettingKey.FilterOutYoutube]: boolean;
  [SettingKey.HideSeenNews]: boolean;
  [SettingKey.SeenNewsItems]: SeenNewsItem[];
  [SettingKey.HiddenSources]: string[];
  [SettingKey.HiddenUrlMatches]: string[];
  [SettingKey.ExcludeTerms]: string[];
  [SettingKey.LanguageAndRegion]: string;
  [SettingKey.LanguageAndRegionLabel]: string;
  [SettingKey.AllTopicsInfo]: NewsTopicInfo[];
  [SettingKey.HeadlineTopicId]: string;
  [SettingKey.NewsTopicsAfterTopStories]: string[];
};
