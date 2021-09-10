import { ref, Ref } from 'vue';

import { SettingKey } from '@enums/setting-key';
import { getSettingFromStorage, saveSettingToStorage } from '@utils/storage-utils';

export function useTopicsToShow(): {
  topicsToShow: Ref<string[]>;
  addTopicToShow: (topicId: string) => void;
  deleteTopicToShow: (topicId: string) => void;
} {
  const topicsToShow = ref<string[]>(getTopicsToShow());

  return {
    topicsToShow,
    addTopicToShow(topicId:string ) {
      topicsToShow.value = [...topicsToShow.value, topicId];
      saveTopicsToShowSetting(topicsToShow.value);
    },
    deleteTopicToShow(topicId:string ) {
      topicsToShow.value = topicsToShow.value.filter((topic) => topic !== (topicId));
      saveTopicsToShowSetting(topicsToShow.value);
    },
  };
}

function getTopicsToShow(): string[] {
  const allTopicsId = getSettingFromStorage<string[]>(SettingKey.AllTopicsId) || [];
  const collapsedTopics = getSettingFromStorage<string[]>(SettingKey.CollapsedTopics);
  if (!collapsedTopics?.length) {
    return allTopicsId;
  }
  return allTopicsId.filter((topicId) => !collapsedTopics.includes(topicId));
}

function saveTopicsToShowSetting(topicsId: string[]): void {
  const allTopicsId = getSettingFromStorage<string[]>(SettingKey.AllTopicsId) || [];
  const collapsedTopics = allTopicsId.filter((topicId) => !topicsId.includes(topicId));
  saveSettingToStorage(SettingKey.CollapsedTopics, collapsedTopics);
}
