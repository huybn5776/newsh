<template>
  <div :class="{ 'list-in-dragging': isDragging, 'stop-interaction': dropTransitioning }">
    <div
      v-for="(item, index) in delayedItems"
      :key="item.id"
      class="drag-list-item-container"
      :class="{ 'dragging-item': isDragging && draggingItemIndex === index }"
    >
      <div
        class="drag-list-item"
        :style="{
          transform:
            index !== draggingItemIndex && item.movable !== false && moveOffsets[index]
              ? `translateY(${moveOffsets[index] * 100}%)`
              : undefined,
          transition: stopAllTransition ? 'none' : undefined,
        }"
      >
        <button
          v-if="item.movable !== false"
          class="drag-button"
          type="button"
          @mousedown="subscribeForDragMove($event, index)"
          @touchstart="subscribeForDragMove($event, index)"
        />
        <span v-else />
        <slot :item="item" :index="index" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';

import { clamp } from 'ramda';
import { merge, fromEvent, tap, map, distinctUntilChanged, takeUntil, take } from 'rxjs';

import { useInverseRef } from '@/compositions/use-inverse-ref';
import { useUntilDestroyed } from '@/compositions/use-until-destroyed';
import { useValueSample } from '@/compositions/use-value-sample';

const props = defineProps<{ items: { id: string; movable?: boolean }[] }>();
const emit = defineEmits<{
  (e: 'dragging', value: boolean): void;
  (e: 'update:items', value: { id: string }[]): void;
}>();

const untilDestroyed = useUntilDestroyed();
const moveOffsets = ref<number[]>([]);
const dropTransitioning = ref(false);
const stopAllTransition = ref(false);
const isDragging = ref<boolean>(false);
const draggingItemIndex = ref<number>();

const items = computed(() => props.items);
const delayedItems = useValueSample(items, useInverseRef(dropTransitioning));

watch(isDragging, () => emit('dragging', isDragging.value));

function subscribeForDragMove(startEvent: MouseEvent | TouchEvent, itemIndex: number): void {
  const targetElement = startEvent.target as HTMLElement;
  const itemElement = targetElement.parentElement!;
  const draggableContainerElement = itemElement.parentElement!;

  const itemHeight = draggableContainerElement.offsetHeight;
  const minBoundOfItemIndex = -itemIndex * itemHeight - itemHeight * 0.1;
  const maxBoundOfItemIndex = (props.items.length - 1 - itemIndex) * itemHeight + itemHeight * 0.1;
  const startY = Math.round(getPositionFromEvent(startEvent).y);
  const yOffset$ = merge(
    fromEvent<MouseEvent>(document.body, 'mousemove'),
    fromEvent<TouchEvent>(document.body, 'touchmove', { passive: false }),
  ).pipe(
    tap((event) => event.preventDefault()),
    map((event) => Math.round(getPositionFromEvent(event).y - startY)),
    distinctUntilChanged(),
  );
  const end$ = merge(fromEvent<MouseEvent>(document.body, 'mouseup'), fromEvent<TouchEvent>(document.body, 'touchend'));

  const setEnableTransitionState = (enable: boolean): void => {
    draggableContainerElement.style.transition = enable ? '' : 'none';
  };
  const setYPosition = (y: number): void => {
    draggableContainerElement.style.transform = y ? `translateY(${y}px)` : '';
  };

  startEvent.preventDefault();

  yOffset$.pipe(take(1), takeUntil(end$), untilDestroyed()).subscribe(() => {
    isDragging.value = true;
    draggingItemIndex.value = itemIndex;
    setEnableTransitionState(false);
  });
  yOffset$.pipe(takeUntil(end$), untilDestroyed()).subscribe((yOffset) => {
    moveOffsets.value = calcMoveOffsets(yOffset, itemHeight, itemIndex);
    if (yOffset < minBoundOfItemIndex) {
      setYPosition(minBoundOfItemIndex + (yOffset - minBoundOfItemIndex) / 5);
    } else if (yOffset > maxBoundOfItemIndex) {
      setYPosition(maxBoundOfItemIndex + (yOffset - maxBoundOfItemIndex) / 5);
    } else {
      setYPosition(yOffset);
    }
  });

  end$.pipe(take(1), untilDestroyed()).subscribe(() => {
    isDragging.value = false;
    setEnableTransitionState(true);
    const movement = moveOffsets.value[itemIndex];
    const limitedMovement = clamp(-itemIndex, props.items.length - 1 - itemIndex, movement);
    setYPosition(limitedMovement * itemHeight);

    const offsets = [...moveOffsets.value];
    const notMoved = offsets.every((offset) => offset === 0);
    if (notMoved) {
      draggingItemIndex.value = undefined;
      return;
    }
    emitItemUpdate(offsets);
    transitionListAfterDragMove(draggableContainerElement, setYPosition, setEnableTransitionState);
  });
}

function getPositionFromEvent(event: MouseEvent | TouchEvent): { x: number; y: number } {
  const x = event.type.startsWith('mouse') ? (event as MouseEvent).screenX : (event as TouchEvent).touches[0].screenX;
  const y = event.type.startsWith('mouse') ? (event as MouseEvent).screenY : (event as TouchEvent).touches[0].screenY;
  return { x, y };
}

function calcMoveOffsets(yOffset: number, itemHeight: number, itemIndex: number): number[] {
  const itemsBeforeToMoveDown = Math.min(0, Math.ceil((yOffset - itemHeight / 2) / itemHeight));
  const itemsAfterToMoveUp = Math.max(0, Math.floor((yOffset + itemHeight / 2) / itemHeight));
  const itemMoveOffset = itemsBeforeToMoveDown || itemsAfterToMoveUp;
  const startIndexToMoveDown = itemsBeforeToMoveDown + itemIndex;
  const lastIndexToMoveUp = itemsAfterToMoveUp + itemIndex;

  const offsets: number[] = [];
  for (let i = 0; i < props.items.length; i += 1) {
    if (i < itemIndex && i >= startIndexToMoveDown) {
      offsets[i] = 1;
    } else if (i > itemIndex && i <= lastIndexToMoveUp) {
      offsets[i] = -1;
    } else {
      offsets[i] = 0;
    }
  }
  offsets[itemIndex] = itemMoveOffset;
  return offsets;
}

function emitItemUpdate(offsets: number[]): void {
  const newItems: typeof props.items = [];
  props.items.forEach((item, index) => {
    const indexAfterApplyOffset = index + offsets[index];
    const limitedIndex = clamp(0, props.items.length - 1, indexAfterApplyOffset);
    newItems[limitedIndex] = item;
  });
  emit('update:items', newItems);
}

function transitionListAfterDragMove(
  draggableContainerElement: HTMLElement,
  setYPosition: (y: number) => void,
  setEnableTransitionState: (enable: boolean) => void,
): void {
  dropTransitioning.value = true;
  fromEvent(draggableContainerElement, 'transitionend')
    .pipe(take(1), untilDestroyed())
    .subscribe(() => {
      setYPosition(0);
      draggingItemIndex.value = undefined;
      moveOffsets.value = [];

      dropTransitioning.value = false;
      stopAllTransition.value = true;
      setEnableTransitionState(false);
      setTimeout(() => {
        stopAllTransition.value = false;
        setEnableTransitionState(true);
      });
    });
}
</script>

<style lang="scss" scoped>
@forward './ListDragSort';
</style>
