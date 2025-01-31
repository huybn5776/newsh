import { ref, computed, watch, Ref, readonly, DeepReadonly, onUnmounted, ComputedRef } from 'vue';

import { useLoadingBar } from 'naive-ui';

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
  const pendingRequests = ref<Promise<unknown>[]>([]);
  const loadingTopics = ref<Record<string, true>>({} as Record<string, true>);
  const isLoading = computed(() => !!pendingRequests.value.length);
  const languageAndRegion = computed(() => {
    const value = getSettingFromStorage(SettingKey.LanguageAndRegion);
    if (!value) {
      throw new Error('No country and language setting from storage');
    }
    return value;
  });

  const loadingBar = useLoadingBar();

  function withPushPendingRequest<T extends unknown[], U extends Promise<unknown>>(
    fn: (...args: T) => U,
  ): (...args: T) => U {
    return (...args: T) => {
      const request = fn(...args);
      pendingRequests.value = [...pendingRequests.value, request];
      request.then(() => (pendingRequests.value = pendingRequests.value.filter((req) => req !== request)));
      return request;
    };
  }

  function withPushLoadingTopic<U extends Promise<unknown>>(
    fn: (newsTopicId: string) => U,
  ): (newsTopicId: string) => U {
    return (newsTopicId: string) => {
      const request = fn(newsTopicId);
      loadingTopics.value = { ...loadingTopics.value, [newsTopicId]: true };
      request.then(() => delete loadingTopics.value[newsTopicId]);
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

  const getSingleTopic = withPushLoadingTopic(withPushPendingRequest(withLanguageAndRegion(getSingleTopicNews)));
  const getMultiTopic = withPushPendingRequest(withLanguageAndRegion(getMultiTopicNews));
  const getSectionTopic = withPushPendingRequest(withLanguageAndRegion(getSectionTopicNews));
  const getNews = async (topic: NewsTopicInfo): Promise<NewsTopicItem> => {
    const newsTopicItem = await getNewsByType(topic);
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
