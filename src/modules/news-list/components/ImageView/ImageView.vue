<template>
  <img v-show="show" ref="imageElement" width="100" height="100" :src="src" :alt="alt" loading="lazy" />
</template>

<script lang="ts" setup>
import { onMounted, ref, watchEffect, onUnmounted } from 'vue';

const props = defineProps<{ src?: string; alt?: string }>();

const imageElement = ref<HTMLImageElement>();
const show = ref(true);

onMounted(() => {
  imageElement.value?.addEventListener('load', onLoaded);
  imageElement.value?.addEventListener('error', onError);
});

onUnmounted(() => {
  imageElement.value?.removeEventListener('load', onLoaded);
  imageElement.value?.removeEventListener('error', onError);
});

function onLoaded(): void {
  show.value = true;
}

function onError(): void {
  show.value = false;
}

watchEffect(() => {
  show.value = !!props.src;
});
</script>
