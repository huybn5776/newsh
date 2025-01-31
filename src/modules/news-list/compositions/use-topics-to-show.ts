import { ref, Ref } from 'vue';

import { SettingEventType } from '@/enums/setting-event-type';
import { SettingKey } from '@/enums/setting-key';
import { saveSettingToStorage, getSettingFromStorage } from '@/services/setting-service';

export function useTopicsToShow(): {
  topicsToShow: Ref<string[]>;
  addTopicToShow: (topicId: string) => void;
  deleteTopicToShow: (topicId: string) => void;
} {
  const topicsToShow = ref<string[]>(getTopicsToShow());

  return {
    topicsToShow,
    addTopicToShow(topicId: string) {
      topicsToShow.value = [...topicsToShow.value, topicId];
      saveTopicsToShowSetting(topicsToShow.value);
    },
    deleteTopicToShow(topicId: string) {
      topicsToShow.value = topicsToShow.value.filter((topic) => topic !== topicId);
      saveTopicsToShowSetting(topicsToShow.value);
    },
  };
}

function getTopicsToShow(): string[] {
  const allTopicsInfo = getSettingFromStorage(SettingKey.AllTopicsInfo) ?? [];
  const allTopicsId = allTopicsInfo.map((topic) => topic.id);
  const collapsedTopics = getSettingFromStorage(SettingKey.CollapsedTopics);
  if (!collapsedTopics?.length) {
    return allTopicsId;
  }
  return allTopicsId.filter((topicId) => !collapsedTopics.includes(topicId));
}

function saveTopicsToShowSetting(topicsId: string[]): void {
  const allTopicsInfo = getSettingFromStorage(SettingKey.AllTopicsInfo) ?? [];
  const allTopicsId = allTopicsInfo.map((topic) => topic.id);
  const collapsedTopics = allTopicsId.filter((topicId) => !topicsId.includes(topicId));
  saveSettingToStorage(SettingKey.CollapsedTopics, collapsedTopics, SettingEventType.User);
}
