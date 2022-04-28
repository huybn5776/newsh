import { onUnmounted } from 'vue';

import { Subject, takeUntil, MonoTypeOperatorFunction } from 'rxjs';

export function useUntilDestroyed(): <T>() => MonoTypeOperatorFunction<T> {
  const onDestroy$$ = new Subject<void>();
  const onDestroy$ = onDestroy$$.asObservable();
  const until = takeUntil(onDestroy$);

  onUnmounted(() => {
    onDestroy$$.next();
    onDestroy$$.complete();
  });

  return <T>(): MonoTypeOperatorFunction<T> => until as MonoTypeOperatorFunction<T>;
}
