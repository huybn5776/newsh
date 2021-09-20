<template>
  <div class="page-content setup-page">
    <div v-if="showSetupLoader" class="loading-news-info-overlay">
      <NSpin />
      <h3>Setting up news topics info...</h3>
    </div>
    <RegionSelection
      v-else
      v-model="selectedRegion"
      :region-selections="regionSelections"
      :cancelable="cancelable"
      :disableOkButton="loading"
      @negativeClick="toNextPage"
      @positiveClick="updateRegionAndNewsInfo"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, onUnmounted } from 'vue';

import { useMessage, useLoadingBar, NSpin } from 'naive-ui';
import { useRouter, useRoute } from 'vue-router';

import RegionSelection from '@components/RegionSelection/RegionSelection.vue';
import { SettingKey } from '@enums/setting-key';
import { SelectionItem } from '@interfaces/selection-item';
import { prepareNewsInfo } from '@services/news-service';
import { getRegionSelections } from '@services/region-service';
import { getSettingFromStorage, saveSettingToStorage } from '@utils/storage-utils';

const showSetupLoader = ref(true);
const selectedRegion = ref<string>();
const regionSelections = ref<SelectionItem[]>([]);
const cancelable = ref(false);
const loading = ref(false);

const route = useRoute();
const router = useRouter();
const message = useMessage();
const loadingBar = useLoadingBar();

onMounted(async () => {
  const originalRegion = getSettingFromStorage(SettingKey.LanguageAndRegion) || undefined;
  const regionHasBeenSet = !!originalRegion;

  selectedRegion.value = originalRegion;
  showSetupLoader.value = !regionHasBeenSet;
  cancelable.value = regionHasBeenSet;

  loadingBar.start();
  loading.value = true;
  const { selections, suggestedRegions } = await getRegionSelections();
  regionSelections.value = selections;

  const canSelectRegionFroUser = showSetupLoader.value && suggestedRegions?.length === 1;
  if (canSelectRegionFroUser) {
    const regionSelection = suggestedRegions[0];
    await prepareNewsInfo(regionSelection.key);
    saveRegionSetting(regionSelection.key, regionSelection.label);
    toNextPage();
  } else {
    showSetupLoader.value = false;
  }
  loadingBar.finish();
  loading.value = false;
});

onUnmounted(() => loadingBar.finish());

function toNextPage(): void {
  const fromRoute = route.query.from as string;
  router.push({ name: fromRoute ?? 'topStories' });
}

async function updateRegionAndNewsInfo(): Promise<void> {
  if (!selectedRegion.value) {
    return;
  }

  const messageRef = message.loading('Fetching news topic info...', { duration: 0 });
  loading.value = true;
  await prepareNewsInfo(selectedRegion.value);
  messageRef.destroy();
  loading.value = false;

  const regionLabel = regionSelections.value?.find(
    (selection: SelectionItem) => selection.key === selectedRegion.value,
  )?.label;
  saveRegionSetting(selectedRegion.value, regionLabel);
  toNextPage();
}

function saveRegionSetting(languageAndRegion: string, label: string | undefined): void {
  saveSettingToStorage(SettingKey.LanguageAndRegion, languageAndRegion);
  saveSettingToStorage(SettingKey.LanguageAndRegionLabel, label);
}
</script>

<style lang="scss" scoped>
@import './SetupPage.scss';
</style>
