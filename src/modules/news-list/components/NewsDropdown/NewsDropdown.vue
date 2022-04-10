<template>
  <!--suppress RequiredAttributes -->
  <NDropdown trigger="click" placement="bottom" :options="menuOptions" @select="onDropdownSelect">
    <i class="menu-icon" @click.prevent />
  </NDropdown>
</template>

<script lang="ts" setup>
import { ref, onUnmounted, h } from 'vue';

import { NDropdown, useMessage, DialogReactive } from 'naive-ui';
import { DropdownMixedOption } from 'naive-ui/lib/dropdown/src/interface';
import { append } from 'ramda';
import { PickByValue } from 'utility-types';

import ActionMessage from '@components/ActionMessage/ActionMessage.vue';
import { useInputDialog } from '@compositions/use-input-dialog';
import { SettingEventType } from '@enums/setting-event-type';
import { SettingKey, SettingValueType } from '@enums/setting-key';
import { NewsItem } from '@interfaces/news-item';
import { getSettingFromStorage, saveSettingToStorage, updateSettingFromStorage } from '@services/setting-service';

const menuActions: Record<string, Omit<DropdownMixedOption, 'key'> & { action: () => void }> = {
  hideSourceByPublication: { label: 'Hide all news from this publication', action: hideSourceByPublication },
  hideSourceByDomain: { label: 'Hide all news from this domain', action: hideSourceByDomain },
  addExcludeTerm: { label: 'Add exclude term from title (edit)', action: addExcludeTerm },
};
const menuOptions: DropdownMixedOption[] = Object.entries(menuActions).map(([key, option]) => ({ ...option, key }));

const props = defineProps<{ news: NewsItem }>();

const message = useMessage();
const inputDialog = useInputDialog();
const dialogRef = ref<DialogReactive>();

function onDropdownSelect(key: string): void {
  menuActions[key]?.action();
}

function hideSourceByPublication(): void {
  const { publication } = props.news;
  addToList(SettingKey.HiddenSources, publication);
}

function hideSourceByDomain(): void {
  const domain = new URL(props.news.url)?.host;
  addToList(SettingKey.HiddenUrlMatches, domain);
}

function addExcludeTerm(): void {
  inputDialog.open({
    title: 'Add exclude term',
    placeholder: 'exclude term',
    value: props.news.title,
    positiveText: 'Add',
    onValue: (term) => {
      const trimmedTerm = term.trim();
      if (!trimmedTerm) {
        return;
      }
      addToList(SettingKey.ExcludeTerms, trimmedTerm);
    },
  });
}

function addToList<K extends keyof PickByValue<SettingValueType, string[]>>(key: K, value: string): void {
  const list = getSettingFromStorage(key);
  if (list?.includes(value)) {
    message.error(`'${value}' is already included in the list.`, {
      duration: 10000,
      closable: true,
    });
    return;
  }
  saveSettingToStorage(key, append(value, list || []), SettingEventType.User);
  const messageReactive = message.info(() =>
    h(ActionMessage, {
      content: `'${value}' has been added to the list.`,
      action: 'Undo',
      onClick: () => {
        removeFromList(key, value);
        messageReactive.destroy();
      },
    }),
  );
}

function removeFromList<K extends keyof PickByValue<SettingValueType, string[]>>(key: K, value: string): void {
  updateSettingFromStorage(key, (list) => list?.filter((v) => v !== value) || null, SettingEventType.User);
}

onUnmounted(() => dialogRef.value?.destroy());
</script>

<style lang="scss" scoped>
@import './NewsDropdown';
</style>
