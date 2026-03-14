import { useRef } from 'react';

import { useMemoizedFn } from '..';

export function useLockFn<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  const lockRef = useRef(false);
  const memoizedFn = useMemoizedFn(fn);

  const lockedFn = useMemoizedFn(async (...args: Parameters<T>) => {
    if (lockRef.current) return;
    lockRef.current = true;
    try {
      return await memoizedFn(...args);
    } finally {
      lockRef.current = false;
    }
  });

  return lockedFn as T;
}
