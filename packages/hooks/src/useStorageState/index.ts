import { useState } from 'react';

import { useMemoizedFn } from '../useMemorizedFn';

type GetStorage = () => Storage | undefined;

function createStorageStateHook(getStorage: GetStorage) {
  return function useStorageState<T>(
    key: string,
    options: {
      defaultValue?: T | (() => T);
    } = {},
  ) {
    const [state, setState] = useState<T | undefined>(() => {
      const storage = getStorage();

      const defaultValue =
        options.defaultValue && typeof options.defaultValue === 'function'
          ? (options.defaultValue as () => T)()
          : options.defaultValue;

      if (!storage) return defaultValue;
      const value = storage.getItem(key);

      if (value) {
        try {
          return JSON.parse(value);
        } catch (error) {
          console.error(`Error parsing storage item ${key}:`, error);
          return defaultValue;
        }
      }

      return defaultValue;
    });

    const setValue = useMemoizedFn((value: React.SetStateAction<T | undefined>) => {
      setState(prev => {
        const nextValue = typeof value === 'function' ? (value as (prev: T | undefined) => T | undefined)(prev) : value;

        try {
          const storage = getStorage();

          if (storage) {
            if (nextValue === undefined) {
              storage.removeItem(key);
            } else {
              storage.setItem(key, JSON.stringify(nextValue));
            }
          }
        } catch (error) {
          console.error(`Error setting storage item ${key}:`, error);
        }

        return nextValue;
      });
    });

    return [state, setValue] as const;
  };
}

export const useLocalStorageState = createStorageStateHook(() =>
  typeof window === 'undefined' ? undefined : window.localStorage,
);

export const useSessionStorageState = createStorageStateHook(() =>
  typeof window === 'undefined' ? undefined : window.sessionStorage,
);
