<template>
  <!--suppress RequiredAttributes -->
  <NDropdown trigger="click" placement="bottom" :options="menuOptions" @select="onDropdownSelect">
    <i class="menu-icon" @click.prevent />
  </NDropdown>
</template>

<script lang="ts" setup>
import { h } from 'vue';

import { NDropdown } from 'naive-ui';
import { DropdownMixedOption } from 'naive-ui/lib/dropdown/src/interface';

import { NewsItem } from '@/interfaces/news-item';
import { useAddNewsFilterDialog } from '@/modules/news-list/compositions/use-add-news-filter-dialog';

const menuActions: Record<string, Omit<DropdownMixedOption, 'key'> & { action: () => void }> = {
  hideNews: {
    icon: renderIcon('dropdown-filter-icon'),
    label: 'Hide news with…',
    action: () => openAddNewsFilterDialog(props.news),
  },
};

const menuOptions: DropdownMixedOption[] = Object.entries(menuActions).map(([key, option]) => ({ ...option, key }));
const props = defineProps<{ news: NewsItem }>();

const { openAddNewsFilterDialog } = useAddNewsFilterDialog();

function renderIcon(icon: string) {
  return () => h('i', { class: icon });
}

function onDropdownSelect(key: string): void {
  menuActions[key]?.action();
}
</script>

<style lang="scss" scoped>
@forward './NewsDropdown';
</style>
