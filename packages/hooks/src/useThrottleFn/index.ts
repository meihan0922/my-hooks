import { useRef } from 'react';

import { useMemoizedFn } from '../useMemorizedFn';
import { useUnmount } from '../useUnmount';

type Options = {
  wait?: number;
  leading?: boolean;
  // 指的是計時器結束後，才執行最後一次觸發的函數
  trailing?: boolean;
};

export function useThrottleFn<T extends (...args: any[]) => any>(
  fn: T,
  { wait = 1000, leading = true, trailing = true }: Options = { wait: 1000, leading: true, trailing: true },
) {
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const fnRef = useMemoizedFn(fn);

  const invoke = (args: Parameters<T>) => fnRef(...args);

  const startTimer = () => {
    timerIdRef.current = setTimeout(() => {
      timerIdRef.current = null;
      if (lastArgsRef.current !== null) {
        if (trailing) {
          const args = lastArgsRef.current;
          invoke(args);
        }
        lastArgsRef.current = null;
      }
    }, wait);
  };

  const cancel = useMemoizedFn(() => {
    if (timerIdRef.current !== null) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    lastArgsRef.current = null;
  });

  // flush: 把等待的 fn 變成立刻執行，所以 trailing: false 表示根本沒有事後必須要跑的 fn，也就直接 return
  const flush = useMemoizedFn(() => {
    if (lastArgsRef.current === null || timerIdRef.current === null) return;
    if (!trailing) return;
    const args = lastArgsRef.current;
    cancel();
    return invoke(args);
  });

  const run = useMemoizedFn((...args: Parameters<T>) => {
    if (!trailing && !leading) return;

    lastArgsRef.current = args; // 給 trailing 用

    if (timerIdRef.current === null) {
      if (leading) {
        lastArgsRef.current = null;
        invoke(args);
      }
      startTimer();
      return;
    }
  });

  useUnmount(cancel);

  return {
    run,
    cancel,
    flush,
  };
}
