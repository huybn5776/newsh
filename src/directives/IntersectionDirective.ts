import { Directive, DirectiveBinding } from 'vue';

export interface IntersectionDirectiveConfig {
  disabled?: boolean;
  enter?: (entry: IntersectionObserverEntry) => void;
  leave?: (entry: IntersectionObserverEntry) => void;
}

export const intersectionDirectiveFactory = (
  options?: IntersectionObserverInit,
): Directive<Element, IntersectionDirectiveConfig> => {
  const elementConfigMap = new WeakMap<Element, IntersectionDirectiveConfig>();
  const intersectionObserver = new IntersectionObserver(onIntersection, options);

  function onIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      const config = elementConfigMap.get(entry.target);
      if (entry.isIntersecting) {
        config?.enter?.(entry);
      } else {
        config?.leave?.(entry);
      }
    });
  }

  return {
    mounted(element: Element, { value: config }: DirectiveBinding<IntersectionDirectiveConfig>) {
      if (config.disabled) {
        return;
      }
      elementConfigMap.set(element, config);
      intersectionObserver.observe(element);
    },
    unmounted(element: Element, { value: config }: DirectiveBinding<IntersectionDirectiveConfig>) {
      if (config.disabled) {
        return;
      }
      elementConfigMap.delete(element);
      intersectionObserver.unobserve(element);
    },
  } as Directive<Element, IntersectionDirectiveConfig>;
};

const intersectionDirective = intersectionDirectiveFactory();

export default intersectionDirective;
