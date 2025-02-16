import { ref, computed, watch, Ref, readonly, DeepReadonly, onUnmounted, ComputedRef } from 'vue';

import { useMessage, useLoadingBar } from 'naive-ui';
import { omit } from 'ramda';

import { getSingleTopicNews, getMultiTopicNews, getSectionTopicNews } from '@/api/google-news-api';
import { NewsTopicType } from '@/enums/news-topic-type';
import { SettingKey } from '@/enums/setting-key';
import { NewsTopicInfo } from '@/interfaces/news-topic-info';
import { NewsTopicItem } from '@/interfaces/news-topic-item';
import { getSettingFromStorage } from '@/services/setting-service';

export function useNewsRequest(): {
  getNews: (topic: NewsTopicInfo) => Promise<NewsTopicItem>;
  getSingleTopicNews: (topic: Parameters<typeof getSingleTopicNews>[0]) => Promise<NewsTopicItem>;
  getMultiTopicNews: (topic: Parameters<typeof getMultiTopicNews>[0]) => Promise<NewsTopicItem[]>;
  getSectionTopicNews: (topic: Parameters<typeof getSectionTopicNews>[0]) => Promise<NewsTopicItem>;
  loadingTopics: DeepReadonly<Ref<Record<string, true>>>;
  isLoading: ComputedRef<boolean>;
} {
  const message = useMessage();
  const loadingTopics = ref<Record<string, true>>({} as Record<string, true>);
  const isLoading = computed(() => !!Object.keys(loadingTopics.value).length);
  const languageAndRegion = computed(() => {
    const value = getSettingFromStorage(SettingKey.LanguageAndRegion);
    if (!value) {
      throw new Error('No country and language setting from storage');
    }
    return value;
  });

  const loadingBar = useLoadingBar();

  function withPushLoadingTopic<T extends string, U extends Promise<unknown>>(
    fn: (newsTopicId: T) => U,
  ): (newsTopicId: T) => U {
    return (newsTopicId: T) => {
      const request = fn(newsTopicId);
      loadingTopics.value = { ...loadingTopics.value, [newsTopicId]: true };
      request.then(() => (loadingTopics.value = omit([newsTopicId], loadingTopics.value)));
      return request;
    };
  }

  function withLanguageAndRegion<U extends Promise<unknown>, T extends string>(
    fn: (topic: T, languageAndRegion: string) => U,
  ): (topic: T) => U {
    return (topic: T) => {
      return fn(topic, languageAndRegion.value);
    };
  }

  watch(isLoading, () => (isLoading.value ? loadingBar.start() : loadingBar.finish()));

  onUnmounted(() => {
    loadingBar.finish();
  });

  const getSingleTopic = withPushLoadingTopic(withLanguageAndRegion(getSingleTopicNews));
  const getMultiTopic = withPushLoadingTopic(withLanguageAndRegion(getMultiTopicNews));
  const getSectionTopic = withPushLoadingTopic(withLanguageAndRegion(getSectionTopicNews));
  const getNews = async (topic: NewsTopicInfo): Promise<NewsTopicItem> => {
    const newsTopicItem = await getNewsByType(topic).catch((e) => {
      console.error(e);
      message.error(`Fail to load topic '${topic.name}'.`);
      loadingTopics.value = omit([topic.id], loadingTopics.value);
      return {
        id: topic.id,
        name: topic.name,
        newsItems: [],
        isPartial: topic.type !== NewsTopicType.SectionTopic,
      };
    });
    newsTopicItem.name = topic.name;
    return newsTopicItem;
  };

  function getNewsByType(topic: NewsTopicInfo): Promise<NewsTopicItem> {
    if (!topic.type) {
      return getSingleTopic(topic.id);
    }
    switch (topic.type) {
      case NewsTopicType.SingleTopic:
        return getSingleTopic(topic.id);
      case NewsTopicType.SectionTopic:
        return getSectionTopic(topic.id);
      default:
        return Promise.reject(new Error(`Invalid topic type: '${topic.type}'`));
    }
  }

  return {
    getNews,
    getSingleTopicNews: getSingleTopic,
    getMultiTopicNews: getMultiTopic,
    getSectionTopicNews: getSectionTopic,
    loadingTopics: readonly(loadingTopics),
    isLoading,
  };
}
