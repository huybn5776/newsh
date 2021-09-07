<template>
  <!--suppress RequiredAttributes -->
  <NDropdown trigger="click" placement="bottom-start" :options="menuOptions" @select="onDropdownSelect">
    <i class="menu-icon" @click.prevent />
  </NDropdown>
</template>

<script lang="ts" setup>
import { defineProps, ref, onUnmounted } from 'vue';

import { NDropdown, useMessage, DialogReactive } from 'naive-ui';
import { DropdownMixedOption } from 'naive-ui/lib/dropdown/src/interface';

import { useInputDialog } from '@compositions/use-input-dialog';
import { SettingKey } from '@enums/setting-key';
import { NewsItem } from '@interfaces/news-item';
import { updateSettingFromStorage } from '@utils/storage-utils';

const menuActions: Record<string, Omit<DropdownMixedOption, 'key'> & { action: () => void }> = {
  hideSource: { label: 'Hide all news from this source', action: hideSource },
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

function hideSource(): void {
  updateSettingFromStorage<string[]>(SettingKey.HiddenSources, (hiddenSources) => [
    ...(hiddenSources || []),
    props.news.publication,
  ]);
  message.success(`'${props.news.publication}' has been added to the hidden list.`);
}

function addExcludeTerm(): void {
  inputDialog.open({
    title: 'Add exclude term',
    placeholder: 'exclude term',
    value: props.news.title,
    onValue: (term) => {
      if (!term) {
        return;
      }
      updateSettingFromStorage<string[]>(SettingKey.ExcludeTerms, (terms) => [...(terms || []), term]);
      message.success(`'${term}' has been added to exclude terms.`);
    },
  });
}

onUnmounted(() => dialogRef.value?.destroy());
</script>

<style lang="scss" scoped>
@import './NewsDropdown.scss';
</style>
