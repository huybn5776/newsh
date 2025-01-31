import { Ref, ref, watch, UnwrapRef } from 'vue';

export function useValueSample<T>(source: Ref<UnwrapRef<T>>, open: Ref<boolean>): Ref<UnwrapRef<T>> {
  const sampleResult = ref<T>(source.value as T);

  watch(source, updateValue);
  watch(open, updateValue);

  function updateValue(): void {
    if (open.value) {
      sampleResult.value = source.value;
    }
  }

  return sampleResult as Ref<UnwrapRef<T>>;
}
