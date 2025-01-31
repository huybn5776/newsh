import { onUnmounted } from 'vue';

import { emitter, EventTypes } from '@/services/emitter-service';

export function useMitt(): { emitter: typeof emitter; onEvent: typeof onEvent; unsubscribeAllEvents: () => void } {
  let unsubscribeFunctions: (() => void)[] = [];

  onUnmounted(unsubscribeAllEvents);

  function onEvent<K extends keyof EventTypes>(eventType: K, callback: (value: EventTypes[K]) => void): () => void {
    emitter.on(eventType, callback);
    const unsubscribe = (): void => emitter.off(eventType, callback as never);
    unsubscribeFunctions.push(unsubscribe);

    return () => {
      unsubscribe();
      unsubscribeFunctions = unsubscribeFunctions.filter((fn) => fn !== unsubscribe);
    };
  }

  function unsubscribeAllEvents(): void {
    unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
  }

  return { emitter, onEvent, unsubscribeAllEvents };
}
