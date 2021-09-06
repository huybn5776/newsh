<template>
  <!--suppress RequiredAttributes -->
  <NDropdown trigger="click" placement="bottom-start" :options="menuOptions" @select="onDropdownSelect">
    <i class="menu-icon" @click.prevent />
  </NDropdown>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';

import { NDropdown, useMessage } from 'naive-ui';
import { DropdownMixedOption } from 'naive-ui/lib/dropdown/src/interface';

import { SettingKey } from '@enums/setting-key';
import { NewsItem } from '@interfaces/news-item';
import { updateSettingFromStorage } from '@utils/storage-utils';

const menuActions: Record<string, Omit<DropdownMixedOption, 'key'> & { action: () => void }> = {
  hideSource: { label: 'Hide all news from this source', action: hideSource },
};
const menuOptions: DropdownMixedOption[] = Object.entries(menuActions).map(([key, option]) => ({ ...option, key }));

const props = defineProps<{ news: NewsItem }>();

const message = useMessage();

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
</script>

<style lang="scss" scoped>
@import './NewsDropdown.scss';
</style>
