import { onUnmounted } from 'vue';

export function listenForKey(
  match: string | ((event: KeyboardEvent) => boolean),
  callback: (event: KeyboardEvent) => void,
): () => void {
  const keydownListener = (event: KeyboardEvent): void => {
    if ((typeof match === 'string' && event.code === match) || (typeof match === 'function' && match(event))) {
      callback(event);
    }
  };
  document.addEventListener('keydown', keydownListener);

  return () => document.removeEventListener('keydown', keydownListener);
}

export function listenForKeyOnce(
  match: string | ((event: KeyboardEvent) => boolean),
  callback: (event: KeyboardEvent) => void,
): () => void {
  const removeListener = listenForKey(match, (event) => {
    removeListener();
    callback(event);
  });
  return removeListener;
}

export function listenForKeyUntilUnmounted(
  ...params: Parameters<typeof listenForKey>
): ReturnType<typeof listenForKey> {
  const dispose = listenForKey(...params);
  onUnmounted(dispose);
  return dispose;
}
