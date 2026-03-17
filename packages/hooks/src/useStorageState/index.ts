import { useState } from 'react';

import { useMemoizedFn } from '../useMemorizedFn';

type StateStorage = {
  getItem: (key: string) => string | null | undefined;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export function createStorageStateHook(getStorage: () => StateStorage | undefined) {
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

const cookieStorage: StateStorage = {
  getItem(key) {
    if (typeof document === 'undefined') return undefined;

    const match = document.cookie.split('; ').find(row => row.startsWith(key + '='));

    if (!match) return null;

    return decodeURIComponent(match.split('=')[1]);
  },

  setItem(key, value) {
    if (typeof document === 'undefined') return;
    // TODO: serialize value
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/`;
  },

  removeItem(key) {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  },
};

// TODO: cookieStorage 可再包裝成 createCookieStorage(cookieOptions)
// path?: string; domain?: string; expires?: Date; maxAge?: number; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none'
/**
 * export function useCookieState<T>(
  key: string,
  options: {
    defaultValue?: T | (() => T)
    cookieOptions?: CookieOptions
  } = {},
) {
  const { cookieOptions, ...storageOptions } = options

  const useStorageState = createStorageStateHook(() =>
    createCookieStorage(cookieOptions),
  )

  return useStorageState<T>(key, storageOptions)
}
 */
export const useCookieState = createStorageStateHook(() => cookieStorage);
