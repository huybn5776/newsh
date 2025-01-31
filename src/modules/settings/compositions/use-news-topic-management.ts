import { h, ref } from 'vue';

import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { useMessage, useDialog } from 'naive-ui';

import { useInputDialog } from '@/compositions/use-input-dialog';
import { SettingEventType } from '@/enums/setting-event-type';
import { SettingKey } from '@/enums/setting-key';
import { NewsTopicInfo } from '@/interfaces/news-topic-info';
import NewsTopicManagement from '@/modules/settings/components/NewsTopicManagement/NewsTopicManagement.vue';
import { getPublicationIdAndSectionIdFromUrl, tryGetNewsItem } from '@/services/news-service';
import { getSettingFromStorage, saveSettingToStorage } from '@/services/setting-service';

export function useNewsTopicManagement(): { openAddTopicDialog: () => void; openManagementDialog: () => void } {
  const message = useMessage();
  const inputDialog = useInputDialog();
  const dialog = useDialog();

  const topicInfoList = ref<NewsTopicInfo[]>([]);

  function openAddTopicDialog(): void {
    inputDialog.open({
      placeholder: `Publication URL, e.g. https://news.google.com/publications/{id} or https://news.google.com/publications/{id}/sections/{id}`,
      value: '',
      inputType: 'textarea',
      title: 'Add publication topic by URL',
      minRows: 3,
      showIcon: false,
      beforeClose: addTopic,
    });
  }

  function openManagementDialog(): void {
    topicInfoList.value = getSettingFromStorage(SettingKey.AllTopicsInfo) ?? [];
    dialog.info({
      title: 'News topic management',
      content: () =>
        h(NewsTopicManagement, {
          topicInfoList: topicInfoList.value,
          'onUpdate:topicInfoList': (topicList: NewsTopicInfo[]) => {
            topicInfoList.value = topicList;
          },
        }),
      showIcon: false,
      negativeText: 'Cancel',
      positiveText: 'Save',
      onPositiveClick: () => {
        saveSettingToStorage(SettingKey.AllTopicsInfo, topicInfoList.value, SettingEventType.User);
      },
    });
  }

  async function addTopic(urlString: string): Promise<boolean> {
    const topicInfoEither = await pipe(
      TE.fromEither(getPublicationIdAndSectionIdFromUrl(urlString)),
      TE.chain(({ publicationId, sectionId, region }) =>
        tryGetNewsItem(publicationId, sectionId, region || getSettingFromStorage(SettingKey.LanguageAndRegion) || ''),
      ),
    )();
    if (E.isLeft(topicInfoEither)) {
      message.error(topicInfoEither.left, { duration: 10000 });
      return false;
    }
    const newsTopicInfo = topicInfoEither.right;
    message.success(`'${newsTopicInfo.name}' has been added successfully.`);
    let allTopics = getSettingFromStorage(SettingKey.AllTopicsInfo) ?? [];
    allTopics = [...allTopics, newsTopicInfo];
    saveSettingToStorage(SettingKey.AllTopicsInfo, allTopics, SettingEventType.User);
    return true;
  }

  return { openAddTopicDialog, openManagementDialog };
}
