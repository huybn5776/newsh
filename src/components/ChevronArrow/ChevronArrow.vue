<template>
  <button class="chevron-arrow-container" @click="toggleDirection">
    <i class="chevron-arrow" :class="direction" />
  </button>
</template>

<script lang="ts" setup>
import { PropType, ref, watch } from 'vue';

const props = defineProps({
  direction: {
    type: String as PropType<'up' | 'down'>,
    default: () => 'down',
  },
});
const emit = defineEmits<{ (direction: 'update:direction', value: 'up' | 'down'): void }>();

const direction = ref(props.direction);

watch(
  () => props.direction,
  () => (direction.value = props.direction),
);

function toggleDirection(): void {
  direction.value = direction.value === 'up' ? 'down' : 'up';
  emit('update:direction', direction.value);
}
</script>

<style lang="scss" scoped>
@forward './ChevronArrow';
</style>
