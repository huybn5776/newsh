import { Observable, fromEvent, filter } from 'rxjs';

import { useUntilDestroyed } from '@/compositions/use-until-destroyed';

export function useHotkey(): {
  listenForKey: (match: string | ((event: KeyboardEvent) => boolean)) => Observable<KeyboardEvent>;
} {
  const untilDestroyed = useUntilDestroyed();

  function listenForKey(match: string | ((event: KeyboardEvent) => boolean)): Observable<KeyboardEvent> {
    return fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      untilDestroyed(),
      filter((event) => (typeof match === 'string' ? event.key === match : match(event))),
    );
  }

  return { listenForKey };
}
