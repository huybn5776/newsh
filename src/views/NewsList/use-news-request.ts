import { ref, computed, watch, Ref, readonly, DeepReadonly, onUnmounted } from 'vue';

import { useLoadingBar } from 'naive-ui';

import { getSingleTopicNews, getMultiTopicNews } from '@api/google-news-api';
import { NewsTopicType } from '@enums/news-topic-type';

export function useNewsRequest(): {
  getSingleTopicNews: typeof getSingleTopicNews;
  getMultiTopicNews: typeof getMultiTopicNews;
  loadingTopics: DeepReadonly<Ref<Record<NewsTopicType, true>>>;
} {
  const pendingRequests = ref<Promise<unknown>[]>([]);
  const loadingTopics = ref<Record<NewsTopicType, true>>({} as Record<NewsTopicType, true>);
  const isLoading = computed(() => !!pendingRequests.value.length);
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
    fn: (newsTopicType: NewsTopicType) => U,
  ): (newsTopicType: NewsTopicType) => U {
    return function (newsTopicType: NewsTopicType) {
      const request = fn(newsTopicType);
      loadingTopics.value = { ...loadingTopics.value, [newsTopicType]: true };
      request.then(() => delete loadingTopics.value[newsTopicType]);
      return request;
    };
  }

  watch(isLoading, () => (isLoading.value ? loadingBar.start() : loadingBar.finish()));

  onUnmounted(() => {
    loadingBar.finish();
  });

  return {
    getSingleTopicNews: withPushLoadingTopic(withPushPendingRequest(getSingleTopicNews)),
    getMultiTopicNews: withPushPendingRequest(getMultiTopicNews),
    loadingTopics: readonly(loadingTopics),
  };
}
