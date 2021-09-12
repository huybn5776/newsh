<template>
  <div class="page-content setup-page">
    <RegionSelection
      v-model="selectedRegion"
      :region-selections="regionSelections"
      @negativeClick="toNextPage"
      @positiveClick="updateRegionAndNewsInfo"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, onUnmounted } from 'vue';

import { useMessage, useLoadingBar } from 'naive-ui';
import { useRouter, useRoute } from 'vue-router';

import RegionSelection from '@components/RegionSelection/RegionSelection.vue';
import { SettingKey } from '@enums/setting-key';
import { SelectionItem } from '@interfaces/selection-item';
import { prepareNewsInfo } from '@services/news-service';
import { getRegionSelections } from '@services/region-service';
import { getSettingFromStorage, saveSettingToStorage } from '@utils/storage-utils';

const originalRegion = ref(getSettingFromStorage<string>(SettingKey.LanguageAndRegion) || undefined);
const regionSelections = ref<SelectionItem[]>([]);
const selectedRegion = ref(originalRegion.value);

const route = useRoute();
const router = useRouter();
const message = useMessage();
const loadingBar = useLoadingBar();

onMounted(async () => {
  loadingBar.start();
  regionSelections.value = await getRegionSelections();
  loadingBar.finish();
});

onUnmounted(() => loadingBar.finish());

function toNextPage(): void {
  const fromRoute = route.query.from as string;
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
  const regionLabel = regionSelections.value?.find(
    (selection: SelectionItem) => selection.key === selectedRegion.value,
  )?.label;
  saveSettingToStorage(SettingKey.LanguageAndRegionLabel, regionLabel);

  toNextPage();
}
</script>

<style lang="scss" scoped>
@import './SetupPage.scss';
</style>
