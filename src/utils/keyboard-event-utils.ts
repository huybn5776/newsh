export function listenForKeyOnce(key: string, callback: (event: KeyboardEvent) => void): () => void {
  const keydownListener = (event: KeyboardEvent): void => {
    if (event.key === key) {
      document.removeEventListener('keydown', keydownListener);
      callback(event);
    }
  };
  document.addEventListener('keydown', keydownListener);

  return () => document.removeEventListener('keydown', keydownListener);
}
