import { useEffect, useRef } from 'react';

import { useMemoizedFn } from '../';

export function useEventEmitter<T>() {
  const listeners = useRef(new Set<(v: T) => void>());

  const emit = useMemoizedFn((value: T) => {
    listeners.current.forEach(listener => listener(value));
  });

  const useSubscription: (callback: (val: T) => void) => void = callback => {
    const callbackRef = useMemoizedFn(callback);

    useEffect(() => {
      const handler = (value: T) => callbackRef(value);

      listeners.current.add(handler);
      return () => {
        listeners.current.delete(handler);
      };
    }, []);
  };

  return {
    emit,
    useSubscription,
  };
}
