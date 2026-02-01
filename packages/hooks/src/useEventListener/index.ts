import type React from 'react';
import { useEffect } from 'react';

import { useMemoizedFn } from '../';

export type BasicTarget = EventTarget;

export type Target = BasicTarget | null | undefined | React.RefObject<BasicTarget | null | undefined>;

function getTargetElement(target?: Target): BasicTarget | null {
  if (!target) return null;
  // target 也可能是 null/undefined（ref 還沒掛上）
  if (typeof target === 'object' && 'current' in target) {
    return target.current ?? null;
  }
  return target;
}

export function useEventListener(
  eventName: string,
  handler: (event: any) => void,
  target?: Target,
  options?: boolean | AddEventListenerOptions,
) {
  // 事件 listener 只會綁一次，但 handler 內部常會用到最新 state/props
  // 1. 要確保綁定的 fn 穩定，2. 實際執行需要用到最新的 handler
  const latestHandler = useMemoizedFn(handler);
  const ta = getTargetElement(target);

  // options 要使用者自行 memo，這裏不幫忙
  useEffect(() => {
    if (!ta) return;
    const listener = (e: Event) => latestHandler(e);
    ta.addEventListener(eventName, listener, options);
    return () => ta.removeEventListener(eventName, listener, options);
  }, [eventName, ta, options]);
}
