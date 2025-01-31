import { computed, ComputedRef } from 'vue';

import { isMobile } from '@/utils/browser-utils';

export function useIsMobile(): ComputedRef<boolean> {
  return computed(() => isMobile());
}
