<template>
  <!--suppress RequiredAttributes -->
  <NDropdown trigger="click" placement="bottom" :options="menuOptions" @select="onDropdownSelect">
    <i class="menu-icon" @click.prevent />
  </NDropdown>
</template>

<script lang="ts" setup>
import { ref, onUnmounted } from 'vue';

import { NDropdown, useMessage, DialogReactive } from 'naive-ui';
import { DropdownMixedOption } from 'naive-ui/lib/dropdown/src/interface';
import { append } from 'ramda';

import { useInputDialog } from '@compositions/use-input-dialog';
import { SettingKey } from '@enums/setting-key';
import { NewsItem } from '@interfaces/news-item';
import { distinctArrayRight } from '@utils/array-utils';
import { updateSettingFromStorage } from '@utils/storage-utils';

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
  updateSettingFromStorage(SettingKey.HiddenSources, (hiddenSources) => append(publication, hiddenSources || []));
  message.success(`'${publication}' has been added to the hidden list.`);
}

function hideSourceByDomain(): void {
  const domain = new URL(props.news.url)?.host;
  updateSettingFromStorage(SettingKey.HiddenUrlMatches, (hiddenMatches) => append(domain, hiddenMatches || []));
  message.success(`'${domain}' has been added to the hidden list.`);
}

function addExcludeTerm(): void {
  inputDialog.open({
    title: 'Add exclude term',
    placeholder: 'exclude term',
    value: props.news.title,
    positiveText: 'Add',
    onValue: (term) => {
      if (!term) {
        return;
      }
      updateSettingFromStorage(SettingKey.ExcludeTerms, (terms) => distinctArrayRight([...(terms || []), term]));
      message.success(`'${term}' has been added to exclude terms.`);
    },
  });
}

onUnmounted(() => dialogRef.value?.destroy());
</script>

<style lang="scss" scoped>
@import './NewsDropdown.scss';
</style>
