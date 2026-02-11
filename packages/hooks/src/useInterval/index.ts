import { useEffect, useRef } from 'react';

import { useLatest, useMemoizedFn } from '..';

export function useInterval(fn: () => void, delay?: number | null) {
  // callback 永遠是最新（不 stale closure）
  const fnRef = useLatest(fn);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useMemoizedFn(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  });

  // delay 變了會重設 interval
  useEffect(() => {
    // delay = null/undefined 時暫停
    if (delay == null) {
      clear();
      return;
    }

    timerRef.current = setInterval(() => {
      fnRef.current();
    }, delay);

    return clear;
  }, [delay, clear]);

  return clear;
}
