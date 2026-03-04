import { useRef } from 'react';

import { useMemoizedFn } from '../useMemorizedFn';
import { useUnmount } from '../useUnmount';

type Options = {
  wait?: number;
};

export function useDebounceFn<T extends (...args: any[]) => any>(fn: T, { wait = 1000 }: Options = { wait: 1000 }) {
  // 1. 計時器 id
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 2. 記憶參數
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  // 3. 記憶 fn，避免 stale closure
  const fnRef = useMemoizedFn(fn);

  const cancel = useMemoizedFn(() => {
    if (timerIdRef.current !== null) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    // 不管有沒有執行，都重置 lastArgsRef
    lastArgsRef.current = null;
  });

  const flush = useMemoizedFn(() => {
    // 如果沒有計時器或是沒有參數，則不執行（沒有參數只會在取消時出現，所以這裡是避免 cancel 後還執行）
    if (timerIdRef.current === null || lastArgsRef.current === null) return;
    // 先記著參數，避免 cancel 後把參數清空
    const args = lastArgsRef.current;
    // 先取消 pending（避免 flush 後又被 timer 再跑一次）
    cancel();
    return fnRef(...args);
  });

  const run = useMemoizedFn((...args: Parameters<T>) => {
    cancel();
    lastArgsRef.current = args;
    timerIdRef.current = setTimeout(() => {
      flush();
    }, wait);
  });

  useUnmount(cancel);

  return {
    run,
    cancel,
    flush,
  };
}
