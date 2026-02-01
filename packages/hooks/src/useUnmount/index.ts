import { useEffect } from 'react';

import { useMemoizedFn } from '..';

/**
 * Executing the function right before the component is unmounted.
 * @param fn
 */
export function useUnmount(fn: () => void) {
  const memoizedFn = useMemoizedFn(fn);
  useEffect(() => {
    return () => memoizedFn?.();
  }, []);
}
