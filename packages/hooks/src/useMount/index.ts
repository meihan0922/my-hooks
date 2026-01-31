import { useEffect } from 'react';

import { useMemoizedFn } from '../useMemorizedFn';

/**
 * Executing the function right the component is mounted.
 * @param fn
 */
export function useMount(fn: () => void) {
  const memoizedFn = useMemoizedFn(fn);
  useEffect(() => {
    memoizedFn?.();
  }, []);
}
