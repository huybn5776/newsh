<template>
  <div class="page-content setup-page">
    <FullSizeSelect
      title="Language & region of interest"
      subtitle="See news from the selected language and region pair"
      :items="selectionItems"
      v-model="selectedRegion"
    />
    <footer class="setup-page-footer">
      <NButton v-if="originalRegion" @click="toNextPage">Cancel</NButton>
      <NButton type="primary" :disabled="!selectedRegion" @click="updateRegionAndNewsInfo">Ok</NButton>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed, onUnmounted } from 'vue';

import { NButton, useMessage, useLoadingBar } from 'naive-ui';
import { useRouter, useRoute } from 'vue-router';

import { getRegionList } from '@api/google-news-api';
import FullSizeSelect from '@components/FullSizeSelect/FullSizeSelect.vue';
import { SettingKey } from '@enums/setting-key';
import { RegionItem } from '@interfaces/region-item';
import { SelectionItem } from '@interfaces/selection-item';
import { prepareNewsInfo } from '@services/news-service';
import { getSettingFromStorage, saveSettingToStorage } from '@utils/storage-utils';

const originalRegion = ref(getSettingFromStorage<string>(SettingKey.LanguageAndRegion) || undefined);
const regions = ref<RegionItem[]>();
const selectedRegion = ref(originalRegion.value);

const route = useRoute();
const router = useRouter();
const message = useMessage();
const loadingBar = useLoadingBar();

const selectionItems = computed<SelectionItem[]>(
  () => regions.value?.map((region: RegionItem) => ({ key: region.languageAndRegion, label: region.label })) || [],
);

onMounted(async () => {
  loadingBar.start();
  regions.value = await getRegionList();
  loadingBar.finish();
});

onUnmounted(() => loadingBar.finish());

function toNextPage(): void {
  const fromRoute = route.query.from;
  router.push({ name: fromRoute ?? 'news' });
}

async function updateRegionAndNewsInfo(): Promise<void> {
  if (!selectedRegion.value) {
    return;
  }

  const messageRef = message.loading('Fetching news topic info...', { duration: 0 });
  await prepareNewsInfo(selectedRegion.value);
  messageRef.destroy();

  saveSettingToStorage(SettingKey.LanguageAndRegion, selectedRegion.value);
  const regionLabel = regions.value?.find(
    (region: RegionItem) => region.languageAndRegion === selectedRegion.value,
  )?.label;
  saveSettingToStorage(SettingKey.LanguageAndRegionLabel, regionLabel);

  toNextPage();
}
</script>

<style lang="scss" scoped>
@import './SetupPage.scss';
</style>
