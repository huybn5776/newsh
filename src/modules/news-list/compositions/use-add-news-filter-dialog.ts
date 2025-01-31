import { onUnmounted, ref, h } from 'vue';

import { useDialog, DialogReactive, useMessage } from 'naive-ui';
import { append } from 'ramda';
import { Subscription, Subject, takeUntil } from 'rxjs';
import { PickByValue } from 'utility-types';

import ActionMessage from '@/components/ActionMessage/ActionMessage.vue';
import { useHotkey } from '@/compositions/use-hotkey';
import { NewsFilterType } from '@/enums/news-filter-type';
import { SettingEventType } from '@/enums/setting-event-type';
import { SettingKey, SettingValueType } from '@/enums/setting-key';
import { NewsItem } from '@/interfaces/news-item';
import AddNewsFilter from '@/modules/news-list/components/AddNewsFilter/AddNewsFilter.vue';
import { saveSettingToStorage, getSettingFromStorage, updateSettingFromStorage } from '@/services/setting-service';
import { wrapOnDialogCloseEvents } from '@/utils/dialog-utils';

export function useAddNewsFilterDialog(): { openAddNewsFilterDialog: (newsItem: NewsItem) => void } {
  const message = useMessage();
  const dialog = useDialog();
  const { listenForKey } = useHotkey();
  const dialogRef = ref<DialogReactive>();

  const filterType = ref<NewsFilterType>(NewsFilterType.Term);
  const filterValue = ref('');
  const errorMessage = ref('');

  const dialogClosed$$ = new Subject<void>();

  onUnmounted(closeDialog);

  function openAddNewsFilterDialog(newsItem: NewsItem): void {
    subscribeCloseDialogHotkey();
    dialogRef.value = dialog.info({
      title: 'Hide news with:',
      content: () =>
        h(AddNewsFilter, {
          news: newsItem,
          type: filterType.value,
          value: filterValue.value,
          errorMessage: errorMessage.value,
          'onUpdate:type': (type: NewsFilterType) => {
            filterType.value = type;
            errorMessage.value = '';
          },
          'onUpdate:value': (value: string) => {
            filterValue.value = value;
            errorMessage.value = '';
          },
        }),
      showIcon: false,
      negativeText: 'Cancel',
      positiveText: 'Save',
      onPositiveClick: saveFilter,
    });
    wrapOnDialogCloseEvents(dialogRef.value, () => {
      unsubscribeHotkey();
      dialogRef.value = undefined;
    });
  }

  function subscribeCloseDialogHotkey(): Subscription {
    return listenForKey((event) => (event.key === 'Enter' && event.metaKey) || event.ctrlKey)
      .pipe(takeUntil(dialogClosed$$))
      .subscribe((event) => {
        event.preventDefault();
        const saveFilterSuccessfully = saveFilter();
        if (saveFilterSuccessfully) {
          closeDialog();
        }
      });
  }

  function saveFilter(): boolean {
    switch (filterType.value) {
      case NewsFilterType.Domain:
        return addToList(SettingKey.HiddenUrlMatches, filterValue.value.trim());
      case NewsFilterType.Publication:
        return addToList(SettingKey.HiddenSources, filterValue.value.trim());
      case NewsFilterType.Term:
        return addToList(SettingKey.ExcludeTerms, filterValue.value.trim());
      default:
        return true;
    }
  }

  function addToList(key: keyof PickByValue<SettingValueType, string[]>, value: string): boolean {
    errorMessage.value = '';
    if (!value) {
      return false;
    }
    const list = getSettingFromStorage(key);
    if (list?.includes(value)) {
      errorMessage.value = `'${value}' is already included in the list.`;
      return false;
    }
    saveSettingToStorage(key, append(value, list ?? []), SettingEventType.User);
    const messageReactive = message.info(() =>
      h(ActionMessage, {
        content: `'${value}' has been added to the list.`,
        action: 'Undo',
        duration: 10000,
        onClick: () => {
          removeFromList(key, value);
          messageReactive.destroy();
        },
      }),
    );
    return true;
  }

  function removeFromList(key: keyof PickByValue<SettingValueType, string[]>, value: string): void {
    updateSettingFromStorage(key, (list) => list?.filter((v) => v !== value) ?? null, SettingEventType.User);
  }

  function closeDialog(): void {
    dialogRef.value?.destroy();
    dialogRef.value = undefined;
    unsubscribeHotkey();
  }

  function unsubscribeHotkey(): void {
    dialogClosed$$.next(undefined);
  }

  return { openAddNewsFilterDialog };
}
