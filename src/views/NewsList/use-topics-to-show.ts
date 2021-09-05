import { ref, Ref } from 'vue';

import { NewsTopicType } from '@enums/news-topic-type';
import { SettingKey } from '@enums/setting-key';
import { getSettingFromStorage, saveSettingToStorage } from '@utils/storage-utils';

export function useTopicsToShow(): {
  topicsToShow: Ref<NewsTopicType[]>;
  addTopicToShow: (topicType: NewsTopicType) => void;
  deleteTopicToShow: (topicType: NewsTopicType) => void;
} {
  const topicsToShow = ref<NewsTopicType[]>(getTopicsToShow());

  return {
    topicsToShow,
    addTopicToShow(topicType: NewsTopicType) {
      topicsToShow.value = [...topicsToShow.value, topicType as NewsTopicType];
      saveTopicsToShowSetting(topicsToShow.value);
    },
    deleteTopicToShow(topicType: NewsTopicType) {
      topicsToShow.value = topicsToShow.value.filter((topic) => topic !== (topicType as NewsTopicType));
      saveTopicsToShowSetting(topicsToShow.value);
    },
  };
}

function getTopicsToShow(): NewsTopicType[] {
  const allTopicTypes = Object.values(NewsTopicType);
  const collapsedTopics = getSettingFromStorage<NewsTopicType[]>(SettingKey.CollapsedTopics);
  if (!collapsedTopics?.length) {
    return allTopicTypes;
  }
  return allTopicTypes.filter((topic) => !collapsedTopics.includes(topic));
}

function saveTopicsToShowSetting(topicTypes: NewsTopicType[]): void {
  const collapsedTopics = Object.values(NewsTopicType).filter((topic) => !topicTypes.includes(topic));
  saveSettingToStorage(SettingKey.CollapsedTopics, collapsedTopics);
}
