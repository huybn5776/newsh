import { Ref, readonly, DeepReadonly, watch, ref, UnwrapRef } from 'vue';

interface UseDebounceConfig {
  debounceTime?: number;
  immediatelyClear?: boolean;
}

export function useDebounce<T>(
  valueRef: Ref<T>,
  { debounceTime = 200, immediatelyClear = false }: UseDebounceConfig,
): DeepReadonly<Ref<UnwrapRef<T>>> {
  const debouncedRef = ref(valueRef.value) as Ref<UnwrapRef<T>>;
  const timeout = ref<NodeJS.Timeout>();

  watch(valueRef, (newValue) => {
    if (timeout.value) {
      clearTimeout(timeout.value);
    }
    if (immediatelyClear && !newValue) {
      debouncedRef.value = newValue as UnwrapRef<T>;
    } else {
      timeout.value = setTimeout(() => {
        debouncedRef.value = newValue as UnwrapRef<T>;
      }, debounceTime);
    }
  });

  return readonly(debouncedRef);
}
