import { computed, Ref } from 'vue';

export function useInverseRef(boolRef: Ref<boolean>): Ref<boolean> {
  return computed(() => !boolRef.value);
}
