<template>
  <div class="chevron-arrow-container" @click="toggleDirection">
    <i class="chevron-arrow" :class="direction"></i>
  </div>
</template>

<script lang="ts" setup>
import { PropType, ref, watch } from 'vue';

const props = defineProps({
  direction: {
    type: String as PropType<'up' | 'down'>,
    default: () => 'down',
  },
});
const emits = defineEmits<{ (direction: 'update:direction', value: 'up' | 'down'): void }>();

const direction = ref(props.direction);

watch(
  () => props.direction,
  () => (direction.value = props.direction),
);

function toggleDirection(): void {
  direction.value = direction.value === 'up' ? 'down' : 'up';
  emits('update:direction', direction.value);
}
</script>

<style lang="scss" scoped>
@import './ChevronArrow';
</style>
