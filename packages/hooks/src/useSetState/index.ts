import { useState } from 'react';

import { useMemoizedFn } from '..';

export type SetStateAction<S> = Partial<S> | ((prevState: Readonly<S>) => Partial<S>);
export type SetState<S> = (patch: SetStateAction<S>) => void;

/**
 * Work similar to `this.setState` of class component. It will auto merge the new object into old state or updating with callback.
 * @param initialState
 * @return [state, setState]
 */
export function useSetState<T extends Record<string, unknown>>(initialState: T | (() => T)): [T, SetState<T>] {
  const [state, setState] = useState<T>(initialState);

  // 使用者可能這樣使用 setState({ a: 1 }); 或 setState(prev => ({ b: prev.b + 1 }));
  const setMergeState: SetState<T> = useMemoizedFn(patch => {
    setState(prev => {
      const newState = typeof patch === 'function' ? patch(prev) : patch;
      // 如果使用者傳不是 object 的東西，runtime error ，不用寫 Guard
      return { ...prev, ...newState };
    });
  });

  return [state, setMergeState];
}
