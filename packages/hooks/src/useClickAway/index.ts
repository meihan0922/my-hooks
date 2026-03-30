import { useEffect } from 'react';

import { useMemoizedFn } from '../useMemoizedFn';

// 使用者可以傳 ref 或是 dom 元素 或是 多個 ref/element 的 array
type BasicTarget<T = HTMLElement> = T | null | undefined;
type TargetValue<T = HTMLElement> = React.RefObject<T | null> | BasicTarget<T>;
type Target<T = HTMLElement> = TargetValue<T> | TargetValue<T>[];

function getTargetElement<T extends HTMLElement>(target: TargetValue<T>): T | null {
  if (!target) return null;

  // react ref object
  if (typeof target === 'object' && 'current' in target) {
    return target.current;
  }

  // dom element
  return target;
}

function getTargetElements<T extends HTMLElement>(target: Target<T>): T[] {
  const targets = Array.isArray(target) ? target : [target];

  return targets.map(item => getTargetElement(item)).filter(Boolean) as T[];
}
// TODO: support multiple document
// TODO: 支援 shadow dom

export function useClickAway<T extends HTMLElement = HTMLElement>(
  target: Target<T>,
  onClickAway: (event: Event) => void,
  // TODO: 每次 render 都是新的，需要讓使用者傳穩定的或是在文件中提醒，或是做 normalize/memoize
  events: string[] = ['mousedown', 'touchstart'],
  // TODO: options support: capture, passive, once, etc.
) {
  const handler = useMemoizedFn((event: Event) => {
    const eventTarget = event.target as Node | null;
    if (!eventTarget) return;

    const targetElements = getTargetElements(target);

    if (!targetElements.length) return;

    const clickedInside = targetElements.some(el => el.contains(eventTarget));
    if (clickedInside) return;

    onClickAway(event);
  });

  useEffect(() => {
    // ssr guard
    if (typeof document === 'undefined') return;

    for (const eventName of events) {
      document.addEventListener(eventName, handler);
    }

    return () => {
      for (const eventName of events) {
        document.removeEventListener(eventName, handler);
      }
    };
  }, [events, handler]);
}
