import { ref, computed, watch, Ref, readonly, DeepReadonly, onUnmounted, ComputedRef } from 'vue';

import { useLoadingBar } from 'naive-ui';

import { getSingleTopicNews, getMultiTopicNews } from '@api/google-news-api';
import { SettingKey } from '@enums/setting-key';
import { NewsTopicItem } from '@interfaces/news-topic-item';
import { getSettingFromStorage } from '@utils/storage-utils';

export function useNewsRequest(): {
  getSingleTopicNews: (topic: Parameters<typeof getSingleTopicNews>[0]) => Promise<NewsTopicItem>;
  getMultiTopicNews: (topic: Parameters<typeof getMultiTopicNews>[0]) => Promise<NewsTopicItem[]>;
  loadingTopics: DeepReadonly<Ref<Record<string, true>>>;
  isLoading: ComputedRef<boolean>,
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

  function withPushPendingRequest<T extends Array<unknown>, U extends Promise<unknown>>(
    fn: (...args: T) => U,
  ): (...args: T) => U {
    return function (...args: T) {
      const request = fn(...args);
      pendingRequests.value = [...pendingRequests.value, request];
      request.then(() => (pendingRequests.value = pendingRequests.value.filter((req) => req !== request)));
      return request;
    };
  }

  function withPushLoadingTopic<U extends Promise<unknown>>(
    fn: (newsTopicId: string) => U,
  ): (newsTopicId: string) => U {
    return function (newsTopicId: string) {
      const request = fn(newsTopicId);
      loadingTopics.value = { ...loadingTopics.value, [newsTopicId]: true };
      request.then(() => delete loadingTopics.value[newsTopicId]);
      return request;
    };
  }

  function withLanguageAndRegion<U extends Promise<unknown>, T extends string>(
    fn: (topic: T, languageAndRegion: string) => U,
  ): (topic: T) => U {
    return function (topic: T) {
      return fn(topic, languageAndRegion.value);
    };
  }

  watch(isLoading, () => (isLoading.value ? loadingBar.start() : loadingBar.finish()));

  onUnmounted(() => {
    loadingBar.finish();
  });

  return {
    getSingleTopicNews: withPushLoadingTopic(withPushPendingRequest(withLanguageAndRegion(getSingleTopicNews))),
    getMultiTopicNews: withPushPendingRequest(withLanguageAndRegion(getMultiTopicNews)),
    loadingTopics: readonly(loadingTopics),
    isLoading,
  };
}
